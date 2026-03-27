from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, BackgroundTasks, Query
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc

import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.redis_client import get_redis as _get_redis_connection
from app.core.rate_limiter import limiter, EVENT_INGEST_RATE
from app.models.event import Event
from app.services.event_pipeline import normalise_event, EventPipeline

router = APIRouter(prefix="/api/events", tags=["events"])


async def get_redis() -> aioredis.Redis:
    """Dependency wrapper for Redis — can be overridden in tests."""
    return await _get_redis_connection()


@router.post("", status_code=202)
@limiter.limit(EVENT_INGEST_RATE)
async def ingest_event(
    request: Request,
    payload: dict,
    background_tasks: BackgroundTasks,
    workspace_id: str = Depends(get_workspace_id),
    redis: aioredis.Redis = Depends(get_redis),
) -> dict:
    """Ingest a single event and fan it out to all relevant WebSocket rooms."""
    event = normalise_event(payload, workspace_id=workspace_id)
    pipeline = EventPipeline(redis)
    background_tasks.add_task(pipeline.publish, event)
    try:
        from app.core.metrics import oav_events_ingested_total
        oav_events_ingested_total.inc()
    except Exception:
        pass
    return {"status": "accepted"}


@router.get("/replay")
async def replay_events(
    agent_id: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
    start: Optional[datetime] = Query(None, description="ISO 8601 start timestamp"),
    end: Optional[datetime] = Query(None, description="ISO 8601 end timestamp"),
    cursor: Optional[str] = Query(None, description="Event ID to paginate from"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of events to return"),
    offset: int = Query(0, ge=0, description="Number of events to skip (ignored when cursor is set)"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Query event history for replay with cursor-based pagination.

    Supports optional filtering by agent_id, session_id, and time range.
    Results are ordered by timestamp ascending (oldest first) — the natural
    playback order.

    Cursor-based pagination: pass the ``next_cursor`` from a previous response
    as the ``cursor`` parameter to fetch the next page. The cursor is an event ID;
    the server fetches events with a timestamp strictly after that event's timestamp.
    """
    query = (
        select(Event)
        .where(Event.workspace_id == workspace_id)
        .order_by(asc(Event.timestamp), asc(Event.id))
        .limit(limit + 1)  # fetch one extra to determine has_more
    )

    if agent_id:
        query = query.where(Event.agent_id == agent_id)
    if session_id:
        query = query.where(Event.session_id == session_id)
    if start:
        query = query.where(Event.timestamp >= start)
    if end:
        query = query.where(Event.timestamp <= end)

    if cursor:
        cursor_event = await db.get(Event, cursor)
        if cursor_event and cursor_event.timestamp:
            # Fetch events strictly after the cursor event's timestamp
            query = query.where(Event.timestamp > cursor_event.timestamp)
    elif offset:
        # Offset-based pagination only applies when no cursor is provided
        query = query.offset(offset)

    result = await db.execute(query)
    events = list(result.scalars().all())

    has_more = len(events) > limit
    if has_more:
        events = events[:limit]

    return {
        "events": [
            {
                "id": e.id,
                "agent_id": e.agent_id,
                "session_id": e.session_id,
                "event_type": e.event_type,
                "event_data": e.extra_data,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "sequence_number": idx + 1,
            }
            for idx, e in enumerate(events)
        ],
        "next_cursor": events[-1].id if (events and has_more) else None,
        "has_more": has_more,
    }
