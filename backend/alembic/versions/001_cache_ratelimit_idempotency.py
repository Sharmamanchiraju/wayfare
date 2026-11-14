"""cache_ratelimit_idempotency

Revision ID: 001_cache_ratelimit_idempotency
Revises: 4ea7f5756a33
Create Date: 2026-08-22

"""
from alembic import op
import sqlalchemy as sa

revision = '001_cache_ratelimit_idempotency'
down_revision = '4ea7f5756a33'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. api_cache
    op.execute(sa.text("""
    CREATE TABLE IF NOT EXISTS api_cache (
        key        TEXT PRIMARY KEY,
        value      TEXT        NOT NULL,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """))

    op.execute(sa.text("""
    CREATE INDEX IF NOT EXISTS idx_api_cache_expires
        ON api_cache (expires_at)
        WHERE expires_at IS NOT NULL;
    """))

    # 2. api_rate_limits
    op.execute(sa.text("""
    CREATE TABLE IF NOT EXISTS api_rate_limits (
        bucket            TEXT PRIMARY KEY,
        next_available_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """))

    op.execute(sa.text("""
    ALTER TABLE api_rate_limits SET (fillfactor = 70);
    """))

    op.execute(sa.text("""
    INSERT INTO api_rate_limits (bucket, next_available_at)
    VALUES ('nominatim', now()), ('overpass', now())
    ON CONFLICT (bucket) DO NOTHING;
    """))

    # 3. idempotency_keys
    op.execute(sa.text("""
    CREATE TABLE IF NOT EXISTS idempotency_keys (
        id           BIGSERIAL PRIMARY KEY,
        scoped_key   TEXT        NOT NULL UNIQUE,
        status       TEXT        NOT NULL DEFAULT 'in_flight'
                     CHECK (status IN ('in_flight', 'completed')),
        response     JSONB,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ
    );
    """))

    op.execute(sa.text("""
    CREATE INDEX IF NOT EXISTS idx_idempotency_created
        ON idempotency_keys (created_at);
    """))

    # 4. Indexes for existing tables
    op.execute(sa.text("""
    CREATE INDEX IF NOT EXISTS idx_trips_user_start
        ON trips (user_id, start_date DESC);
    """))

    op.execute(sa.text("""
    CREATE INDEX IF NOT EXISTS idx_messages_trip_created
        ON messages (trip_id, created_at);
    """))

    # 5. Soft delete
    op.execute(sa.text("""
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    """))

    op.execute(sa.text("""
    CREATE INDEX IF NOT EXISTS idx_trips_active
        ON trips (user_id, start_date DESC)
        WHERE deleted_at IS NULL;
    """))


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS idx_trips_active;"))
    op.execute(sa.text("ALTER TABLE trips DROP COLUMN IF EXISTS deleted_at;"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_messages_conversation_created;"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_trips_user_start;"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_idempotency_created;"))
    op.execute(sa.text("DROP TABLE IF EXISTS idempotency_keys;"))
    op.execute(sa.text("DROP TABLE IF EXISTS api_rate_limits;"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_api_cache_expires;"))
    op.execute(sa.text("DROP TABLE IF EXISTS api_cache;"))
