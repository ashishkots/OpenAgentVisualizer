// Sprint 3 — Mesh / OpenMesh types

export type MeshRole = 'Producer' | 'Consumer' | 'Router';

export type MeshEdgeHealth = 'healthy' | 'high_latency' | 'high_error';

export interface MeshNode {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_level: number;
  agent_status: string;
  mesh_role: MeshRole;
  connected_peers: number;
  messages_sent: number;
  messages_received: number;
  last_seen: string;
  is_connected: boolean;
}

export interface MeshEdge {
  id: string;
  source_id: string;
  target_id: string;
  protocol: string;
  messages_per_hr: number;
  avg_latency_ms: number;
  error_rate: number;
  health: MeshEdgeHealth;
}

export interface MeshTopology {
  nodes: MeshNode[];
  edges: MeshEdge[];
  period: '1h' | '24h' | '7d';
  generated_at: string;
  summary: {
    total_agents: number;
    total_connections: number;
    messages_per_min: number;
    avg_latency_ms: number;
    error_rate: number;
  };
}
