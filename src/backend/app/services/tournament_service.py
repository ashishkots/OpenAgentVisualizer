"""Tournament service — scoring and prize distribution logic."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tournament import Tournament, TournamentEntry
from app.models.agent import Agent, Task


async def score_entries(
    db: AsyncSession,
    tournament: Tournament,
) -> None:
    """Recompute scores for all entries in an active tournament.

    Scoring strategy per tournament type:
    - speed: tasks_completed per hour during tournament window
    - accuracy: completed tasks ratio (completed / total)
    - cost_efficiency: tasks_completed / total_cost (higher is better)
    """
    result = await db.execute(
        select(TournamentEntry).where(TournamentEntry.tournament_id == tournament.id)
    )
    entries: List[TournamentEntry] = list(result.scalars().all())

    if not entries:
        return

    window_start = tournament.start_at
    window_end = min(tournament.end_at, datetime.utcnow())

    for entry in entries:
        agent_id = entry.agent_id

        completed_count: int = await db.scalar(
            select(func.count(Task.id)).where(
                Task.agent_id == agent_id,
                Task.status == "completed",
                Task.completed_at >= window_start,
                Task.completed_at <= window_end,
            )
        ) or 0

        total_count: int = await db.scalar(
            select(func.count(Task.id)).where(
                Task.agent_id == agent_id,
                Task.created_at >= window_start,
                Task.created_at <= window_end,
            )
        ) or 0

        total_cost: float = await db.scalar(
            select(func.coalesce(func.sum(Task.cost_usd), 0.0)).where(
                Task.agent_id == agent_id,
                Task.completed_at >= window_start,
                Task.completed_at <= window_end,
            )
        ) or 0.0

        duration_hours = max(
            (window_end - window_start).total_seconds() / 3600.0, 0.01
        )

        if tournament.type == "speed":
            entry.score = completed_count / duration_hours
        elif tournament.type == "accuracy":
            entry.score = (completed_count / total_count) if total_count > 0 else 0.0
        elif tournament.type == "cost_efficiency":
            entry.score = (completed_count / total_cost) if total_cost > 0 else float(completed_count)
        else:
            entry.score = float(completed_count)

        db.add(entry)


async def finalize(
    db: AsyncSession,
    tournament: Tournament,
    workspace_id: str,
) -> None:
    """Rank entries and distribute prize pool: 1st=50%, 2nd=30%, 3rd=20%.

    Marks tournament status as completed. Caller must commit the session.
    """
    from app.services import wallet_service

    result = await db.execute(
        select(TournamentEntry)
        .where(TournamentEntry.tournament_id == tournament.id)
        .order_by(TournamentEntry.score.desc())
    )
    entries: List[TournamentEntry] = list(result.scalars().all())

    prize_splits = [0.50, 0.30, 0.20]

    for rank_idx, entry in enumerate(entries, start=1):
        entry.rank = rank_idx
        if rank_idx <= 3 and tournament.prize_pool > 0:
            prize = int(tournament.prize_pool * prize_splits[rank_idx - 1])
            if prize > 0:
                entry.prize_awarded = prize
                # Credit the agent's workspace wallet
                agent = await db.get(Agent, entry.agent_id)
                if agent:
                    await wallet_service.credit(
                        db=db,
                        workspace_id=workspace_id,
                        amount=prize,
                        tx_type="tournament_prize",
                        reference_id=tournament.id,
                        description=f"Tournament prize: rank #{rank_idx} in '{tournament.name}'",
                    )
        else:
            entry.prize_awarded = 0
        db.add(entry)

    tournament.status = "completed"
    db.add(tournament)
