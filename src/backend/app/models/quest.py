from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from typing import Optional, List, Any, Dict
from app.core.database import Base
from app.core.utils import utcnow


class Quest(Base):
    __tablename__ = "quests"
    __table_args__ = (Index("ix_quests_workspace_id", "workspace_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # daily, weekly, epic
    steps: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0)
    currency_reward: Mapped[int] = mapped_column(Integer, default=0)
    icon: Mapped[str] = mapped_column(String(50), default="star")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    reset_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class AgentQuestProgress(Base):
    __tablename__ = "agent_quest_progress"
    __table_args__ = (Index("ix_agent_quest_progress_agent_id", "agent_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(
        ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    quest_id: Mapped[str] = mapped_column(
        ForeignKey("quests.id", ondelete="CASCADE"), nullable=False
    )
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    last_reset_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
