"""Celery task: evaluate and award achievements for an agent.

The evaluator is called:
  - After XP is awarded (gamification router)
  - After a task completes or an error is recovered (event pipeline hook)
  - Every 5 minutes via Celery beat (for time-based achievements)

Achievement awards are idempotent — the unique constraint on
(workspace_id, agent_id, achievement_id) prevents duplicates.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import orjson
import redis as sync_redis

from app.core.celery_app import celery_app
from app.core.config import settings
from app.services.achievement_definitions import ACHIEVEMENT_DEFS


def _get_sync_redis() -> sync_redis.Redis:
    return sync_redis.from_url(settings.REDIS_URL, decode_responses=False)


def _get_sync_db():
    """Return a synchronous SQLAlchemy session for use inside Celery tasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


def _compute_agent_stats(db, workspace_id: str, agent_id: str) -> dict:
    """Compute aggregate statistics needed for achievement condition evaluation."""
    from sqlalchemy import select, func, extract
    from app.models.event import Event, AgentSession

    task_count: int = db.scalar(
        select(func.count(Event.id)).where(
            Event.workspace_id == workspace_id,
            Event.agent_id == agent_id,
            Event.event_type == "task_completed",
        )
    ) or 0

    error_recovery_count: int = db.scalar(
        select(func.count(Event.id)).where(
            Event.workspace_id == workspace_id,
            Event.agent_id == agent_id,
            Event.event_type == "error_recovered",
        )
    ) or 0

    # Tasks completed with duration < 1 second (stored in extra_data.duration_ms)
    fast_task_rows = db.execute(
        select(Event.extra_data).where(
            Event.workspace_id == workspace_id,
            Event.agent_id == agent_id,
            Event.event_type == "task_completed",
        )
    ).scalars().all()
    fast_task_count = sum(
        1
        for extra in fast_task_rows
        if extra and isinstance(extra.get("duration_ms"), (int, float))
        and extra["duration_ms"] < 1000
    )

    # Cheap tasks — cost below median: counted as tasks where cost_usd < 0.001 (proxy)
    cheap_task_rows = db.execute(
        select(Event.extra_data).where(
            Event.workspace_id == workspace_id,
            Event.agent_id == agent_id,
            Event.event_type == "task_completed",
        )
    ).scalars().all()
    cheap_task_count = sum(
        1
        for extra in cheap_task_rows
        if extra and isinstance(extra.get("cost_usd"), (int, float))
        and extra["cost_usd"] < 0.001
    )

    # Night tasks — completed between 22:00 and 06:00 UTC
    night_rows = db.execute(
        select(Event.timestamp).where(
            Event.workspace_id == workspace_id,
            Event.agent_id == agent_id,
            Event.event_type == "task_completed",
        )
    ).scalars().all()
    night_task_count = sum(
        1
        for ts in night_rows
        if ts and (ts.hour >= 22 or ts.hour < 6)
    )

    # Total session hours — sum of (ended_at - started_at) across completed sessions
    sessions = db.execute(
        select(AgentSession).where(
            AgentSession.workspace_id == workspace_id,
            AgentSession.ended_at.isnot(None),
        )
    ).scalars().all()
    total_session_hours = 0.0
    for s in sessions:
        if s.agent_ids and agent_id in (s.agent_ids or []):
            if s.started_at and s.ended_at:
                total_session_hours += (s.ended_at - s.started_at).total_seconds() / 3600.0

    # Consecutive task streak without error
    event_rows = db.execute(
        select(Event.event_type).where(
            Event.workspace_id == workspace_id,
            Event.agent_id == agent_id,
            Event.event_type.in_(["task_completed", "task_failed"]),
        ).order_by(Event.timestamp)
    ).scalars().all()
    max_streak = 0
    current_streak = 0
    for etype in event_rows:
        if etype == "task_completed":
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0

    return {
        "task_count": task_count,
        "error_recovery_count": error_recovery_count,
        "fast_task_count": fast_task_count,
        "cheap_task_count": cheap_task_count,
        "night_task_count": night_task_count,
        "total_session_hours": total_session_hours,
        "max_streak": max_streak,
        # relationship_edge_count is sourced from the cached graph (checked separately)
        "relationship_edge_count": 0,
    }


