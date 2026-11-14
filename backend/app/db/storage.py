"""
Cache, rate limiting, and idempotency on Postgres.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from app.db.database import engine

log = logging.getLogger(__name__)

AsyncStorageSession = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# --------------------------------------------------------------------------
# Cache
# --------------------------------------------------------------------------
@dataclass(slots=True)
class PgCache:
    """
    Key/value cache with TTL, backed by `api_cache`.

    Every method swallows storage errors and degrades to a miss. A cache that can
    take down the request path it was added to speed up is a net loss.
    """

    sessionmaker: async_sessionmaker[AsyncSession] = AsyncStorageSession

    async def get(self, key: str) -> str | None:
        try:
            async with self.sessionmaker() as s:
                row = (
                    await s.execute(
                        text(
                            "SELECT value FROM api_cache "
                            "WHERE key = :k AND (expires_at IS NULL OR expires_at > now())"
                        ),
                        {"k": key},
                    )
                ).scalar_one_or_none()
                return row
        except Exception:
            log.warning("cache read failed for %s", key, exc_info=True)
            return None

    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        try:
            async with self.sessionmaker() as s:
                await s.execute(
                    text(
                        """
                        INSERT INTO api_cache (key, value, expires_at)
                        VALUES (
                            :k,
                            :v,
                            CASE WHEN CAST(:ex AS integer) IS NULL THEN NULL
                                 ELSE now() + make_interval(secs => CAST(:ex AS integer))
                            END
                        )
                        ON CONFLICT (key) DO UPDATE
                          SET value = EXCLUDED.value,
                              expires_at = EXCLUDED.expires_at,
                              updated_at = now()
                        """
                    ),
                    {"k": key, "v": value, "ex": ex},
                )
                await s.commit()
                return True
        except Exception:
            log.warning("cache write failed for %s", key, exc_info=True)
            return False

    async def delete(self, key: str) -> None:
        try:
            async with self.sessionmaker() as s:
                await s.execute(text("DELETE FROM api_cache WHERE key = :k"), {"k": key})
                await s.commit()
        except Exception:
            log.warning("cache delete failed for %s", key, exc_info=True)

    async def get_json(self, key: str) -> Any | None:
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            await self.delete(key)
            return None

    async def set_json(self, key: str, value: Any, ex: int | None = None) -> bool:
        return await self.set(key, json.dumps(value), ex=ex)

    async def purge_expired(self) -> int:
        """Call from a nightly job. Expired rows are harmless but accumulate."""
        async with self.sessionmaker() as s:
            r = await s.execute(
                text("DELETE FROM api_cache WHERE expires_at IS NOT NULL AND expires_at < now()")
            )
            await s.commit()
            return r.rowcount or 0


# --------------------------------------------------------------------------
# Rate limiting
# --------------------------------------------------------------------------
class RateLimitTimeout(Exception):
    """Waited too long for a slot. Fail rather than hang the request."""


@dataclass(slots=True)
class PgRateLimiter:
    """
    Reserve-then-wait limiter, correct across processes and containers.
    """

    sessionmaker: async_sessionmaker[AsyncSession] = AsyncStorageSession
    bucket: str = "default"
    interval: timedelta = timedelta(milliseconds=1100)
    max_wait: timedelta = timedelta(seconds=30)

    async def acquire(self) -> None:
        secs = self.interval.total_seconds()
        try:
            async with self.sessionmaker() as s:
                slot_at = (
                    await s.execute(
                        text(
                            """
                            INSERT INTO api_rate_limits (bucket, next_available_at)
                            VALUES (:b, now() + make_interval(secs => :secs))
                            ON CONFLICT (bucket) DO UPDATE
                              SET next_available_at =
                                    GREATEST(now(), api_rate_limits.next_available_at)
                                    + make_interval(secs => :secs)
                            RETURNING EXTRACT(EPOCH FROM (next_available_at - now()))
                                      - :secs
                            """
                        ),
                        {"b": self.bucket, "secs": secs},
                    )
                ).scalar_one()
                await s.commit()
        except Exception:
            log.error("rate limiter unavailable for %s", self.bucket, exc_info=True)
            await asyncio.sleep(secs)
            return

        wait = max(float(slot_at), 0.0)
        if wait > self.max_wait.total_seconds():
            raise RateLimitTimeout(
                f"{self.bucket}: next slot is {wait:.1f}s away; giving up."
            )
        if wait > 0:
            await asyncio.sleep(wait)


# --------------------------------------------------------------------------
# Idempotency
# --------------------------------------------------------------------------
class IdempotencyConflict(Exception):
    """A request with this key is already in flight."""


@dataclass(slots=True)
class PgIdempotency:
    """
    Stops duplicate trip rows using database claims.
    """

    session: AsyncSession
    user_id: str
    key: str
    stale_after_seconds: int = 120

    @property
    def _scoped(self) -> str:
        return f"{self.user_id}:{self.key}"

    async def claim(self) -> dict | None:
        """None means proceed. A dict means replay this stored response."""
        inserted = (
            await self.session.execute(
                text(
                    """
                    INSERT INTO idempotency_keys (scoped_key, status)
                    VALUES (:k, 'in_flight')
                    ON CONFLICT (scoped_key) DO NOTHING
                    RETURNING id
                    """
                ),
                {"k": self._scoped},
            )
        ).scalar_one_or_none()

        if inserted is not None:
            return None

        row = (
            await self.session.execute(
                text(
                    """
                    SELECT status,
                           response,
                           created_at < now() - make_interval(secs => CAST(:stale AS integer))
                             AS abandoned
                    FROM idempotency_keys
                    WHERE scoped_key = :k
                    """
                ),
                {"k": self._scoped, "stale": self.stale_after_seconds},
            )
        ).one_or_none()

        if row is None:
            return None

        status, response, abandoned = row

        if status == "in_flight":
            if abandoned:
                await self.session.execute(
                    text(
                        "UPDATE idempotency_keys SET created_at = now() "
                        "WHERE scoped_key = :k AND status = 'in_flight'"
                    ),
                    {"k": self._scoped},
                )
                log.warning("reclaimed abandoned idempotency key %s", self._scoped)
                return None
            raise IdempotencyConflict("That request is still processing.")

        if isinstance(response, str):
            try:
                return json.loads(response)
            except Exception:
                return response
        return response

    async def complete(self, response: dict) -> None:
        """Call before commit so the key and the trip land together."""
        await self.session.execute(
            text(
                "UPDATE idempotency_keys "
                "SET status = 'completed', response = :r, completed_at = now() "
                "WHERE scoped_key = :k"
            ),
            {"k": self._scoped, "r": json.dumps(response)},
        )

    async def release(self) -> None:
        """On failure, free the key so a real retry isn't blocked by a dead claim."""
        await self.session.execute(
            text("DELETE FROM idempotency_keys WHERE scoped_key = :k AND status = 'in_flight'"),
            {"k": self._scoped},
        )
