import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import ForeignKey, String, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.utils import utcnow


def _default_expires() -> datetime:
    return datetime.now(tz=timezone.utc) + timedelta(days=7)


def _generate_token() -> str:
    return secrets.token_urlsafe(48)


class WorkspaceInvite(Base):
    __tablename__ = "workspace_invites"
    __table_args__ = (Index("ix_workspace_invites_workspace_id", "workspace_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")
    invited_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, default=_generate_token)
    expires_at: Mapped[datetime] = mapped_column(nullable=False, default=_default_expires)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
