from sqlalchemy import String, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from typing import Optional, List, Dict, Any
from app.core.database import Base
from app.models.user import utcnow


class Event(Base):
    """TimescaleDB hypertable — partition key is timestamp."""
    __tablename__ = "events"
    __table_args__ = (Index("ix_events_workspace_ts", "workspace_id", "timestamp"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(default=utcnow)
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)


class Span(Base):
    """OTLP spans — TimescaleDB hypertable."""
    __tablename__ = "spans"
    __table_args__ = (Index("ix_spans_workspace_ts", "workspace_id", "start_time"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    trace_id: Mapped[str] = mapped_column(String(64), nullable=False)
    span_id: Mapped[str] = mapped_column(String(32), nullable=False)
    parent_span_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_time: Mapped[datetime] = mapped_column(nullable=False)
    end_time: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ok")
    attributes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)


class Session(Base):
    """Replay sessions."""
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    agent_ids: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    event_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(default=utcnow)
    ended_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
