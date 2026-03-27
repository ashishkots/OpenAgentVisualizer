"""SSO models: SSOConfig and SSOSession."""
from sqlalchemy import String, Boolean, Text, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
import uuid

from app.core.database import Base
from app.core.utils import utcnow


class SSOConfig(Base):
    __tablename__ = "sso_configs"
    __table_args__ = (
        UniqueConstraint("workspace_id"),
        Index("ix_sso_configs_workspace_id", "workspace_id"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    provider_type: Mapped[str] = mapped_column(String(20), nullable=False)  # saml | oidc
    # SAML fields
    entity_id: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sso_url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    certificate: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    # OIDC fields
    client_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    client_secret_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    issuer: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)


class SSOSession(Base):
    __tablename__ = "sso_sessions"
    __table_args__ = (Index("ix_sso_sessions_user_id", "user_id"),)

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider_type: Mapped[str] = mapped_column(String(20), nullable=False)
    external_id: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
