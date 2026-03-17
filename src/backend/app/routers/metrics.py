from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, WorkspaceMember
from app.models.metrics import MetricsRaw, MetricsAgg

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


async def _get_workspace_id(user: User, db: AsyncSession) -> str:
    member = await db.scalar(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(asc(WorkspaceMember.id))
    )
    return member.workspace_id if member else "unknown"


@router.get("/costs")
async def get_costs(
    agent_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return cost summary for the workspace, optionally filtered by agent."""
    workspace_id = await _get_workspace_id(current_user, db)
    query = select(
        MetricsRaw.agent_id,
        func.sum(MetricsRaw.cost_usd).label("total_cost"),
        func.sum(MetricsRaw.total_tokens).label("total_tokens"),
    ).where(MetricsRaw.workspace_id == workspace_id).group_by(MetricsRaw.agent_id)

    if agent_id:
        query = query.where(MetricsRaw.agent_id == agent_id)

    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "agent_id": row.agent_id,
            "total_cost_usd": float(row.total_cost or 0),
            "total_tokens": row.total_tokens or 0,
        }
        for row in rows
    ]


@router.get("/tokens")
async def get_tokens(
    agent_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return token usage summary for the workspace."""
    workspace_id = await _get_workspace_id(current_user, db)
    query = select(
        MetricsRaw.agent_id,
        MetricsRaw.model,
        func.sum(MetricsRaw.prompt_tokens).label("prompt_tokens"),
        func.sum(MetricsRaw.completion_tokens).label("completion_tokens"),
        func.sum(MetricsRaw.total_tokens).label("total_tokens"),
    ).where(MetricsRaw.workspace_id == workspace_id).group_by(
        MetricsRaw.agent_id, MetricsRaw.model
    )

    if agent_id:
        query = query.where(MetricsRaw.agent_id == agent_id)

    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "agent_id": row.agent_id,
            "model": row.model,
            "prompt_tokens": row.prompt_tokens or 0,
            "completion_tokens": row.completion_tokens or 0,
            "total_tokens": row.total_tokens or 0,
        }
        for row in rows
    ]
