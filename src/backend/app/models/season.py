from sqlalchemy import String, Integer, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import uuid
from typing import Optional, List
from app.core.database import Base
from app.core.utils import utcnow


class Season(Base):
    __tablename__ = "seasons"
    __table_args__ = (Index("ix_seasons_workspace_id", "workspace_id"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_at: Mapped[datetime] = mapped_column(nullable=False)
    end_at: Mapped[datetime] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, completed
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    seasonal_xp: Mapped[List["SeasonalXP"]] = relationship(back_populates="season")


class SeasonalXP(Base):
    __tablename__ = "seasonal_xp"
    __table_args__ = (
        UniqueConstraint("season_id", "agent_id"),
        Index("ix_seasonal_xp_season_id", "season_id"),
    )
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    season_id: Mapped[str] = mapped_column(ForeignKey("seasons.id"))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    xp: Mapped[int] = mapped_column(Integer, default=0)
    season: Mapped["Season"] = relationship(back_populates="seasonal_xp")
