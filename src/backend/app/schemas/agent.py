from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AgentCreate(BaseModel):
    name: str
    role: str = "agent"
    framework: str = "custom"
    avatar_id: str = "default"


class AgentRead(BaseModel):
    id: str
    workspace_id: str
    name: str
    role: str
    framework: str
    avatar_id: str
    status: str
    level: int
    xp_total: int
    total_tokens: int
    total_cost_usd: float
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentStats(BaseModel):
    id: str
    name: str
    level: int
    xp_total: int
    total_tokens: int
    total_cost_usd: float
    status: str

    model_config = {"from_attributes": True}
