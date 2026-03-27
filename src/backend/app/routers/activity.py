"""Activity feed endpoint.

GET /api/workspaces/activity — paginated workspace activity log
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.activity import ActivityFeed
from app.schemas.activity import ActivityRead

router = APIRouter(prefix="/api/workspaces", tags=["collaboration"])


@router.get("/activity", response_model=list[ActivityRead])
async def list_activity(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ActivityRead]:
    """Return paginated activity feed for the workspace, newest first."""
    result = await db.execute(
        select(ActivityFeed)
        .where(ActivityFeed.workspace_id == workspace_id)
        .order_by(ActivityFeed.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())
