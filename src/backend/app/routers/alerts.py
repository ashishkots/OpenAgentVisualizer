from fastapi import APIRouter, Depends, HTTPException, Query
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
    limit: int = Query(50, ge=1, le=200, description="Maximum number of alerts to return"),
    offset: int = Query(0, ge=0, description="Number of alerts to skip"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    """List alerts in the authenticated workspace with optional pagination."""
    result = await db.execute(
        select(Alert)
        .where(
            Alert.workspace_id == workspace_id,
            Alert.resolved == resolved,
        )
        .order_by(Alert.created_at.desc())
        .offset(offset)
        .limit(limit)
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
