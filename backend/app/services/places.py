"""
Places, with honest failure.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum

import httpx

from app.db.storage import PgCache, PgRateLimiter, RateLimitTimeout

log = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
CACHE_TTL = 60 * 60 * 24 * 14
STALE_SERVE_LIMIT_DAYS = 45


class Provenance(str, Enum):
    LIVE = "live"
    CACHED = "cached"
    NONE = "none"


@dataclass(frozen=True, slots=True)
class Place:
    name: str
    lat: float
    lon: float
    category: str
    osm_id: int


@dataclass(slots=True)
class PlacesResult:
    """
    Carry provenance with the data so it can't be lost downstream.

    `notice` is user-facing copy. Show it. An itinerary day with an empty Places
    section and "Couldn't load places — retry" is a better product than a full one
    you can't trust.
    """

    places: list[Place] = field(default_factory=list)
    provenance: Provenance = Provenance.NONE
    fetched_at: datetime | None = None
    notice: str | None = None

    @property
    def is_real(self) -> bool:
        """The gate. False means nothing here may be rendered as a real business."""
        return self.provenance in (Provenance.LIVE, Provenance.CACHED) and bool(self.places)

    def age_days(self) -> int | None:
        if not self.fetched_at:
            return None
        return (datetime.now(timezone.utc) - self.fetched_at).days


CATEGORY_FILTERS = {
    "hotel": '["tourism"~"hotel|guest_house|hostel|apartment"]',
    "food": '["amenity"~"restaurant|cafe"]',
    "sightseeing": '["tourism"~"attraction|museum|viewpoint|artwork"]',
}


class PlacesService:
    def __init__(self, cache: PgCache, limiter: PgRateLimiter):
        self._cache = cache
        self._limiter = limiter
        headers = {"User-Agent": "TripPlannerAgent/1.0 (contact@tripplanner.ai)"}
        self._client = httpx.AsyncClient(headers=headers, timeout=httpx.Timeout(25.0, connect=5.0))

    async def aclose(self) -> None:
        await self._client.aclose()

    async def find(
        self, lat: float, lon: float, category: str, radius_m: int = 5000
    ) -> PlacesResult:
        key = f"places:v1:{lat:.3f},{lon:.3f}:{category}:{radius_m}"

        if hit := await self._cache.get_json(key):
            fetched = datetime.fromisoformat(hit["fetched_at"])
            if (datetime.now(timezone.utc) - fetched).total_seconds() < CACHE_TTL:
                return PlacesResult(
                    places=[Place(**p) for p in hit["places"]],
                    provenance=Provenance.CACHED,
                    fetched_at=fetched,
                )

        try:
            places = await self._query_overpass(lat, lon, category, radius_m)
            now = datetime.now(timezone.utc)
            await self._cache.set_json(
                key,
                {"places": [asdict(p) for p in places], "fetched_at": now.isoformat()},
                ex=CACHE_TTL * 4,
            )
            if places:
                return PlacesResult(places=places, provenance=Provenance.LIVE, fetched_at=now)
            log.info("overpass returned zero %s near %s,%s", category, lat, lon)
        except (httpx.HTTPError, RateLimitTimeout) as e:
            log.warning("overpass failed for %s near %s,%s: %s", category, lat, lon, e)

        return await self._stale_or_nothing(key, category)

    async def _stale_or_nothing(self, key: str, category: str) -> PlacesResult:
        """
        Expired-but-real data beats invented data by a wide margin.
        """
        if hit := await self._cache.get_json(key):
            fetched = datetime.fromisoformat(hit["fetched_at"])
            age = (datetime.now(timezone.utc) - fetched).days
            if age <= STALE_SERVE_LIMIT_DAYS and hit["places"]:
                return PlacesResult(
                    places=[Place(**p) for p in hit["places"]],
                    provenance=Provenance.CACHED,
                    fetched_at=fetched,
                    notice=f"Places last updated {age} day{'s' if age != 1 else ''} ago.",
                )

        return PlacesResult(
            provenance=Provenance.NONE,
            notice=f"Couldn't load {category} options right now. Tap to retry.",
        )

    async def _query_overpass(
        self, lat: float, lon: float, category: str, radius_m: int
    ) -> list[Place]:
        filt = CATEGORY_FILTERS.get(category)
        if not filt:
            raise ValueError(f"Unknown category: {category}")

        await self._limiter.acquire()

        query = f"""
        [out:json][timeout:20];
        (
          node{filt}(around:{radius_m},{lat},{lon});
          way{filt}(around:{radius_m},{lat},{lon});
        );
        out center 40;
        """
        r = await self._client.post(OVERPASS_URL, data={"data": query})
        r.raise_for_status()

        out: list[Place] = []
        for el in r.json().get("elements", []):
            name = (el.get("tags") or {}).get("name")
            if not name:
                continue
            plat = el.get("lat") or (el.get("center") or {}).get("lat")
            plon = el.get("lon") or (el.get("center") or {}).get("lon")
            if plat is None or plon is None:
                continue
            out.append(
                Place(
                    name=name,
                    lat=float(plat),
                    lon=float(plon),
                    category=category,
                    osm_id=int(el.get("id", 0)),
                )
            )
        return out


def places_context_for_model(result: PlacesResult, category: str) -> str:
    """
    Build the prompt fragment for the itinerary generator.
    """
    if result.is_real:
        listing = "\n".join(f"- {p.name}" for p in result.places[:25])
        prefix = (
            f"Verified {category} options near the destination"
            + (f" (data is {result.age_days()} days old)" if result.provenance is Provenance.CACHED else "")
            + ":"
        )
        return f"{prefix}\n{listing}\n\nUse ONLY names from this list. Do not add others."

    return (
        f"No verified {category} data is available for this destination.\n"
        f"You MUST NOT invent {category} names, addresses, ratings, or prices.\n"
        f"Describe the activity generically instead — reference areas or "
        f"neighbourhoods, not named businesses — and note that specific "
        f"recommendations are unavailable."
    )


async def geocode_city(place_name: str) -> dict:
    from app.tools.agent_tools import geocode_location
    return await geocode_location.ainvoke({"place_name": place_name})


def clean_destination(raw: str) -> str:
    if not raw:
        return ""
    import re
    cleaned = re.sub(r'^(?:hello|hi|hey|trip\s+to|going\s+to|visit)\s+', '', raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+(?:trip|vacation|tour|holiday)$', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()
