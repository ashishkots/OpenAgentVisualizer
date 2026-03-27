from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class TournamentRead(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    type: str
    start_at: datetime
    end_at: datetime
    entry_fee: int
    prize_pool: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TournamentEntryRead(BaseModel):
    id: str
    tournament_id: str
    agent_id: str
    score: float
    rank: Optional[int] = None
    prize_awarded: Optional[int] = None
    entered_at: datetime

    model_config = {"from_attributes": True}


class TournamentDetailRead(TournamentRead):
    entries: List[TournamentEntryRead] = []

    model_config = {"from_attributes": True}


class TournamentLeaderboardEntry(BaseModel):
    rank: int
    agent_id: str
    agent_name: str
    score: float
    prize_awarded: Optional[int] = None

    model_config = {"from_attributes": True}


class TournamentLeaderboardResponse(BaseModel):
    tournament_id: str
    entries: List[TournamentLeaderboardEntry]
