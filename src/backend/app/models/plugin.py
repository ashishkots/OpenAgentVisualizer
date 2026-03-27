from sqlalchemy import String, Boolean, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from typing import Optional
import uuid

from app.core.database import Base
from app.core.utils import utcnow


class PluginRegistry(Base):
    """Global plugin registry — plugins available for installation."""

    __tablename__ = "plugin_registry"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    manifest_url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    download_url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    downloads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class Plugin(Base):
    """Workspace-installed plugin instance."""

    __tablename__ = "plugins"
    __table_args__ = (Index("ix_plugins_workspace_id", "workspace_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    manifest: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="installed", nullable=False)
    installed_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    installed_at: Mapped[datetime] = mapped_column(default=utcnow)
