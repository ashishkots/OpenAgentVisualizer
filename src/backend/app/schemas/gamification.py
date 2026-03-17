from pydantic import BaseModel
from datetime import datetime


class LeaderboardEntry(BaseModel):
    agent_id: str
    name: str
    level: int
    xp_total: int
    rank: int

    model_config = {"from_attributes": True}


class XPTransactionRead(BaseModel):
    id: str
    xp_delta: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}
