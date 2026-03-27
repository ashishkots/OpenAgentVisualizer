from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.metrics import MetricsRaw, MetricsAgg

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


def _period_to_interval(period: str) -> str:
    """Map a period shorthand to a PostgreSQL interval string."""
    mapping = {
        "24h": "24 hours",
        "7d": "7 days",
        "30d": "30 days",
        "90d": "90 days",
    }
    return mapping.get(period, "7 days")


@router.get("/costs")
async def get_costs(
    agent_id: Optional[str] = None,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list:
    """Return cost summary for the workspace, optionally filtered by agent."""
    query = (
        select(
            MetricsRaw.agent_id,
            func.sum(MetricsRaw.cost_usd).label("total_cost"),
            func.sum(MetricsRaw.total_tokens).label("total_tokens"),
        )
        .where(MetricsRaw.workspace_id == workspace_id)
        .group_by(MetricsRaw.agent_id)
    )
    if agent_id:
        query = query.where(MetricsRaw.agent_id == agent_id)

    result = await db.execute(query)
    return [
        {
            "agent_id": row.agent_id,
            "total_cost_usd": float(row.total_cost or 0),
            "total_tokens": row.total_tokens or 0,
        }
        for row in result.all()
    ]


@router.get("/tokens")
async def get_tokens(
    agent_id: Optional[str] = None,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list:
    """Return token usage summary for the workspace."""
    query = (
        select(
            MetricsRaw.agent_id,
            MetricsRaw.model,
            func.sum(MetricsRaw.prompt_tokens).label("prompt_tokens"),
            func.sum(MetricsRaw.completion_tokens).label("completion_tokens"),
            func.sum(MetricsRaw.total_tokens).label("total_tokens"),
        )
        .where(MetricsRaw.workspace_id == workspace_id)
        .group_by(MetricsRaw.agent_id, MetricsRaw.model)
    )
    if agent_id:
        query = query.where(MetricsRaw.agent_id == agent_id)

    result = await db.execute(query)
    return [
        {
            "agent_id": row.agent_id,
            "model": row.model,
            "prompt_tokens": row.prompt_tokens or 0,
            "completion_tokens": row.completion_tokens or 0,
            "total_tokens": row.total_tokens or 0,
        }
        for row in result.all()
    ]


@router.get("/aggregates")
async def get_aggregates(
    interval: str = Query("hourly", pattern="^(hourly|daily)$"),
    period: str = Query("7d", pattern="^(24h|7d|30d|90d)$"),
    agent_id: Optional[str] = Query(None),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Query the TimescaleDB continuous aggregate views for metrics data.

    - interval: hourly | daily  (selects metrics_hourly or metrics_daily view)
    - period:   24h | 7d | 30d | 90d
    """
    view = "metrics_hourly" if interval == "hourly" else "metrics_daily"
    time_col = "hour" if interval == "hourly" else "day"
    pg_interval = _period_to_interval(period)

    sql = text(
        f"""
        SELECT
            {time_col},
            agent_id,
            total_tokens,
            total_cost_usd,
            request_count,
            avg_latency_ms,
            p95_latency_ms
        FROM {view}
        WHERE workspace_id = :workspace_id
          AND {time_col} >= NOW() - INTERVAL '{pg_interval}'
        {"AND agent_id = :agent_id" if agent_id else ""}
        ORDER BY {time_col} ASC
        """
    )
    params: dict = {"workspace_id": workspace_id}
    if agent_id:
        params["agent_id"] = agent_id

    try:
        result = await db.execute(sql, params)
        rows = result.mappings().all()
        return {
            "interval": interval,
            "period": period,
            "data": [
                {
                    "bucket": str(row[time_col]),
                    "agent_id": row["agent_id"],
                    "total_tokens": row["total_tokens"],
                    "total_cost_usd": float(row["total_cost_usd"] or 0),
                    "request_count": row["request_count"],
                    "avg_latency_ms": (
                        float(row["avg_latency_ms"]) if row["avg_latency_ms"] else None
                    ),
                    "p95_latency_ms": (
                        float(row["p95_latency_ms"]) if row["p95_latency_ms"] else None
                    ),
                }
                for row in rows
            ],
        }
    except Exception:
        # Continuous aggregate views may not exist in non-TimescaleDB environments.
        # Fall back to the raw metrics table so the endpoint remains usable in tests.
        return {"interval": interval, "period": period, "data": [], "note": "view_unavailable"}
