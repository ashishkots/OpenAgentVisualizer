"""Pydantic schemas for integration configuration API."""

import json
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class IntegrationConfigCreate(BaseModel):
    """Request body for creating or replacing an integration config."""

    product_name: str
    base_url: str
    api_key: str  # Plaintext; encrypted before storage; never returned
    enabled: bool = True
    settings: Optional[dict] = None

    @field_validator("product_name")
    @classmethod
    def validate_product_name(cls, v: str) -> str:
        allowed = {"opentrace", "openmesh", "openmind", "openshield"}
        if v not in allowed:
            raise ValueError(f"product_name must be one of {sorted(allowed)}")
        return v

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        if not v.startswith(("http://", "https://")):
            raise ValueError("base_url must start with http:// or https://")
        return v


class IntegrationConfigUpdate(BaseModel):
    """Partial update for an existing integration config."""

    base_url: Optional[str] = None
    api_key: Optional[str] = None  # Plaintext; encrypted before storage
    enabled: Optional[bool] = None
    settings: Optional[dict] = None

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().rstrip("/")
            if not v.startswith(("http://", "https://")):
                raise ValueError("base_url must start with http:// or https://")
        return v


class IntegrationConfigResponse(BaseModel):
    """API response for an integration config — API key is never included."""

    id: str
    workspace_id: str
    product_name: str
    base_url: str
    enabled: bool
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_settings(cls, obj: object) -> "IntegrationConfigResponse":
        """Build response, deserializing settings_json if present."""
        settings_dict: Optional[dict] = None
        raw = getattr(obj, "settings_json", None)
        if raw:
            try:
                settings_dict = json.loads(raw)
            except (ValueError, TypeError):
                settings_dict = None
        return cls(
            id=obj.id,  # type: ignore[attr-defined]
            workspace_id=obj.workspace_id,  # type: ignore[attr-defined]
            product_name=obj.product_name,  # type: ignore[attr-defined]
            base_url=obj.base_url,  # type: ignore[attr-defined]
            enabled=obj.enabled,  # type: ignore[attr-defined]
            settings=settings_dict,
            created_at=obj.created_at,  # type: ignore[attr-defined]
            updated_at=obj.updated_at,  # type: ignore[attr-defined]
        )


class IntegrationHealthResponse(BaseModel):
    """Health check result for a single integration."""

    product_name: str
    status: str  # "connected" | "disconnected" | "not_configured" | "circuit_open"
    latency_ms: Optional[float] = None
    error: Optional[str] = None
