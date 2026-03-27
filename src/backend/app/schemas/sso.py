"""Pydantic schemas for SSO configuration."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class SSOConfigCreate(BaseModel):
    """Request body for creating or updating SSO configuration."""

    provider_type: str = Field(..., description="saml or oidc")
    # SAML fields
    entity_id: Optional[str] = Field(None, description="SAML IdP entity ID")
    sso_url: Optional[str] = Field(None, description="SAML SSO URL or OIDC authorization endpoint")
    certificate: Optional[str] = Field(None, description="SAML IdP X.509 certificate (PEM)")
    metadata_url: Optional[str] = Field(None, description="SAML metadata URL (optional)")
    # OIDC fields
    client_id: Optional[str] = Field(None, description="OIDC client ID")
    client_secret: Optional[str] = Field(None, description="OIDC client secret (stored encrypted)")
    issuer: Optional[str] = Field(None, description="OIDC issuer URL")
    enabled: bool = False

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "provider_type": "oidc",
                    "client_id": "my-client",
                    "client_secret": "s3cr3t",
                    "issuer": "https://accounts.google.com",
                    "enabled": True,
                }
            ]
        }
    }


class SSOConfigRead(BaseModel):
    """Response model for SSO configuration (client_secret omitted)."""

    id: str
    workspace_id: str
    provider_type: str
    entity_id: Optional[str]
    sso_url: Optional[str]
    certificate: Optional[str]
    metadata_url: Optional[str]
    client_id: Optional[str]
    issuer: Optional[str]
    enabled: bool

    model_config = {"from_attributes": True}


class SSOTestResult(BaseModel):
    """Result from testing an SSO configuration."""

    success: bool
    message: str
