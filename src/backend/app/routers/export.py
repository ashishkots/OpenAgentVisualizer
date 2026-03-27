"""Data export endpoints.

Provides streaming CSV and JSON downloads for agents and events.
Events export requires an explicit time range (max 30 days) to prevent
unbounded scans of the time-series table.
"""

from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Generator

import orjson
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.agent import Agent
from app.models.event import Event
from app.schemas.export import ExportFormat

router = APIRouter(prefix="/api/export", tags=["export"])

MAX_EXPORT_DAYS = 30


# ---------------------------------------------------------------------------
# Streaming helpers
# ---------------------------------------------------------------------------

def _csv_rows_generator(rows: list[list], columns: list[str]) -> Generator[str, None, None]:
    """Yield CSV text one row at a time using an in-memory StringIO buffer."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    yield buf.getvalue()
    for row in rows:
        buf.seek(0)
        buf.truncate(0)
        writer.writerow(row)
        yield buf.getvalue()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/agents")
async def export_agents(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
    format: ExportFormat = Query(default=ExportFormat.csv),
) -> StreamingResponse:
    """Export all agents for the workspace as CSV or JSON.

    CSV columns: id, name, role, framework, status, level, xp_total, created_at
    """
    result = await db.execute(
        select(Agent).where(Agent.workspace_id == workspace_id).order_by(Agent.created_at.desc())
    )
    agents = result.scalars().all()
    ts = datetime.now(tz=timezone.utc).strftime("%Y%m%d-%H%M%S")

    if format == ExportFormat.csv:
        columns = ["id", "name", "role", "framework", "status", "level", "xp_total", "created_at"]
        rows = [
            [a.id, a.name, a.role, a.framework, a.status, a.level, a.xp_total, str(a.created_at)]
            for a in agents
        ]
        return StreamingResponse(
            _csv_rows_generator(rows, columns),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="agents-{ts}.csv"'},
        )

    # JSON
    data = [
        {
            "id": a.id,
            "name": a.name,
            "role": a.role,
            "framework": a.framework,
            "status": a.status,
            "level": a.level,
            "xp_total": a.xp_total,
            "created_at": str(a.created_at),
        }
        for a in agents
    ]
    return StreamingResponse(
        iter([orjson.dumps(data)]),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="agents-{ts}.json"'},
    )


@router.get("/events")
async def export_events(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
    format: ExportFormat = Query(default=ExportFormat.csv),
    start: datetime = Query(..., description="Start of export range (ISO 8601)"),
    end: datetime = Query(..., description="End of export range (ISO 8601)"),
) -> StreamingResponse:
    """Export events within a time range as CSV or JSON.

    Max range is 30 days.  Returns 400 when the range is exceeded.
    CSV columns: id, agent_id, event_type, timestamp, extra_data
    """
    range_days = (end - start).total_seconds() / 86400
    if range_days > MAX_EXPORT_DAYS:
        raise HTTPException(
            status_code=400,
            detail=f"Max export range is {MAX_EXPORT_DAYS} days",
        )

    result = await db.execute(
        select(Event)
        .where(
            Event.workspace_id == workspace_id,
            Event.timestamp >= start,
            Event.timestamp <= end,
        )
        .order_by(Event.timestamp.desc())
        .limit(100_000)
    )
    events = result.scalars().all()
    ts = datetime.now(tz=timezone.utc).strftime("%Y%m%d-%H%M%S")

    if format == ExportFormat.csv:
        columns = ["id", "agent_id", "event_type", "timestamp", "extra_data"]
        rows = [
            [
                e.id,
                e.agent_id or "",
                e.event_type,
                str(e.timestamp),
                orjson.dumps(e.extra_data).decode() if e.extra_data else "",
            ]
            for e in events
        ]
        return StreamingResponse(
            _csv_rows_generator(rows, columns),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="events-{ts}.csv"'},
        )

    # JSON
    data = [
        {
            "id": e.id,
            "agent_id": e.agent_id,
            "event_type": e.event_type,
            "timestamp": str(e.timestamp),
            "extra_data": e.extra_data,
        }
        for e in events
    ]
    return StreamingResponse(
        iter([orjson.dumps(data)]),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="events-{ts}.json"'},
    )
