from sqlalchemy import String, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from typing import Optional, Dict, Any
from app.core.database import Base
from app.core.utils import utcnow


class SkillTree(Base):
    __tablename__ = "skill_trees"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="zap")


class SkillNode(Base):
    __tablename__ = "skill_nodes"
    __table_args__ = (Index("ix_skill_nodes_tree_id", "tree_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tree_id: Mapped[str] = mapped_column(
        ForeignKey("skill_trees.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("skill_nodes.id", ondelete="SET NULL"), nullable=True
    )
    level_required: Mapped[int] = mapped_column(Integer, default=1)
    cost: Mapped[int] = mapped_column(Integer, default=50)
    stat_bonus: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    icon: Mapped[str] = mapped_column(String(50), default="zap")
    tier: Mapped[int] = mapped_column(Integer, default=1)


class AgentSkill(Base):
    __tablename__ = "agent_skills"
    __table_args__ = (Index("ix_agent_skills_agent_id", "agent_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(
        ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    node_id: Mapped[str] = mapped_column(
        ForeignKey("skill_nodes.id", ondelete="CASCADE"), nullable=False
    )
    unlocked_at: Mapped[datetime] = mapped_column(default=utcnow)
