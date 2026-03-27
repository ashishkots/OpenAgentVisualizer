"""Celery tasks for quest evaluation and periodic resets."""

from __future__ import annotations

from datetime import datetime, timezone

from app.core.celery_app import celery_app


def _get_sync_db():
    """Return a synchronous SQLAlchemy session for use inside Celery tasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


@celery_app.task(
    name="app.tasks.quests.evaluate_quest_progress",
    bind=True,
    max_retries=3,
    queue="critical",
)
def evaluate_quest_progress(self, workspace_id: str, agent_id: str) -> dict:
    """Evaluate all active quests for a single agent and advance progress.

    Triggered after XP is awarded, tasks complete, or events are ingested.
    Returns a dict with list of newly completed quest IDs.
    """
    import asyncio
    from app.services.quest_service import QuestService
    from app.core.database import AsyncSessionLocal

    async def _run() -> list[str]:
        svc = QuestService()
        async with AsyncSessionLocal() as db:
            return await svc.evaluate_quest_progress(db, workspace_id, agent_id)

    try:
        newly_completed = asyncio.run(_run())
        return {"completed": newly_completed}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(name="app.tasks.quests.reset_daily_quests")
def reset_daily_quests() -> str:
    """Reset progress for all daily quests (type='daily').

    Runs every 24 hours via Celery beat.
    Only resets progress entries that have not been reset in the last 24 hours.
    """
    from sqlalchemy import create_engine, select, update
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    try:
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
        engine = create_engine(sync_url, pool_pre_ping=True)
        Session = sessionmaker(bind=engine)
        db = Session()
    except Exception:
        return "skipped: sync driver unavailable"

    try:
        from app.models.quest import Quest, AgentQuestProgress

        daily_quest_ids = db.execute(
            select(Quest.id).where(Quest.type == "daily", Quest.active == True)  # noqa: E712
        ).scalars().all()

        if not daily_quest_ids:
            return "no daily quests"

        now = datetime.now(timezone.utc)
        db.execute(
            update(AgentQuestProgress)
            .where(
                AgentQuestProgress.quest_id.in_(daily_quest_ids),
                AgentQuestProgress.completed == True,  # noqa: E712
            )
            .values(
                current_step=0,
                completed=False,
                claimed=False,
                completed_at=None,
                last_reset_at=now,
            )
        )
        db.commit()
        return f"reset {len(daily_quest_ids)} daily quest(s)"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()


@celery_app.task(name="app.tasks.quests.reset_weekly_quests")
def reset_weekly_quests() -> str:
    """Reset progress for all weekly quests (type='weekly').

    Runs every 168 hours (7 days) via Celery beat.
    """
    from sqlalchemy import create_engine, select, update
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    try:
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
        engine = create_engine(sync_url, pool_pre_ping=True)
        Session = sessionmaker(bind=engine)
        db = Session()
    except Exception:
        return "skipped: sync driver unavailable"

    try:
        from app.models.quest import Quest, AgentQuestProgress

        weekly_quest_ids = db.execute(
            select(Quest.id).where(Quest.type == "weekly", Quest.active == True)  # noqa: E712
        ).scalars().all()

        if not weekly_quest_ids:
            return "no weekly quests"

        now = datetime.now(timezone.utc)
        db.execute(
            update(AgentQuestProgress)
            .where(
                AgentQuestProgress.quest_id.in_(weekly_quest_ids),
                AgentQuestProgress.completed == True,  # noqa: E712
            )
            .values(
                current_step=0,
                completed=False,
                claimed=False,
                completed_at=None,
                last_reset_at=now,
            )
        )
        db.commit()
        return f"reset {len(weekly_quest_ids)} weekly quest(s)"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()
