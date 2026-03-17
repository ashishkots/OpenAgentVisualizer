from sqlalchemy import String, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from typing import Optional, Dict, Any
from app.core.database import Base
from app.models.user import utcnow


class XPTransaction(Base):
    __tablename__ = "xp_transactions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    task_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    xp_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="warning")
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
