from sqlalchemy import String, Integer, Float, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import uuid
from typing import Optional, List
from app.core.database import Base
from app.core.utils import utcnow


class Tournament(Base):
    __tablename__ = "tournaments"
    __table_args__ = (Index("ix_tournaments_workspace_id", "workspace_id"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # speed, accuracy, cost_efficiency
    start_at: Mapped[datetime] = mapped_column(nullable=False)
    end_at: Mapped[datetime] = mapped_column(nullable=False)
    entry_fee: Mapped[int] = mapped_column(Integer, default=0)
    prize_pool: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="upcoming")  # upcoming, active, completed
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    entries: Mapped[List["TournamentEntry"]] = relationship(back_populates="tournament")


class TournamentEntry(Base):
    __tablename__ = "tournament_entries"
    __table_args__ = (
        UniqueConstraint("tournament_id", "agent_id"),
        Index("ix_tournament_entries_tournament_id", "tournament_id"),
    )
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tournament_id: Mapped[str] = mapped_column(ForeignKey("tournaments.id"))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    score: Mapped[float] = mapped_column(Float, default=0.0)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    prize_awarded: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    entered_at: Mapped[datetime] = mapped_column(default=utcnow)
    tournament: Mapped["Tournament"] = relationship(back_populates="entries")
