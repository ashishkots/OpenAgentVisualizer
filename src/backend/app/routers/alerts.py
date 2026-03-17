from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.gamification import Alert
from app.schemas.alert import AlertRead

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertRead])
async def list_alerts(
    resolved: bool = False,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
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
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    alert = await db.scalar(
        select(Alert).where(Alert.id == alert_id, Alert.workspace_id == workspace_id)
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    await db.commit()
    await db.refresh(alert)
    return alert
