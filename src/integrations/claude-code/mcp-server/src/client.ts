// OAV REST API client + all shared types

export interface Agent {
  id: string;
  name: string;
  status: string;
  xp_total: number;
}

export interface Metrics {
  total_cost: number;
  total_tokens: number;
  agent_count: number;
  error_rate: number;
}

export interface Alert {
  id: string;
  severity: string;
  message: string;
  created_at: string;
}

export interface Trace {
  id: string;
  agent_id: string;
  operation: string;
  latency_ms: number;
  cost_usd: number;
  created_at: string;
}

export class OAVClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  private async request<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...opts,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(opts?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`OAV API ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  async listAgents(workspaceId: string, status?: string): Promise<Agent[]> {
    const q = status ? `&status=${status}` : '';
    return this.request<Agent[]>(`/api/agents?workspace_id=${workspaceId}${q}`);
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>(`/api/agents/${agentId}`);
  }

  async getMetrics(period: string): Promise<Metrics> {
    return this.request<Metrics>(`/api/dashboard/metrics?period=${period}`);
  }

  async listAlerts(severity?: string): Promise<Alert[]> {
    const q = severity ? `?severity=${severity}` : '';
    return this.request<Alert[]>(`/api/alerts${q}`);
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.request(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' });
  }

  async listTraces(agentId?: string, limit = 20): Promise<Trace[]> {
    const q = agentId ? `?agent_id=${agentId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<Trace[]>(`/api/traces${q}`);
  }

  async getTrace(traceId: string): Promise<Trace> {
    return this.request<Trace>(`/api/traces/${traceId}`);
  }

  async getCostSummary(period: string): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/api/costs/summary?period=${period}`);
  }

  async getTopAgentsByXP(limit = 10): Promise<Agent[]> {
    return this.request<Agent[]>(`/api/agents?sort=xp_total&limit=${limit}`);
  }

  async getWorkspace(workspaceId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/api/workspaces/${workspaceId}`);
  }

  async listIntegrations(): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(`/api/integrations`);
  }

  async replaySession(sessionId: string): Promise<void> {
    await this.request(`/api/replay/${sessionId}/start`, { method: 'POST' });
  }

  async getSLOStatus(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/api/slo/status`);
  }

  async getTopology(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/api/topology`);
  }
}
