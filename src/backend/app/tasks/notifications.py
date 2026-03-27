"""Celery tasks for the notification center.

Notification creation is offloaded here so route handlers can fire-and-forget
without waiting on the database write.  The task runs in the ``critical`` queue
to keep user-visible latency low.
"""

from __future__ import annotations

import uuid
from typing import Optional

from app.core.celery_app import celery_app, QUEUE_CRITICAL


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
    name="app.tasks.notifications.send_notification",
    queue=QUEUE_CRITICAL,
    bind=True,
    max_retries=3,
    default_retry_delay=10,
)
def send_notification(
    self,
    workspace_id: str,
    user_id: str,
    notification_type: str,
    title: str,
    body: Optional[str] = None,
    link: Optional[str] = None,
) -> str:
    """Persist a notification row in the database.

    Returns the new notification ID so callers can correlate results.
    Retries up to 3 times on transient DB errors.
    """
    from app.models.notification import Notification

    db = _get_sync_db()
    try:
        notif = Notification(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            user_id=user_id,
            type=notification_type,
            title=title,
            body=body,
            link=link,
        )
        db.add(notif)
        db.commit()
        return notif.id
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()
