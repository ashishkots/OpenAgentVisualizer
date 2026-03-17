from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SessionCreate(BaseModel):
    name: str = ""
    agent_ids: Optional[List[str]] = None


class SessionRead(BaseModel):
    id: str
    workspace_id: str
    name: str
    agent_ids: Optional[List[str]]
    event_count: int
    started_at: datetime
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}
