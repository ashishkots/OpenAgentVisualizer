"""Celery tasks for challenge management.

Tasks:
  - update_challenge_progress: Beat every 5 minutes — aggregates progress and checks completion/expiry.
  - create_weekly_challenges: Beat weekly — creates the 3 standard workspace challenges.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.core.celery_app import celery_app, QUEUE_DEFAULT, QUEUE_BULK

CHALLENGE_DURATION_DAYS = 7

# 3 standard weekly challenge templates
WEEKLY_CHALLENGE_TEMPLATES = [
    {
        "name": "Ingest 10,000 Events",
        "description": "Collectively ingest 10,000 events across all agents this week.",
        "type": "workspace",
        "goal_type": "events",
        "goal_value": 10_000,
        "reward_tokens": 500,
        "reward_xp": 1000,
    },
    {
        "name": "Complete 500 Tasks",
        "description": "Complete 500 tasks across all agents this week.",
        "type": "workspace",
        "goal_type": "tasks",
        "goal_value": 500,
        "reward_tokens": 300,
        "reward_xp": 500,
    },
    {
        "name": "Earn 50,000 Total XP",
        "description": "Earn a combined total of 50,000 XP across all agents this week.",
        "type": "workspace",
        "goal_type": "xp",
        "goal_value": 50_000,
        "reward_tokens": 400,
        "reward_xp": 750,
    },
]


def _get_sync_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


@celery_app.task(name="app.tasks.challenges.update_challenge_progress", queue=QUEUE_DEFAULT)
def update_challenge_progress() -> str:
    """Aggregate progress for all active challenges and check completion/expiry."""
    from sqlalchemy import select, func
    from app.models.challenge import Challenge
    from app.models.agent import Agent, Task
    from app.models.event import Event

    try:
        db = _get_sync_db()
    except RuntimeError:
        return "skipped: sync driver unavailable"

    try:
        now = datetime.utcnow()
        active = db.execute(
            select(Challenge).where(Challenge.status == "active")
        ).scalars().all()

        updated = 0
        completed = 0
        failed = 0

        for challenge in active:
            workspace_id = challenge.workspace_id
            window_start = challenge.start_at
            window_end = challenge.end_at

            if challenge.goal_type == "events":
                current = db.scalar(
                    select(func.count(Event.id)).where(
                        Event.workspace_id == workspace_id,
                        Event.timestamp >= window_start,
                        Event.timestamp <= window_end,
                    )
                ) or 0
            elif challenge.goal_type == "tasks":
                current = db.scalar(
                    select(func.count(Task.id)).where(
                        Task.workspace_id == workspace_id,
                        Task.status == "completed",
                        Task.completed_at >= window_start,
                        Task.completed_at <= window_end,
                    )
                ) or 0
            elif challenge.goal_type == "xp":
                from app.models.gamification import XPTransaction
                current = db.scalar(
                    select(func.coalesce(func.sum(XPTransaction.xp_delta), 0)).where(
                        XPTransaction.workspace_id == workspace_id,
                        XPTransaction.created_at >= window_start,
                        XPTransaction.created_at <= window_end,
                    )
                ) or 0
            else:
                current = challenge.current_value

            challenge.current_value = current
            db.add(challenge)
            updated += 1

            # Check completion
            if current >= challenge.goal_value:
                challenge.status = "completed"
                db.add(challenge)
                completed += 1

                # Distribute XP to all agents
                if challenge.reward_xp > 0:
                    from app.models.gamification import XPTransaction
                    agents = db.execute(
                        select(Agent).where(Agent.workspace_id == workspace_id)
                    ).scalars().all()
                    for agent in agents:
                        xp_tx = XPTransaction(
                            workspace_id=workspace_id,
                            agent_id=agent.id,
                            xp_delta=challenge.reward_xp,
                            reason=f"challenge_completed:{challenge.id}",
                        )
                        db.add(xp_tx)
                        agent.xp_total += challenge.reward_xp
                        db.add(agent)

                # Credit wallet
                if challenge.reward_tokens > 0:
                    from app.models.wallet import Wallet, Transaction
                    wallet = db.execute(
                        select(Wallet).where(Wallet.workspace_id == workspace_id)
                    ).scalar_one_or_none()
                    if wallet is None:
                        wallet = Wallet(workspace_id=workspace_id, balance=0)
                        db.add(wallet)
                        db.flush()
                    wallet.balance += challenge.reward_tokens
                    tx = Transaction(
                        wallet_id=wallet.id,
                        amount=challenge.reward_tokens,
                        type="challenge_reward",
                        reference_id=challenge.id,
                        description=f"Challenge completed: '{challenge.name}'",
                    )
                    db.add(tx)

            # Check expiry
            elif now > challenge.end_at:
                challenge.status = "failed"
                db.add(challenge)
                failed += 1

        db.commit()
        return f"updated={updated} completed={completed} failed={failed}"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()


@celery_app.task(name="app.tasks.challenges.create_weekly_challenges", queue=QUEUE_BULK)
def create_weekly_challenges() -> str:
    """Create the 3 standard weekly workspace challenges for all workspaces."""
    from sqlalchemy import select
    from app.models.challenge import Challenge
    from app.models.user import Workspace

    try:
        db = _get_sync_db()
    except RuntimeError:
        return "skipped: sync driver unavailable"

    try:
        now = datetime.utcnow()
        # Align to start of the current week (Monday)
        days_since_monday = now.weekday()
        week_start = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        week_end = week_start + timedelta(days=CHALLENGE_DURATION_DAYS)

        workspaces = db.execute(select(Workspace)).scalars().all()
        created = 0

        for ws in workspaces:
            for template in WEEKLY_CHALLENGE_TEMPLATES:
                # Check if this challenge already exists for this week
                existing = db.scalar(
                    select(Challenge).where(
                        Challenge.workspace_id == ws.id,
                        Challenge.name == template["name"],
                        Challenge.start_at == week_start,
                    )
                )
                if existing:
                    continue

                challenge = Challenge(
                    workspace_id=ws.id,
                    name=template["name"],
                    description=template["description"],
                    type=template["type"],
                    goal_type=template["goal_type"],
                    goal_value=template["goal_value"],
                    current_value=0,
                    reward_tokens=template["reward_tokens"],
                    reward_xp=template["reward_xp"],
                    start_at=week_start,
                    end_at=week_end,
                    status="active",
                )
                db.add(challenge)
                created += 1

        db.commit()
        return f"created {created} challenges"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()
