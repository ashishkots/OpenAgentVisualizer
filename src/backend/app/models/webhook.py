from sqlalchemy import String, Boolean, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from typing import Optional, List
import uuid

from app.core.database import Base
from app.core.utils import utcnow


class Webhook(Base):
    __tablename__ = "webhooks"
    __table_args__ = (Index("ix_webhooks_workspace_id", "workspace_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    secret: Mapped[str] = mapped_column(String(64), nullable=False)
    events: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    deliveries: Mapped[List["WebhookDelivery"]] = relationship(
        back_populates="webhook", cascade="all, delete-orphan"
    )


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"
    __table_args__ = (Index("ix_webhook_deliveries_webhook_id", "webhook_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    webhook_id: Mapped[str] = mapped_column(ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    response_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_retry_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    webhook: Mapped["Webhook"] = relationship(back_populates="deliveries")
