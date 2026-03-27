from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional


class AchievementRead(BaseModel):
    """Earned achievement record returned by the API."""

    id: str
    achievement_id: str
    achievement_name: str
    xp_bonus: int
    unlocked_at: datetime

    model_config = {"from_attributes": True}


class AchievementDefinitionRead(BaseModel):
    """Static achievement definition returned by the definitions endpoint."""

    id: str
    name: str
    description: str
    condition_summary: str
    xp_bonus: int
    icon: str


class GraphNode(BaseModel):
    """Agent node in the relationship graph."""

    id: str
    name: str
    status: str
    level: int
    xp_total: int


class GraphEdge(BaseModel):
    """Directed or undirected relationship between two agents."""

    source: str
    target: str
    edge_type: Literal["delegates_to", "shared_session", "data_flow", "monitors"]
    weight: int
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None


class AgentGraph(BaseModel):
    """Full agent relationship graph for a workspace."""

    nodes: list[GraphNode]
    edges: list[GraphEdge]
