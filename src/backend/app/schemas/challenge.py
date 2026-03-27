from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ChallengeRead(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    type: str
    goal_type: str
    goal_value: int
    current_value: int
    reward_tokens: int
    reward_xp: int
    start_at: datetime
    end_at: datetime
    status: str
    progress_pct: float = 0.0

    model_config = {"from_attributes": True}


class ChallengeProgressRead(BaseModel):
    id: str
    challenge_id: str
    contributor_id: str
    contribution: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChallengeDetailRead(ChallengeRead):
    progress_entries: List[ChallengeProgressRead] = []

    model_config = {"from_attributes": True}
