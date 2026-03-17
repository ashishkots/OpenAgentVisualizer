from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.agent import Agent
from app.models.gamification import XPTransaction
from app.schemas.gamification import LeaderboardEntry, XPTransactionRead

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent)
        .where(Agent.workspace_id == workspace_id)
        .order_by(desc(Agent.xp_total))
        .limit(20)
    )
    agents = result.scalars().all()
    return [
        LeaderboardEntry(
            agent_id=a.id,
            name=a.name,
            level=a.level,
            xp_total=a.xp_total,
            rank=i + 1,
        )
        for i, a in enumerate(agents)
    ]


@router.get("/agents/{agent_id}/xp", response_model=List[XPTransactionRead])
async def get_agent_xp_history(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(XPTransaction)
        .where(XPTransaction.agent_id == agent_id, XPTransaction.workspace_id == workspace_id)
        .order_by(XPTransaction.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()
