from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.schemas.notification import NotificationRead, UnreadCountResponse
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    unread: bool = Query(default=False),
) -> list[NotificationRead]:
    """Return paginated notifications for the authenticated user."""
    return await notification_service.get_notifications(db, user_id, limit, offset, unread)


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UnreadCountResponse:
    """Return the number of unread notifications for the authenticated user."""
    count = await notification_service.get_unread_count(db, user_id)
    return UnreadCountResponse(count=count)


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mark a single notification as read."""
    success = await notification_service.mark_read(db, notification_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_notifications_read(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mark all unread notifications as read for the authenticated user."""
    count = await notification_service.mark_all_read(db, user_id)
    return {"marked_read": count}