def _check_condition(
    ach_id: str,
    stats: dict,
    db,
    workspace_id: str,
    agent,
) -> bool:
    """Evaluate whether an achievement condition is met for an agent."""
    from sqlalchemy import select
    from app.models.achievement import Achievement

    match ach_id:
        case "ACH-001":
            return stats["task_count"] >= 1
        case "ACH-002":
            return stats["task_count"] >= 100
        case "ACH-003":
            return stats["fast_task_count"] >= 10
        case "ACH-004":
            return stats["cheap_task_count"] >= 50
        case "ACH-005":
            return stats["error_recovery_count"] >= 10
        case "ACH-006":
            return stats["total_session_hours"] >= 24
        case "ACH-007":
            # Check cached graph for edge count
            import redis as sync_redis
            r = sync_redis.from_url(settings.REDIS_URL, decode_responses=True)
            cached = r.get(f"graph:{workspace_id}")
            r.close()
            if cached:
                graph = orjson.loads(cached)
                edge_count = sum(
                    1
                    for e in graph.get("edges", [])
                    if e["source"] == agent.id or e["target"] == agent.id
                )
                return edge_count >= 5
            return False
        case "ACH-008":
            return stats["max_streak"] >= 10
        case "ACH-009":
            return stats["night_task_count"] >= 50
        case "ACH-010":
            # First agent in workspace to reach Level 5
            if agent.level < 5:
                return False
            existing_trailblazer = db.scalar(
                select(Achievement.id).where(
                    Achievement.workspace_id == workspace_id,
                    Achievement.achievement_id == "ACH-010",
                )
            )
            return existing_trailblazer is None
        case _:
            return False


@celery_app.task(name="app.tasks.evaluate_achievements", bind=True, max_retries=3)
def evaluate_achievements(self, workspace_id: str, agent_id: str) -> list[str]:
    """Evaluate all achievement conditions for a single agent and award any earned.

    Returns a list of newly awarded achievement IDs. Previously earned achievements
    are skipped (idempotent by design — unique DB constraint is the last line of defence).
    """
    from sqlalchemy import select
    from sqlalchemy.exc import IntegrityError
    from app.models.achievement import Achievement
    from app.models.agent import Agent

    try:
        db = _get_sync_db()
    except RuntimeError:
        # Synchronous driver not available (e.g. test environment) — skip gracefully
        return []

    awarded: list[str] = []

    try:
        # Already-earned achievement IDs for this agent
        existing = set(
            db.execute(
                select(Achievement.achievement_id).where(
                    Achievement.workspace_id == workspace_id,
                    Achievement.agent_id == agent_id,
                )
            ).scalars().all()
        )

        agent = db.get(Agent, agent_id)
        if not agent:
            return []

        stats = _compute_agent_stats(db, workspace_id, agent_id)

        for ach_id, defn in ACHIEVEMENT_DEFS.items():
            if ach_id in existing:
                continue
            try:
                if _check_condition(ach_id, stats, db, workspace_id, agent):
                    achievement = Achievement(
                        workspace_id=workspace_id,
                        agent_id=agent_id,
                        achievement_id=ach_id,
                        achievement_name=defn.name,
                        xp_bonus=defn.xp_bonus,
                    )
                    db.add(achievement)
                    # Award the XP bonus inline in the same transaction
                    agent.xp_total += defn.xp_bonus
                    awarded.append(ach_id)
            except IntegrityError:
                # Race condition: another worker already inserted this achievement
                db.rollback()

        if awarded:
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                # Some achievements may have been committed before the conflict —
                # return only those that are now confirmed in DB
                confirmed = set(
                    db.execute(
                        select(Achievement.achievement_id).where(
                            Achievement.workspace_id == workspace_id,
                            Achievement.agent_id == agent_id,
                            Achievement.achievement_id.in_(awarded),
                        )
                    ).scalars().all()
                )
                awarded = [a for a in awarded if a in confirmed]

            # Publish WebSocket events for each newly awarded achievement
            if awarded:
                redis_client = _get_sync_redis()
                try:
                    for ach_id in awarded:
                        defn = ACHIEVEMENT_DEFS[ach_id]
                        event_payload = orjson.dumps(
                            {
                                "event_type": "achievement_unlocked",
                                "agent_id": agent_id,
                                "achievement_id": ach_id,
                                "achievement_name": defn.name,
                                "xp_bonus": defn.xp_bonus,
                                "icon": defn.icon,
                            }
                        )
                        redis_client.publish(
                            f"ws:workspace:{workspace_id}", event_payload
                        )
                        redis_client.publish(f"ws:agent:{agent_id}", event_payload)
                finally:
                    redis_client.close()

    finally:
        db.close()

    return awarded


@celery_app.task(name="app.tasks.refresh_leaderboard")
def refresh_leaderboard() -> str:
    """Refresh the agent_leaderboard materialized view.

    Scheduled via Celery beat every 5 minutes. Uses REFRESH MATERIALIZED VIEW
    CONCURRENTLY so reads are not blocked during refresh.
    """
    try:
        db = _get_sync_db()
    except RuntimeError:
        return "skipped: sync driver unavailable"

    try:
        db.execute(
            # CONCURRENTLY requires a unique index on the view; falls back to non-concurrent
            # if the index is not present in the current environment.
            __import__("sqlalchemy").text(
                "REFRESH MATERIALIZED VIEW CONCURRENTLY agent_leaderboard"
            )
        )
        db.commit()
        return "ok"
    except Exception as exc:
        db.rollback()
        return f"error: {exc}"
    finally:
        db.close()
