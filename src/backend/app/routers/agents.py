from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc
from typing import List, Optional
from datetime import datetime
import orjson
import uuid

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.redis_client import get_redis
from app.models.agent import Agent
from app.models.event import Event
from app.models.achievement import Achievement
from app.schemas.agent import AgentCreate, AgentRead, AgentStats
from app.schemas.achievement import AgentGraph, AchievementRead

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("", status_code=201, response_model=AgentRead)
async def create_agent(
    req: AgentCreate,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> AgentRead:
    """Create a new agent in the authenticated workspace."""
    agent = Agent(
        id=str(uuid.uuid4()),
        workspace_id=workspace_id,
        name=req.name,
        role=req.role,
        framework=req.framework,
        avatar_id=req.avatar_id,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("", response_model=List[AgentRead])
async def list_agents(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[AgentRead]:
    """List all agents in the authenticated workspace."""
    result = await db.execute(
        select(Agent).where(Agent.workspace_id == workspace_id)
    )
    return result.scalars().all()


@router.get("/graph", response_model=AgentGraph)
async def get_agent_graph(
    background_tasks: BackgroundTasks,
    workspace_id: str = Depends(get_workspace_id),
) -> AgentGraph:
    """Return the cached agent relationship graph for a workspace.

    Edges represent detected relationships: shared_session, delegates_to, monitors.
    The graph is computed by a Celery task and cached in Redis for 5 minutes.

    On cache miss: returns HTTP 202 and enqueues the Celery computation task.
    Callers should retry after a few seconds.
    """
    redis = await get_redis()
    cache_key = f"graph:{workspace_id}"
    cached = await redis.get(cache_key)

    if cached:
        data = orjson.loads(cached)
        return AgentGraph(**data)

    # Cache miss — trigger async computation and return 202
    def _trigger_graph_task() -> None:
        from app.tasks.graph import compute_agent_graph
        compute_agent_graph.delay(workspace_id)

    background_tasks.add_task(_trigger_graph_task)
    raise HTTPException(
        status_code=status.HTTP_202_ACCEPTED,
        detail="Graph computation triggered. Retry in a few seconds.",
    )


@router.get("/{agent_id}/events")
async def get_agent_events(
    agent_id: str,
    start: Optional[datetime] = Query(None, description="ISO 8601 start timestamp"),
    end: Optional[datetime] = Query(None, description="ISO 8601 end timestamp"),
    cursor: Optional[str] = Query(None, description="Event ID to paginate from"),
    limit: int = Query(100, ge=1, le=500),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return event history for a specific agent with optional time filtering and pagination.

    This is a convenience endpoint that filters events by agent_id.
    It uses the same logic as /api/events/replay but pre-filters by agent_id.
    """
    # Verify the agent exists and belongs to this workspace
    agent = await db.scalar(
        select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    query = (
        select(Event)
        .where(Event.workspace_id == workspace_id, Event.agent_id == agent_id)
        .order_by(desc(Event.timestamp), desc(Event.id))  # Latest first for agent detail view
        .limit(limit + 1)  # fetch one extra to determine has_more
    )

    if start:
        query = query.where(Event.timestamp >= start)
    if end:
        query = query.where(Event.timestamp <= end)

    if cursor:
        cursor_event = await db.get(Event, cursor)
        if cursor_event and cursor_event.timestamp:
            # Fetch events strictly before the cursor event's timestamp (since we order desc)
            query = query.where(Event.timestamp < cursor_event.timestamp)

    result = await db.execute(query)
    events = list(result.scalars().all())

    has_more = len(events) > limit
    if has_more:
        events = events[:limit]

    return {
        "events": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "payload": e.extra_data,
                # Include xp_delta if present in event data for display
                "xp_delta": e.extra_data.get("xp_delta") if e.extra_data else None,
            }
            for e in events
        ],
        "next_cursor": events[-1].id if (events and has_more) else None,
        "has_more": has_more,
    }


@router.get("/{agent_id}/achievements", response_model=List[AchievementRead])
async def get_agent_achievements(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[AchievementRead]:
    """Return all achievements earned by a specific agent.

    This is a convenience endpoint that filters achievements by agent_id.
    It provides the same data as /api/gamification/achievements/{agent_id}
    but fits the RESTful pattern expected by the frontend.
    """
    # Verify the agent exists and belongs to this workspace
    agent = await db.scalar(
        select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    result = await db.execute(
        select(Achievement)
        .where(
            Achievement.agent_id == agent_id,
            Achievement.workspace_id == workspace_id,
        )
        .order_by(Achievement.unlocked_at.desc())  # Latest first for agent detail view
    )
    return result.scalars().all()


@router.get("/{agent_id}/stats", response_model=AgentStats)
async def get_agent_stats(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> AgentStats:
    """Return key statistics for a single agent."""
    agent = await db.scalar(
        select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
