"""Celery task: compute agent relationship graph and cache in Redis.

The graph is built from event history and cached in Redis as a JSON blob with a
5-minute TTL. The API endpoint serves the cached version directly.
"""

from collections import defaultdict

import orjson
import redis as sync_redis

from app.core.celery_app import celery_app
from app.core.config import settings


def _get_sync_redis() -> sync_redis.Redis:
    """Return a synchronous Redis client for use inside Celery tasks."""
    return sync_redis.from_url(settings.REDIS_URL, decode_responses=True)


def _get_sync_db_session():
    """Return a synchronous SQLAlchemy session for use inside Celery tasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    sync_url = settings.DATABASE_URL.replace("+asyncpg", "").replace(
        "postgresql+asyncpg", "postgresql+psycopg2"
    )
    # Use psycopg2 sync driver; fall back to plain postgresql if psycopg2 not available
    try:
        engine = create_engine(sync_url, pool_pre_ping=True)
        Session = sessionmaker(bind=engine)
        return Session()
    except Exception:
        # If psycopg2 is unavailable (e.g. test environment), raise clearly
        raise RuntimeError(
            "Synchronous DB driver not available for Celery task. "
            "Ensure psycopg2-binary is installed."
        )


@celery_app.task(name="app.tasks.compute_agent_graph", bind=True, max_retries=3)
def compute_agent_graph(self, workspace_id: str) -> dict:
    """Compute the agent relationship graph for a workspace and cache it in Redis.

    Edge types detected:
      - shared_session: two agents appear in events with the same session_id
      - delegates_to:   agent A creates a task that agent B executes (task_created / task_started)
      - monitors:       agent A emits agent.health_check events targeting agent B

    Returns the graph dict (nodes + edges) for the caller's convenience.
    """
    from sqlalchemy import select, distinct
    from app.models.agent import Agent
    from app.models.event import Event

    cache_key = f"graph:{workspace_id}"
    redis_client = _get_sync_redis()

    try:
        db = _get_sync_db_session()
        try:
            # 1. Fetch all agents for the workspace
            agents = db.execute(
                select(Agent).where(Agent.workspace_id == workspace_id)
            ).scalars().all()

            nodes = [
                {
                    "id": a.id,
                    "name": a.name,
                    "status": a.status,
                    "level": a.level,
                    "xp_total": a.xp_total,
                }
                for a in agents
            ]
            agent_ids = {a.id for a in agents}

            edges: list[dict] = []

            # 2. Shared sessions — sessions with multiple distinct agents
            session_rows = db.execute(
                select(Event.session_id, Event.agent_id)
                .where(
                    Event.workspace_id == workspace_id,
                    Event.session_id.isnot(None),
                    Event.agent_id.isnot(None),
                )
                .distinct()
            ).all()

            session_agents: dict[str, set[str]] = defaultdict(set)
            for session_id, agent_id in session_rows:
                if agent_id in agent_ids:
                    session_agents[session_id].add(agent_id)

            shared_counts: dict[tuple[str, str], dict] = {}
            for session_id, a_ids in session_agents.items():
                sorted_ids = sorted(a_ids)
                for i in range(len(sorted_ids)):
                    for j in range(i + 1, len(sorted_ids)):
                        key = (sorted_ids[i], sorted_ids[j])
                        if key not in shared_counts:
                            shared_counts[key] = {"count": 0, "first": None, "last": None}
                        shared_counts[key]["count"] += 1

            for (src, tgt), data in shared_counts.items():
                edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "edge_type": "shared_session",
                        "weight": data["count"],
                        "first_seen": None,
                        "last_seen": None,
                    }
                )

            # 3. Delegation edges — task_created by A, task_started by B (same task_id)
            created_rows = db.execute(
                select(Event.agent_id, Event.extra_data)
                .where(
                    Event.workspace_id == workspace_id,
                    Event.event_type == "task_created",
                    Event.agent_id.isnot(None),
                )
            ).all()

            started_rows = db.execute(
                select(Event.agent_id, Event.extra_data)
                .where(
                    Event.workspace_id == workspace_id,
                    Event.event_type == "task_started",
                    Event.agent_id.isnot(None),
                )
            ).all()

            task_creators: dict[str, str] = {}
            for agent_id, extra in created_rows:
                if extra and "task_id" in extra:
                    task_creators[extra["task_id"]] = agent_id

            delegation_counts: dict[tuple[str, str], int] = defaultdict(int)
            for agent_id, extra in started_rows:
                if extra and "task_id" in extra:
                    task_id = extra["task_id"]
                    creator = task_creators.get(task_id)
                    if creator and creator != agent_id and creator in agent_ids:
                        delegation_counts[(creator, agent_id)] += 1

            for (src, tgt), count in delegation_counts.items():
                edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "edge_type": "delegates_to",
                        "weight": count,
                        "first_seen": None,
                        "last_seen": None,
                    }
                )

            # 4. Monitors edges — agent.health_check events with target_agent_id
            monitor_rows = db.execute(
                select(Event.agent_id, Event.extra_data)
                .where(
                    Event.workspace_id == workspace_id,
                    Event.event_type == "agent.health_check",
                    Event.agent_id.isnot(None),
                )
            ).all()

            monitor_counts: dict[tuple[str, str], int] = defaultdict(int)
            for agent_id, extra in monitor_rows:
                if extra and "target_agent_id" in extra:
                    target = extra["target_agent_id"]
                    if target in agent_ids and target != agent_id:
                        monitor_counts[(agent_id, target)] += 1

            for (src, tgt), count in monitor_counts.items():
                edges.append(
                    {
                        "source": src,
                        "target": tgt,
                        "edge_type": "monitors",
                        "weight": count,
                        "first_seen": None,
                        "last_seen": None,
                    }
                )

        finally:
            db.close()

    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)

    graph = {"nodes": nodes, "edges": edges}
    redis_client.setex(cache_key, 300, orjson.dumps(graph).decode())
    redis_client.close()
    return graph
