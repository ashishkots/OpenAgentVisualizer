import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import Workspace
from app.models.agent import Agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    # "default" is a special alias — resolve to any existing workspace or return default info
    if workspace_id == "default":
        # Count agents for a general response
        try:
            count_result = await db.execute(select(func.count()).select_from(Agent))
            agent_count = count_result.scalar() or 0
        except Exception as e:
            logger.warning("Failed to query agent count for workspace %s: %s", workspace_id, e)
            agent_count = 0
        return {
            "workspace_id": "default",
            "name": "Default Workspace",
            "agent_count": agent_count,
            "endpoint": settings.OAV_PUBLIC_URL,
        }

    # Look up workspace by slug or id
    ws = await db.scalar(
        select(Workspace).where(
            (Workspace.slug == workspace_id) | (Workspace.id == workspace_id)
        )
    )
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found")

    # Count agents for this workspace
    try:
        count_result = await db.execute(
            select(func.count()).select_from(Agent).where(Agent.workspace_id == ws.id)
        )
        agent_count = count_result.scalar() or 0
    except Exception as e:
        logger.warning("Failed to query agent count for workspace %s: %s", workspace_id, e)
        agent_count = 0

    return {
        "workspace_id": workspace_id,
        "name": ws.name,
        "agent_count": agent_count,
        "endpoint": settings.OAV_PUBLIC_URL,
    }
