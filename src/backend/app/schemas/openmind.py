"""Pydantic schemas for OpenMind knowledge graph integration API responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KnowledgeNodeView(BaseModel):
    """A single entity in the knowledge graph."""

    entity_id: str
    name: str
    type: str  # concept | fact | agent_memory | embedding
    description: Optional[str] = None
    created_at: datetime
    relevance_score: float


class KnowledgeEdgeView(BaseModel):
    """A directed relationship between two knowledge entities."""

    source_entity_id: str
    target_entity_id: str
    relationship_type: str
    weight: float
    contributing_agents: list[str]


class KnowledgeGraphView(BaseModel):
    """Paginated knowledge graph snapshot."""

    nodes: list[KnowledgeNodeView]
    edges: list[KnowledgeEdgeView]
    total_count: int  # Total entities in the full graph (before pagination)


class EntityDetailView(BaseModel):
    """Full entity detail including related nodes."""

    entity_id: str
    name: str
    type: str
    description: Optional[str] = None
    created_at: datetime
    related_agents: list[str]
    related_entities: list[KnowledgeNodeView]  # Top 5 related entities
