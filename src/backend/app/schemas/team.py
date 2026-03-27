from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: str = "users"


class TeamMemberRead(BaseModel):
    id: str
    team_id: str
    agent_id: str
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class TeamRead(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    icon: str
    created_by: str
    created_at: datetime
    members: List[TeamMemberRead] = []

    model_config = {"from_attributes": True}


class TeamStats(BaseModel):
    team_id: str
    team_name: str
    member_count: int
    total_xp: int
    total_tasks: int
    level: int
    level_name: str


class AddMemberRequest(BaseModel):
    agent_id: str
    role: str = "member"
