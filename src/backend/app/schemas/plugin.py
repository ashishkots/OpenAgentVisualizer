"""Pydantic schemas for the Plugin subsystem."""
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class PluginManifest(BaseModel):
    """Embedded plugin manifest declaring permissions and hooks."""

    name: str
    version: str
    author: str
    description: str
    permissions: List[str] = []
    hooks: List[str] = []
    routes: List[str] = []

    model_config = {"from_attributes": True}


class PluginRegistryRead(BaseModel):
    """Response schema for a single plugin registry entry."""

    id: str
    name: str
    description: str
    version: str
    author: str
    manifest_url: Optional[str]
    download_url: Optional[str]
    verified: bool
    downloads: int
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "slack-notifier",
                    "description": "Sends alerts to Slack",
                    "version": "2.1.0",
                    "author": "OAV Core Team",
                    "manifest_url": None,
                    "download_url": None,
                    "verified": True,
                    "downloads": 2500,
                    "created_at": "2026-03-27T00:00:00Z",
                }
            ]
        },
    }


class PluginRead(BaseModel):
    """Response schema for an installed plugin."""

    id: str
    workspace_id: str
    name: str
    description: str
    version: str
    author: str
    manifest: dict[str, Any]
    status: str
    installed_by: str
    installed_at: datetime

    model_config = {"from_attributes": True}


class PluginInstallRequest(BaseModel):
    """Request body for installing a plugin from the registry."""

    registry_id: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"registry_id": "550e8400-e29b-41d4-a716-446655440000"}
            ]
        }
    }
