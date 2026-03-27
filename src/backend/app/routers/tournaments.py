"""Tournament endpoints — list, detail, enter, and leaderboard."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.tournament import Tournament, TournamentEntry
from app.models.agent import Agent
from app.schemas.tournament import (
    TournamentRead,
    TournamentDetailRead,
    TournamentEntryRead,
    TournamentLeaderboardResponse,
    TournamentLeaderboardEntry,
)
from app.services import wallet_service

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


@router.get("", response_model=List[TournamentRead])
async def list_tournaments(
    status: Optional[str] = Query(None, pattern="^(upcoming|active|completed)$"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[TournamentRead]:
    """List tournaments for the workspace, optionally filtered by status."""
    stmt = select(Tournament).where(Tournament.workspace_id == workspace_id)
    if status:
        stmt = stmt.where(Tournament.status == status)
    stmt = stmt.order_by(Tournament.start_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{tournament_id}", response_model=TournamentDetailRead)
async def get_tournament(
    tournament_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TournamentDetailRead:
    """Get tournament detail including all entries."""
    tournament = await db.scalar(
        select(Tournament).where(
            Tournament.id == tournament_id,
            Tournament.workspace_id == workspace_id,
        )
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament


@router.post("/{tournament_id}/enter", response_model=TournamentEntryRead, status_code=201)
async def enter_tournament(
    tournament_id: str,
    agent_id: str = Query(..., description="ID of the agent entering the tournament"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TournamentEntryRead:
    """Enter an agent into a tournament, debiting the entry fee from the workspace wallet."""
    tournament = await db.scalar(
        select(Tournament).where(
            Tournament.id == tournament_id,
            Tournament.workspace_id == workspace_id,
        )
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if tournament.status not in ("upcoming", "active"):
        raise HTTPException(status_code=400, detail="Tournament is not accepting entries")

    # Verify agent belongs to this workspace
    agent = await db.scalar(
        select(Agent).where(
            Agent.id == agent_id,
            Agent.workspace_id == workspace_id,
        )
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found in this workspace")

    # Check for duplicate entry
    existing = await db.scalar(
        select(TournamentEntry).where(
            TournamentEntry.tournament_id == tournament_id,
            TournamentEntry.agent_id == agent_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Agent already entered this tournament")

    # Debit entry fee
    if tournament.entry_fee > 0:
        try:
            await wallet_service.debit(
                db=db,
                workspace_id=workspace_id,
                amount=tournament.entry_fee,
                tx_type="tournament_entry",
                reference_id=tournament_id,
                description=f"Entry fee for tournament '{tournament.name}'",
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        tournament.prize_pool += tournament.entry_fee
        db.add(tournament)

    entry = TournamentEntry(
        tournament_id=tournament_id,
        agent_id=agent_id,
        score=0.0,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/{tournament_id}/leaderboard", response_model=TournamentLeaderboardResponse)
async def get_tournament_leaderboard(
    tournament_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TournamentLeaderboardResponse:
    """Get ranked tournament leaderboard with agent names and scores."""
    tournament = await db.scalar(
        select(Tournament).where(
            Tournament.id == tournament_id,
            Tournament.workspace_id == workspace_id,
        )
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    result = await db.execute(
        select(TournamentEntry, Agent)
        .join(Agent, Agent.id == TournamentEntry.agent_id)
        .where(TournamentEntry.tournament_id == tournament_id)
        .order_by(TournamentEntry.score.desc())
    )
    rows = result.all()

    leaderboard_entries = [
        TournamentLeaderboardEntry(
            rank=idx + 1,
            agent_id=entry.agent_id,
            agent_name=agent.name,
            score=entry.score,
            prize_awarded=entry.prize_awarded,
        )
        for idx, (entry, agent) in enumerate(rows)
    ]

    return TournamentLeaderboardResponse(
        tournament_id=tournament_id,
        entries=leaderboard_entries,
    )
