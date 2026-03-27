from sqlalchemy import String, Integer, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid

from app.core.database import Base
from app.core.utils import utcnow


class Achievement(Base):
    """Earned achievement record for an agent.

    One row per (workspace, agent, achievement_id) — enforced by the unique
    constraint. The achievement_id is a static code like "ACH-001".
    """

    __tablename__ = "achievements"
    __table_args__ = (
        UniqueConstraint(
            "workspace_id", "agent_id", "achievement_id",
            name="uq_achievement_per_agent",
        ),
        Index("ix_achievements_workspace_agent", "workspace_id", "agent_id"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    # Static achievement code, e.g. "ACH-001"
    achievement_id: Mapped[str] = mapped_column(String(20), nullable=False)
    achievement_name: Mapped[str] = mapped_column(String(100), nullable=False)
    xp_bonus: Mapped[int] = mapped_column(Integer, nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(default=utcnow)
