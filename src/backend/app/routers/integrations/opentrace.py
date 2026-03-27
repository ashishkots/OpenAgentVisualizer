"""OpenTrace proxy endpoints.

Proxies trace queries from OpenAgentVisualizer UI to the OpenTrace product API,
adding Redis caching and circuit breaker protection.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.integrations import CircuitBreakerError
from app.schemas.opentrace import TraceDetailView, TraceView
from app.services.opentrace_service import opentrace_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/integrations/opentrace",
    tags=["integrations", "opentrace"],
)


@router.get("/traces", response_model=list[TraceView])
async def list_agent_traces(
    agent_id: str = Query(..., description="Agent ID to fetch traces for"),
    limit: int = Query(20, ge=1, le=100),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list[TraceView]:
    """Fetch the most recent traces for a specific agent from OpenTrace.

    Returns a list sorted by timestamp descending (newest first).
    Falls back to HTTP 503 when the circuit breaker is OPEN.
    """
    try:
        raw = await opentrace_service.get_traces(workspace_id, agent_id, limit, db)
        return [TraceView(**item) for item in raw]
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace is temporarily unavailable",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("OpenTrace list_traces error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace connection unavailable",
        )


@router.get("/traces/{trace_id}", response_model=TraceDetailView)
async def get_trace_detail(
    trace_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TraceDetailView:
    """Fetch full trace detail with all spans for waterfall rendering."""
    try:
        raw = await opentrace_service.get_trace_detail(workspace_id, trace_id, db)
        return TraceDetailView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenTrace get_trace error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace connection unavailable",
        )


@router.get("/traces/{trace_id}/waterfall", response_model=TraceDetailView)
async def get_trace_waterfall(
    trace_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TraceDetailView:
    """Fetch trace formatted for waterfall chart rendering."""
    try:
        raw = await opentrace_service.get_trace_waterfall(workspace_id, trace_id, db)
        return TraceDetailView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenTrace get_waterfall error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace connection unavailable",
        )


@router.get("/search", response_model=list[TraceView])
async def search_traces(
    agent_id: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    min_duration_ms: Optional[float] = Query(None),
    error: Optional[bool] = Query(None),
    start: Optional[str] = Query(None, description="ISO 8601 start timestamp"),
    end: Optional[str] = Query(None, description="ISO 8601 end timestamp"),
    limit: int = Query(20, ge=1, le=100),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list[TraceView]:
    """Search traces with flexible filters."""
    params = {
        "agent_id": agent_id,
        "service": service,
        "min_duration": min_duration_ms,
        "error": error,
        "start": start,
        "end": end,
        "limit": limit,
    }
    try:
        raw = await opentrace_service.search_traces(workspace_id, params, db)
        return [TraceView(**item) for item in raw]
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenTrace search error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenTrace connection unavailable",
        )
