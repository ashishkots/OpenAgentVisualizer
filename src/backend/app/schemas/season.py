from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class SeasonRead(BaseModel):
    id: str
    workspace_id: str
    name: str
    number: int
    start_at: datetime
    end_at: datetime
    status: str
    days_remaining: Optional[int] = None

    model_config = {"from_attributes": True}


class SeasonalXPRead(BaseModel):
    id: str
    season_id: str
    agent_id: str
    xp: int

    model_config = {"from_attributes": True}


class SeasonLeaderboardEntry(BaseModel):
    rank: int
    agent_id: str
    agent_name: str
    xp: int
    level: int


class SeasonLeaderboardResponse(BaseModel):
    season_id: str
    season_name: str
    entries: List[SeasonLeaderboardEntry]
