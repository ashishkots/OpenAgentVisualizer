from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional


class LeaderboardEntry(BaseModel):
    """Single entry in the agent leaderboard."""

    agent_id: str
    name: str
    level: int
    xp_total: int
    rank: int
    achievement_count: int = 0
    trend: Literal["up", "down", "same"] = "same"

    model_config = {"from_attributes": True}


class LeaderboardResponse(BaseModel):
    """Leaderboard response with time-scoped and category support."""

    agents: list[LeaderboardEntry]
    period: str
    category: str


class XPTransactionRead(BaseModel):
    id: str
    xp_delta: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}
