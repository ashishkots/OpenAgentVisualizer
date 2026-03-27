"""Pydantic schemas for Organization, OrgMember, and analytics."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OrgCreate(BaseModel):
    """Request body for creating an organization."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, description="URL-safe slug; auto-generated if omitted")
    logo_url: Optional[str] = None
    plan: str = Field("free", description="free, pro, or enterprise")

    model_config = {
        "json_schema_extra": {
            "examples": [{"name": "Acme Corp", "plan": "pro"}]
        }
    }


class OrgUpdate(BaseModel):
    """Request body for updating an organization."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    logo_url: Optional[str] = None


class OrgRead(BaseModel):
    """Organization response model."""

    id: str
    name: str
    slug: str
    logo_url: Optional[str]
    plan: str
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgMemberAdd(BaseModel):
    """Request to add a member to an organization."""

    email: str
    role: str = Field("member", description="owner, admin, or member")


class OrgMemberRead(BaseModel):
    """Organization member response model."""

    id: str
    org_id: str
    user_id: str
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceRead(BaseModel):
    """Minimal workspace read for org workspace listing."""

    id: str
    name: str
    slug: str
    org_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgAnalytics(BaseModel):
    """Cross-workspace aggregate analytics for an organization."""

    org_id: str
    total_workspaces: int
    total_agents: int
    total_events: int
    total_xp: int
