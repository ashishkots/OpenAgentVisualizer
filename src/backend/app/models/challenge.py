from sqlalchemy import String, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import uuid
from typing import Optional, List
from app.core.database import Base
from app.core.utils import utcnow


class Challenge(Base):
    __tablename__ = "challenges"
    __table_args__ = (Index("ix_challenges_workspace_id", "workspace_id"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # team, workspace
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)  # events, tasks, xp
    goal_value: Mapped[int] = mapped_column(Integer, nullable=False)
    current_value: Mapped[int] = mapped_column(Integer, default=0)
    reward_tokens: Mapped[int] = mapped_column(Integer, default=0)
    reward_xp: Mapped[int] = mapped_column(Integer, default=0)
    start_at: Mapped[datetime] = mapped_column(nullable=False)
    end_at: Mapped[datetime] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, completed, failed
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    progress_entries: Mapped[List["ChallengeProgress"]] = relationship(back_populates="challenge")


class ChallengeProgress(Base):
    __tablename__ = "challenge_progress"
    __table_args__ = (Index("ix_challenge_progress_challenge_id", "challenge_id"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id: Mapped[str] = mapped_column(ForeignKey("challenges.id"))
    contributor_id: Mapped[str] = mapped_column(String(255), nullable=False)  # agent_id or team_id
    contribution: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
    challenge: Mapped["Challenge"] = relationship(back_populates="progress_entries")
