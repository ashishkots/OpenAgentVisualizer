"""Integration configuration SQLAlchemy model.

Stores per-workspace overrides for cross-product integration settings.
API keys are stored encrypted at rest (Fernet via app.core.integrations).
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.utils import utcnow


class IntegrationConfig(Base):
    """Per-workspace integration configuration record.

    One row per (workspace_id, product_name) pair — enforced by unique index.
    product_name is one of: opentrace | openmesh | openmind | openshield
    """

    __tablename__ = "integration_configs"
    __table_args__ = (
        Index(
            "ix_integration_configs_workspace_product",
            "workspace_id",
            "product_name",
            unique=True,
        ),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id"), nullable=False
    )
    # Canonical product identifier, e.g. "opentrace"
    product_name: Mapped[str] = mapped_column(String(50), nullable=False)
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    # Fernet-encrypted API key; never returned in API responses
    api_key_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # Optional product-specific settings stored as a JSON string
    settings_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
