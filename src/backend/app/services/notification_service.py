"""Service layer for the notification center.

All functions operate on an async SQLAlchemy session and are safe to call
from both FastAPI route handlers and Celery tasks (via a sync DB session
wrapper).
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    notification_type: str,
    title: str,
    body: Optional[str] = None,
    link: Optional[str] = None,
) -> Notification:
    """Persist a new notification row and return it."""
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
    await db.commit()
    await db.refresh(notif)
    return notif


async def get_notifications(
    db: AsyncSession,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
) -> list[Notification]:
    """Return paginated notifications for a user, newest first."""
    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.read == False)  # noqa: E712
    query = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_unread_count(db: AsyncSession, user_id: str) -> int:
    """Return the count of unread notifications for a user."""
    result = await db.execute(
        select(func.count()).where(
            Notification.user_id == user_id,
            Notification.read == False,  # noqa: E712
        )
    )
    return result.scalar() or 0


async def mark_read(db: AsyncSession, notification_id: str, user_id: str) -> bool:
    """Mark a single notification as read.  Returns False when not found."""
    result = await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(read=True)
    )
    await db.commit()
    return result.rowcount > 0


async def mark_all_read(db: AsyncSession, user_id: str) -> int:
    """Mark every unread notification as read.  Returns count of updated rows."""
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
        .values(read=True)
    )
    await db.commit()
    return result.rowcount
