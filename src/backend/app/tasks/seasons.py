"""Celery tasks for season management.

Tasks:
  - rotate_season: Beat daily — checks if active season has ended, finalizes it
    (awards top 10), then creates the next season.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.core.celery_app import celery_app, QUEUE_DEFAULT

SEASON_DURATION_DAYS = 30
TOP_N_REWARDS = 10
PRIZE_TOKENS = [2000, 1500, 1000] + [500] * 7  # positions 1-3 then 4-10


def _get_sync_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


@celery_app.task(name="app.tasks.seasons.rotate_season", queue=QUEUE_DEFAULT)
def rotate_season() -> str:
    """Check all workspaces for ended seasons and rotate them.

    For each workspace:
    1. If the active season has passed end_at: finalize it (award top 10 + tokens), mark completed.
    2. Create the next season with number+1.
    """
    from sqlalchemy import select, func
    from app.models.season import Season, SeasonalXP
    from app.models.wallet import Wallet, Transaction
    from app.models.agent import Agent
    from app.models.user import Workspace

    try:
        db = _get_sync_db()
    except RuntimeError:
        return "skipped: sync driver unavailable"

    try:
        now = datetime.utcnow()
        workspaces = db.execute(select(Workspace)).scalars().all()
        rotated = 0

        for ws in workspaces:
            active_season = db.execute(
                select(Season).where(
                    Season.workspace_id == ws.id,
                    Season.status == "active",
                )
            ).scalar_one_or_none()

            if active_season is None:
                continue

            if active_season.end_at > now:
                # Season still running
                continue

            # Finalize: award top 10 agents by seasonal XP
            top_entries = db.execute(
                select(SeasonalXP)
                .where(SeasonalXP.season_id == active_season.id)
                .order_by(SeasonalXP.xp.desc())
                .limit(TOP_N_REWARDS)
            ).scalars().all()

            wallet = db.execute(
                select(Wallet).where(Wallet.workspace_id == ws.id)
            ).scalar_one_or_none()

            for rank_idx, sxp in enumerate(top_entries):
                prize = PRIZE_TOKENS[rank_idx] if rank_idx < len(PRIZE_TOKENS) else 500
                if wallet is None:
                    import uuid
                    wallet = Wallet(workspace_id=ws.id, balance=0)
                    db.add(wallet)
                    db.flush()
                wallet.balance += prize
                tx = Transaction(
                    wallet_id=wallet.id,
                    amount=prize,
                    type="season_reward",
                    reference_id=active_season.id,
                    description=f"End-of-season reward: rank #{rank_idx + 1} in {active_season.name}",
                )
                db.add(tx)

            active_season.status = "completed"
            db.add(active_season)

            # Create next season
            next_number = active_season.number + 1
            season_name_map = {1: "Genesis", 2: "Rising", 3: "Ascension", 4: "Dominion", 5: "Eternity"}
            suffix = season_name_map.get(next_number, f"Chapter {next_number}")
            next_season = Season(
                workspace_id=ws.id,
                name=f"Season {next_number}: {suffix}",
                number=next_number,
                start_at=now,
                end_at=now + timedelta(days=SEASON_DURATION_DAYS),
                status="active",
            )
            db.add(next_season)
            rotated += 1

        db.commit()
        return f"rotated {rotated} seasons"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()
