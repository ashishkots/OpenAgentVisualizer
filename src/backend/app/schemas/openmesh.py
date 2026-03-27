"""Pydantic schemas for OpenMesh integration API responses."""

from pydantic import BaseModel


class MeshNodeView(BaseModel):
    """A single agent node in the mesh topology."""

    agent_id: str
    agent_name: str
    role: str  # producer | consumer | router
    status: str
    connected_peers: int
    messages_sent: int
    messages_received: int


class MeshEdgeView(BaseModel):
    """A directed communication link between two mesh nodes."""

    source_agent_id: str
    target_agent_id: str
    protocol: str  # grpc | http | websocket
    message_count: int
    avg_latency_ms: float
    error_rate: float


class MeshTopologyView(BaseModel):
    """Full mesh topology snapshot."""

    nodes: list[MeshNodeView]
    edges: list[MeshEdgeView]


class MeshStatsView(BaseModel):
    """Aggregate statistics for the mesh network."""

    total_agents: int
    total_connections: int
    total_messages: int
    avg_latency_ms: float
    error_rate: float
    period: str
