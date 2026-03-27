from sqlalchemy import String, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import uuid
from typing import Optional, List
from app.core.database import Base
from app.core.utils import utcnow


class Team(Base):
    __tablename__ = "teams"
    __table_args__ = (Index("ix_teams_workspace_id", "workspace_id"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(50), default="users")
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    members: Mapped[List["TeamMember"]] = relationship(back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint("team_id", "agent_id"),
        Index("ix_team_members_team_id", "team_id"),
    )
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    role: Mapped[str] = mapped_column(String(20), default="member")  # leader, member
    joined_at: Mapped[datetime] = mapped_column(default=utcnow)
    team: Mapped["Team"] = relationship(back_populates="members")
