"""Multi-org models: Organization, OrgMember, SharedAgent."""
from sqlalchemy import String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
import uuid

from app.core.database import Base
from app.core.utils import utcnow


class Organization(Base):
    __tablename__ = "organizations"
    __table_args__ = (Index("ix_organizations_slug", "slug"),)

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")  # free|pro|enterprise
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class OrgMember(Base):
    __tablename__ = "org_members"
    __table_args__ = (
        UniqueConstraint("org_id", "user_id"),
        Index("ix_org_members_org_id", "org_id"),
        Index("ix_org_members_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="member")  # owner|admin|member
    joined_at: Mapped[datetime] = mapped_column(default=utcnow)


class SharedAgent(Base):
    __tablename__ = "shared_agents"
    __table_args__ = (
        UniqueConstraint("agent_id", "target_workspace_id"),
        Index("ix_shared_agents_source_workspace_id", "source_workspace_id"),
        Index("ix_shared_agents_target_workspace_id", "target_workspace_id"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"), nullable=False)
    source_workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id"), nullable=False
    )
    target_workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id"), nullable=False
    )
    permissions: Mapped[str] = mapped_column(String(20), default="read")  # read|write
    shared_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
