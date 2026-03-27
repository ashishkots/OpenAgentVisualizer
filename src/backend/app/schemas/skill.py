"""Pydantic schemas for the skill tree progression system."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class SkillNodeRead(BaseModel):
    id: str
    tree_id: str
    name: str
    description: str
    parent_id: Optional[str] = None
    level_required: int
    cost: int
    stat_bonus: Optional[Any] = None
    icon: str
    tier: int

    model_config = {"from_attributes": True}


class SkillTreeRead(BaseModel):
    id: str
    name: str
    description: str
    category: str
    icon: str
    nodes: list[SkillNodeRead] = []

    model_config = {"from_attributes": True}


class AgentSkillRead(BaseModel):
    id: str
    agent_id: str
    node_id: str
    unlocked_at: datetime
    node: Optional[SkillNodeRead] = None

    model_config = {"from_attributes": True}


class UnlockSkillResponse(BaseModel):
    agent_skill_id: str
    node_id: str
    tokens_spent: int
    new_wallet_balance: int
