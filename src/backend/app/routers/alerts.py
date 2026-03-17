from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, WorkspaceMember
from app.models.gamification import Alert
from app.schemas.alert import AlertRead

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


async def _get_workspace_id(user: User, db: AsyncSession) -> str:
    member = await db.scalar(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(asc(WorkspaceMember.id))
    )
    return member.workspace_id if member else "unknown"


@router.get("", response_model=List[AlertRead])
async def list_alerts(
    resolved: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    result = await db.execute(
        select(Alert).where(
            Alert.workspace_id == workspace_id,
            Alert.resolved == resolved,
        ).order_by(Alert.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/{alert_id}", response_model=AlertRead)
async def resolve_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    alert = await db.scalar(
        select(Alert).where(Alert.id == alert_id, Alert.workspace_id == workspace_id)
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    await db.commit()
    await db.refresh(alert)
    return alert
