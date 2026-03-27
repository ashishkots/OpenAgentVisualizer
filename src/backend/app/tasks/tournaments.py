"""Celery tasks for tournament management.

Tasks:
  - create_weekly_tournaments: Beat weekly — creates Speed and Efficiency tournaments.
  - score_active_tournaments: Beat hourly — updates entry scores for all active tournaments.
  - finalize_completed_tournaments: Beat hourly — finalizes tournaments past their end_at.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.core.celery_app import celery_app, QUEUE_DEFAULT, QUEUE_BULK


def _get_sync_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


def _sync_score_tournament(db, tournament) -> None:
    """Synchronous scoring logic for a single tournament."""
    from sqlalchemy import select, func
    from app.models.agent import Task

    entries = db.execute(
        select(__import__("app.models.tournament", fromlist=["TournamentEntry"]).TournamentEntry)
        .where(__import__("app.models.tournament", fromlist=["TournamentEntry"]).TournamentEntry.tournament_id == tournament.id)
    ).scalars().all()

    if not entries:
        return

    window_start = tournament.start_at
    window_end = min(tournament.end_at, datetime.utcnow())
    duration_hours = max((window_end - window_start).total_seconds() / 3600.0, 0.01)

    for entry in entries:
        agent_id = entry.agent_id

        completed_count = db.scalar(
            select(func.count(Task.id)).where(
                Task.agent_id == agent_id,
                Task.status == "completed",
                Task.completed_at >= window_start,
                Task.completed_at <= window_end,
            )
        ) or 0

        total_count = db.scalar(
            select(func.count(Task.id)).where(
                Task.agent_id == agent_id,
                Task.created_at >= window_start,
                Task.created_at <= window_end,
            )
        ) or 0

        total_cost = db.scalar(
            select(func.coalesce(func.sum(Task.cost_usd), 0.0)).where(
                Task.agent_id == agent_id,
                Task.completed_at >= window_start,
                Task.completed_at <= window_end,
            )
        ) or 0.0

        if tournament.type == "speed":
            entry.score = completed_count / duration_hours
        elif tournament.type == "accuracy":
            entry.score = (completed_count / total_count) if total_count > 0 else 0.0
        elif tournament.type == "cost_efficiency":
            entry.score = (completed_count / total_cost) if total_cost > 0 else float(completed_count)
        else:
            entry.score = float(completed_count)

        db.add(entry)


def _sync_finalize_tournament(db, tournament) -> None:
    """Synchronous finalization: rank entries, distribute prizes, mark completed."""
    from sqlalchemy import select
    from app.models.tournament import TournamentEntry
    from app.models.wallet import Wallet, Transaction
    from app.models.agent import Agent

    entries = db.execute(
        select(TournamentEntry)
        .where(TournamentEntry.tournament_id == tournament.id)
        .order_by(TournamentEntry.score.desc())
    ).scalars().all()

    prize_splits = [0.50, 0.30, 0.20]

    for rank_idx, entry in enumerate(entries, start=1):
        entry.rank = rank_idx
        if rank_idx <= 3 and tournament.prize_pool > 0:
            prize = int(tournament.prize_pool * prize_splits[rank_idx - 1])
            if prize > 0:
                entry.prize_awarded = prize
                agent = db.get(Agent, entry.agent_id)
                if agent:
                    wallet = db.execute(
                        select(Wallet).where(Wallet.workspace_id == tournament.workspace_id)
                    ).scalar_one_or_none()
                    if wallet is None:
                        import uuid
                        wallet = Wallet(workspace_id=tournament.workspace_id, balance=0)
                        db.add(wallet)
                        db.flush()
                    wallet.balance += prize
                    tx = Transaction(
                        wallet_id=wallet.id,
                        amount=prize,
                        type="tournament_prize",
                        reference_id=tournament.id,
                        description=f"Tournament prize: rank #{rank_idx} in '{tournament.name}'",
                    )
                    db.add(tx)
        else:
            entry.prize_awarded = 0
        db.add(entry)

    tournament.status = "completed"
    db.add(tournament)


@celery_app.task(name="app.tasks.tournaments.create_weekly_tournaments", queue=QUEUE_DEFAULT)
def create_weekly_tournaments() -> str:
    """Create weekly Speed and Efficiency tournaments starting next Monday."""
    from sqlalchemy import select
    from app.models.tournament import Tournament
    from app.models.user import Workspace

    try:
        db = _get_sync_db()
    except RuntimeError:
        return "skipped: sync driver unavailable"

    try:
        workspaces = db.execute(select(Workspace)).scalars().all()
        now = datetime.utcnow()

        # Calculate next Monday 00:00 UTC
        days_until_monday = (7 - now.weekday()) % 7 or 7
        next_monday = (now + timedelta(days=days_until_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        next_wednesday = next_monday + timedelta(days=2)
        end_date = next_monday + timedelta(days=7)

        created = 0
        for ws in workspaces:
            # Check if speed tournament for this week already exists
            existing_speed = db.scalar(
                select(Tournament).where(
                    Tournament.workspace_id == ws.id,
                    Tournament.type == "speed",
                    Tournament.start_at == next_monday,
                )
            )
            if not existing_speed:
                speed_t = Tournament(
                    workspace_id=ws.id,
                    name=f"Weekly Speed Tournament",
                    description="Complete the most tasks per hour to win!",
                    type="speed",
                    start_at=next_monday,
                    end_at=end_date,
                    entry_fee=50,
                    prize_pool=0,
                    status="upcoming",
                )
                db.add(speed_t)
                created += 1

            existing_eff = db.scalar(
                select(Tournament).where(
                    Tournament.workspace_id == ws.id,
                    Tournament.type == "cost_efficiency",
                    Tournament.start_at == next_wednesday,
                )
            )
            if not existing_eff:
                eff_t = Tournament(
                    workspace_id=ws.id,
                    name=f"Weekly Efficiency Tournament",
                    description="Complete the most tasks at the lowest cost to win!",
                    type="cost_efficiency",
                    start_at=next_wednesday,
                    end_at=end_date,
                    entry_fee=50,
                    prize_pool=0,
                    status="upcoming",
                )
                db.add(eff_t)
                created += 1

        db.commit()
        return f"created {created} tournaments"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()


@celery_app.task(name="app.tasks.tournaments.score_active_tournaments", queue=QUEUE_DEFAULT)
def score_active_tournaments() -> str:
    """Score all currently active tournaments."""
    from sqlalchemy import select
    from app.models.tournament import Tournament

    try:
        db = _get_sync_db()
    except RuntimeError:
        return "skipped: sync driver unavailable"

    try:
        now = datetime.utcnow()
        # Activate upcoming tournaments whose start_at has passed
        upcoming = db.execute(
            select(Tournament).where(
                Tournament.status == "upcoming",
                Tournament.start_at <= now,
            )
        ).scalars().all()
        for t in upcoming:
            t.status = "active"
            db.add(t)

        active = db.execute(
            select(Tournament).where(Tournament.status == "active")
        ).scalars().all()

        for tournament in active:
            _sync_score_tournament(db, tournament)

        db.commit()
        return f"scored {len(active)} tournaments"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()


@celery_app.task(name="app.tasks.tournaments.finalize_completed_tournaments", queue=QUEUE_DEFAULT)
def finalize_completed_tournaments() -> str:
    """Finalize all active tournaments that have passed their end_at time."""
    from sqlalchemy import select
    from app.models.tournament import Tournament

    try:
        db = _get_sync_db()
    except RuntimeError:
        return "skipped: sync driver unavailable"

    try:
        now = datetime.utcnow()
        expired = db.execute(
            select(Tournament).where(
                Tournament.status == "active",
                Tournament.end_at <= now,
            )
        ).scalars().all()

        for tournament in expired:
            _sync_score_tournament(db, tournament)
            _sync_finalize_tournament(db, tournament)

        db.commit()
        return f"finalized {len(expired)} tournaments"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()
