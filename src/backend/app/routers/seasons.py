"""Season endpoints — current season and seasonal leaderboard.

Season 1 is auto-created on first access if no active season exists.
"""

from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.season import Season, SeasonalXP
from app.models.agent import Agent
from app.schemas.season import (
    SeasonRead,
    SeasonLeaderboardEntry,
    SeasonLeaderboardResponse,
)

router = APIRouter(prefix="/api/seasons", tags=["seasons"])

SEASON_DURATION_DAYS = 30


async def _get_or_create_season(db: AsyncSession, workspace_id: str) -> Season:
    """Return the active season for a workspace, creating Season 1 if none exists."""
    season = await db.scalar(
        select(Season).where(
            Season.workspace_id == workspace_id,
            Season.status == "active",
        )
    )
    if season is None:
        now = datetime.utcnow()
        season = Season(
            workspace_id=workspace_id,
            name="Season 1: Genesis",
            number=1,
            start_at=now,
            end_at=now + timedelta(days=SEASON_DURATION_DAYS),
            status="active",
        )
        db.add(season)
        await db.commit()
        await db.refresh(season)
    return season


@router.get("/current", response_model=SeasonRead)
async def get_current_season(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> SeasonRead:
    """Return the currently active season, auto-creating Season 1 on first call."""
    season = await _get_or_create_season(db, workspace_id)
    now = datetime.utcnow()
    days_remaining = max(0, (season.end_at - now).days)
    return SeasonRead(
        id=season.id,
        workspace_id=season.workspace_id,
        name=season.name,
        number=season.number,
        start_at=season.start_at,
        end_at=season.end_at,
        status=season.status,
        days_remaining=days_remaining,
    )


@router.get("/{season_id}/leaderboard", response_model=SeasonLeaderboardResponse)
async def get_season_leaderboard(
    season_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> SeasonLeaderboardResponse:
    """Return the seasonal XP leaderboard ranked by XP descending."""
    season = await db.scalar(
        select(Season).where(
            Season.id == season_id,
            Season.workspace_id == workspace_id,
        )
    )
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    result = await db.execute(
        select(SeasonalXP, Agent)
        .join(Agent, Agent.id == SeasonalXP.agent_id)
        .where(SeasonalXP.season_id == season_id)
        .order_by(SeasonalXP.xp.desc())
    )
    rows = result.all()

    entries: List[SeasonLeaderboardEntry] = [
        SeasonLeaderboardEntry(
            rank=idx + 1,
            agent_id=sxp.agent_id,
            agent_name=agent.name,
            xp=sxp.xp,
            level=agent.level,
        )
        for idx, (sxp, agent) in enumerate(rows)
    ]

    return SeasonLeaderboardResponse(
        season_id=season_id,
        season_name=season.name,
        entries=entries,
    )
