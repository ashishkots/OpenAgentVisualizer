"""Challenge endpoints — list, detail, and per-contributor progress."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.challenge import Challenge, ChallengeProgress
from app.schemas.challenge import (
    ChallengeRead,
    ChallengeDetailRead,
    ChallengeProgressRead,
)

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


def _to_challenge_read(challenge: Challenge) -> ChallengeRead:
    """Map a Challenge ORM object to ChallengeRead schema with computed progress_pct."""
    progress_pct = (
        round((challenge.current_value / challenge.goal_value) * 100, 2)
        if challenge.goal_value > 0
        else 0.0
    )
    return ChallengeRead(
        id=challenge.id,
        workspace_id=challenge.workspace_id,
        name=challenge.name,
        description=challenge.description,
        type=challenge.type,
        goal_type=challenge.goal_type,
        goal_value=challenge.goal_value,
        current_value=challenge.current_value,
        reward_tokens=challenge.reward_tokens,
        reward_xp=challenge.reward_xp,
        start_at=challenge.start_at,
        end_at=challenge.end_at,
        status=challenge.status,
        progress_pct=progress_pct,
    )


@router.get("", response_model=List[ChallengeRead])
async def list_challenges(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[ChallengeRead]:
    """List active and recently completed/failed challenges for the workspace."""
    result = await db.execute(
        select(Challenge)
        .where(Challenge.workspace_id == workspace_id)
        .order_by(Challenge.end_at.asc())
    )
    challenges = result.scalars().all()
    return [_to_challenge_read(c) for c in challenges]


@router.get("/{challenge_id}", response_model=ChallengeDetailRead)
async def get_challenge(
    challenge_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> ChallengeDetailRead:
    """Get challenge detail including all progress entries."""
    challenge = await db.scalar(
        select(Challenge).where(
            Challenge.id == challenge_id,
            Challenge.workspace_id == workspace_id,
        )
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    result = await db.execute(
        select(ChallengeProgress).where(ChallengeProgress.challenge_id == challenge_id)
    )
    progress_entries = result.scalars().all()

    progress_pct = (
        round((challenge.current_value / challenge.goal_value) * 100, 2)
        if challenge.goal_value > 0
        else 0.0
    )

    return ChallengeDetailRead(
        id=challenge.id,
        workspace_id=challenge.workspace_id,
        name=challenge.name,
        description=challenge.description,
        type=challenge.type,
        goal_type=challenge.goal_type,
        goal_value=challenge.goal_value,
        current_value=challenge.current_value,
        reward_tokens=challenge.reward_tokens,
        reward_xp=challenge.reward_xp,
        start_at=challenge.start_at,
        end_at=challenge.end_at,
        status=challenge.status,
        progress_pct=progress_pct,
        progress_entries=list(progress_entries),
    )


@router.get("/{challenge_id}/progress", response_model=List[ChallengeProgressRead])
async def get_challenge_progress(
    challenge_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[ChallengeProgressRead]:
    """Get per-contributor progress breakdown for a challenge."""
    challenge = await db.scalar(
        select(Challenge).where(
            Challenge.id == challenge_id,
            Challenge.workspace_id == workspace_id,
        )
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    result = await db.execute(
        select(ChallengeProgress)
        .where(ChallengeProgress.challenge_id == challenge_id)
        .order_by(ChallengeProgress.contribution.desc())
    )
    return result.scalars().all()
