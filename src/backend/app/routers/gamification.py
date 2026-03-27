from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, text
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.agent import Agent
from app.models.gamification import XPTransaction
from app.models.achievement import Achievement
from app.schemas.gamification import LeaderboardEntry, LeaderboardResponse, XPTransactionRead
from app.schemas.achievement import AchievementRead, AchievementDefinitionRead
from app.services.achievement_definitions import ACHIEVEMENT_DEFS

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


def _period_to_cutoff(period: str) -> Optional[datetime]:
    """Return the UTC cutoff datetime for a leaderboard period."""
    now = datetime.now(timezone.utc)
    match period:
        case "daily":
            return now - timedelta(days=1)
        case "weekly":
            return now - timedelta(weeks=1)
        case "monthly":
            return now - timedelta(days=30)
        case _:
            return None  # all_time


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: str = Query("all_time", pattern="^(daily|weekly|monthly|all_time)$"),
    category: str = Query("xp", pattern="^(xp|tasks|cost_efficiency|streaks)$"),
    limit: int = Query(50, le=100),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> LeaderboardResponse:
    """Return the agent leaderboard with time-scoping and category support.

    - period: daily | weekly | monthly | all_time
    - category: xp (default) | tasks | cost_efficiency | streaks
    """
    cutoff = _period_to_cutoff(period)

    if category == "xp" and cutoff is not None:
        # Time-scoped XP: sum xp_transactions within the period
        xp_subq = (
            select(
                XPTransaction.agent_id,
                func.sum(XPTransaction.xp_delta).label("period_xp"),
            )
            .where(
                XPTransaction.workspace_id == workspace_id,
                XPTransaction.created_at >= cutoff,
            )
            .group_by(XPTransaction.agent_id)
            .subquery()
        )
        result = await db.execute(
            select(Agent, xp_subq.c.period_xp)
            .outerjoin(xp_subq, Agent.id == xp_subq.c.agent_id)
            .where(Agent.workspace_id == workspace_id)
            .order_by(desc(xp_subq.c.period_xp))
            .limit(limit)
        )
        rows = result.all()
        agents_ordered = [(row[0], row[1] or 0) for row in rows]
    else:
        # all_time XP or other categories — sort by xp_total
        result = await db.execute(
            select(Agent)
            .where(Agent.workspace_id == workspace_id)
            .order_by(desc(Agent.xp_total))
            .limit(limit)
        )
        agents_ordered = [(a, a.xp_total) for a in result.scalars().all()]

    # Fetch achievement counts for all returned agents
    agent_ids = [a.id for a, _ in agents_ordered]
    ach_counts: dict[str, int] = {}
    if agent_ids:
        ach_result = await db.execute(
            select(Achievement.agent_id, func.count(Achievement.id).label("cnt"))
            .where(
                Achievement.workspace_id == workspace_id,
                Achievement.agent_id.in_(agent_ids),
            )
            .group_by(Achievement.agent_id)
        )
        for row in ach_result.all():
            ach_counts[row.agent_id] = row.cnt

    entries = [
        LeaderboardEntry(
            agent_id=a.id,
            name=a.name,
            level=a.level,
            xp_total=a.xp_total,
            rank=i + 1,
            achievement_count=ach_counts.get(a.id, 0),
            trend="same",
        )
        for i, (a, _) in enumerate(agents_ordered)
    ]

    return LeaderboardResponse(agents=entries, period=period, category=category)


@router.get("/agents/{agent_id}/xp", response_model=List[XPTransactionRead])
async def get_agent_xp_history(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[XPTransactionRead]:
    """Return the last 100 XP transactions for an agent."""
    result = await db.execute(
        select(XPTransaction)
        .where(
            XPTransaction.agent_id == agent_id,
            XPTransaction.workspace_id == workspace_id,
        )
        .order_by(XPTransaction.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.get("/achievements/definitions", response_model=List[AchievementDefinitionRead])
async def get_achievement_definitions() -> List[AchievementDefinitionRead]:
    """Return all static achievement definitions."""
    return [
        AchievementDefinitionRead(
            id=defn.id,
            name=defn.name,
            description=defn.description,
            condition_summary=defn.condition_summary,
            xp_bonus=defn.xp_bonus,
            icon=defn.icon,
        )
        for defn in ACHIEVEMENT_DEFS.values()
    ]


@router.get("/achievements/{agent_id}", response_model=List[AchievementRead])
async def get_agent_achievements(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[AchievementRead]:
    """Return all achievements earned by a specific agent."""
    # Verify the agent belongs to this workspace
    agent = await db.scalar(
        select(Agent).where(
            Agent.id == agent_id,
            Agent.workspace_id == workspace_id,
        )
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    result = await db.execute(
        select(Achievement)
        .where(
            Achievement.agent_id == agent_id,
            Achievement.workspace_id == workspace_id,
        )
        .order_by(Achievement.unlocked_at.asc())
    )
    return result.scalars().all()
