from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, WorkspaceMember
from app.models.agent import Agent
from app.models.gamification import XPTransaction

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


async def _get_workspace_id(user: User, db: AsyncSession) -> str:
    member = await db.scalar(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(asc(WorkspaceMember.id))
    )
    return member.workspace_id if member else "unknown"


@router.get("/leaderboard")
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    result = await db.execute(
        select(Agent)
        .where(Agent.workspace_id == workspace_id)
        .order_by(desc(Agent.xp_total))
        .limit(20)
    )
    agents = result.scalars().all()
    return [
        {
            "agent_id": a.id,
            "name": a.name,
            "level": a.level,
            "xp_total": a.xp_total,
            "rank": i + 1,
        }
        for i, a in enumerate(agents)
    ]


@router.get("/agents/{agent_id}/xp")
async def get_agent_xp_history(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    result = await db.execute(
        select(XPTransaction)
        .where(XPTransaction.agent_id == agent_id, XPTransaction.workspace_id == workspace_id)
        .order_by(XPTransaction.created_at.desc())
        .limit(100)
    )
    return [
        {
            "id": t.id,
            "xp_delta": t.xp_delta,
            "reason": t.reason,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in result.scalars().all()
    ]
