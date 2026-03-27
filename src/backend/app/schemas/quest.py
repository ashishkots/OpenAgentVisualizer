"""Pydantic schemas for the quest progression system."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class QuestRead(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: str
    type: str
    steps: Optional[Any] = None
    xp_reward: int
    currency_reward: int
    icon: str
    active: bool
    reset_hours: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentQuestProgressRead(BaseModel):
    id: str
    agent_id: str
    quest_id: str
    current_step: int
    completed: bool
    claimed: bool
    completed_at: Optional[datetime] = None
    last_reset_at: Optional[datetime] = None
    quest: Optional[QuestRead] = None

    model_config = {"from_attributes": True}


class QuestWithProgressRead(QuestRead):
    """Quest including the requesting agent's progress, if any."""

    progress: Optional[AgentQuestProgressRead] = None
