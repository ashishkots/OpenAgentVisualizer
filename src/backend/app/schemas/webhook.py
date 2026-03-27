"""Pydantic schemas for the Webhook subsystem."""
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, HttpUrl, field_validator

# Valid event types for webhook subscriptions
WEBHOOK_EVENT_TYPES: list[str] = [
    "agent.created",
    "agent.status_changed",
    "task.completed",
    "alert.triggered",
    "achievement.unlocked",
    "level_up",
    "challenge.completed",
    "tournament.finalized",
]


class WebhookCreate(BaseModel):
    """Request body for creating a webhook."""

    name: str
    url: str
    events: List[str]
    active: bool = True

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: list[str]) -> list[str]:
        invalid = set(v) - set(WEBHOOK_EVENT_TYPES)
        if invalid:
            raise ValueError(f"Unknown event types: {invalid}")
        if not v:
            raise ValueError("At least one event type is required")
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "My Slack Webhook",
                    "url": "https://hooks.slack.com/services/T00/B00/XXX",
                    "events": ["agent.status_changed", "achievement.unlocked"],
                    "active": True,
                }
            ]
        }
    }


class WebhookUpdate(BaseModel):
    """Request body for updating a webhook."""

    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        invalid = set(v) - set(WEBHOOK_EVENT_TYPES)
        if invalid:
            raise ValueError(f"Unknown event types: {invalid}")
        return v


class WebhookRead(BaseModel):
    """Response schema for a webhook. Secret is omitted after creation."""

    id: str
    workspace_id: str
    name: str
    url: str
    events: List[str]
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookCreatedRead(WebhookRead):
    """Response schema returned only at creation time — includes the secret."""

    secret: str

    model_config = {"from_attributes": True}


class WebhookDeliveryRead(BaseModel):
    """Response schema for a webhook delivery record."""

    id: str
    webhook_id: str
    event_type: str
    payload: dict[str, Any]
    status: str
    response_code: Optional[int]
    attempts: int
    next_retry_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
