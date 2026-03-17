from sqlalchemy import String, Integer, Float, Index
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid
from typing import Optional, Dict, Any
from app.core.database import Base
from app.models.user import utcnow


class MetricsRaw(Base):
    """Raw token/cost data point — TimescaleDB hypertable."""
    __tablename__ = "metrics_raw"
    __table_args__ = (Index("ix_metrics_raw_agent_ts", "agent_id", "timestamp"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    task_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    model: Mapped[str] = mapped_column(String(100), default="unknown")
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[datetime] = mapped_column(default=utcnow)


class MetricsAgg(Base):
    """Hourly aggregated metrics."""
    __tablename__ = "metrics_agg"
    __table_args__ = (Index("ix_metrics_agg_agent_bucket", "agent_id", "bucket"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    bucket: Mapped[datetime] = mapped_column(nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    task_count: Mapped[int] = mapped_column(Integer, default=0)
