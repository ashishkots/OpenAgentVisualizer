// Sprint 2: AgentStatus updated from idle|working|thinking|communicating|error
// to the canonical 5-state FSM: idle|active|waiting|error|complete
export type AgentStatus = 'idle' | 'active' | 'waiting' | 'error' | 'complete';

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  role: string;
  framework: string;
  avatar_id: string;
  status: AgentStatus;
  level: number;
  xp_total: number;
  total_tokens: number;
  total_cost_usd: number;
  created_at: string;
  updated_at: string;
  last_active_at?: string;
}

export interface Task {
  id: string;
  agent_id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tokens_used: number;
  cost_usd: number;
  xp_awarded: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface AgentPosition {
  agentId: string;
  x: number;
  y: number;
  zone: string;
}

export interface AgentRelationship {
  source: string;
  target: string;
  relationship_type: 'delegates_to' | 'shared_session' | 'data_flow';
  weight: number;
}

export interface AgentGraph {
  agents: Agent[];
  relationships: AgentRelationship[];
}
