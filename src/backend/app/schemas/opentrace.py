"""Pydantic schemas for OpenTrace integration API responses."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class TraceView(BaseModel):
    """Summary view of a distributed trace."""

    trace_id: str
    root_service: str
    root_operation: str
    duration_ms: float
    span_count: int
    error_count: int
    started_at: datetime


class SpanView(BaseModel):
    """A single span within a trace."""

    span_id: str
    parent_span_id: Optional[str] = None
    service: str
    operation: str
    duration_ms: float
    status: str
    start_time: datetime
    end_time: datetime
    attributes: dict[str, Any] = {}


class TraceDetailView(BaseModel):
    """Full trace with all spans."""

    trace_id: str
    spans: list[SpanView]
    duration_ms: float
    service_count: int


class TraceWaterfallView(BaseModel):
    """Waterfall-ready representation of a trace."""

    trace_id: str
    total_duration_ms: float
    trace_start: datetime
    spans: list[SpanView]


class TraceSearchParams(BaseModel):
    """Query parameters for trace search."""

    agent_id: Optional[str] = None
    service: Optional[str] = None
    min_duration_ms: Optional[float] = None
    error: Optional[bool] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    limit: int = 20
