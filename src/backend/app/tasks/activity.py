"""Celery task: prune old activity feed entries.

Runs daily via Celery beat and deletes rows older than 90 days to keep the
activity_feed table from growing without bound.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.celery_app import celery_app, QUEUE_BULK


def _get_sync_db():
    """Return a synchronous SQLAlchemy session for use inside Celery tasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


@celery_app.task(
    name="app.tasks.activity.prune_activity",
    queue=QUEUE_BULK,
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def prune_activity(self) -> int:
    """Delete activity_feed rows older than 90 days.

    Returns the count of deleted rows.
    """
    from sqlalchemy import delete

    from app.models.activity import ActivityFeed

    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=90)
    db = _get_sync_db()
    try:
        result = db.execute(
            delete(ActivityFeed).where(ActivityFeed.created_at < cutoff)
        )
        db.commit()
        return result.rowcount
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()
