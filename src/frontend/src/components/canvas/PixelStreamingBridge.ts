import type { Agent } from '../../types/agent';

export class PixelStreamingBridge {
  encodeAgentState(agent: Agent): string {
    return JSON.stringify({
      type: 'agent_update',
      agent_id: agent.id,
      name: agent.name,
      status: agent.status,
      xp: (agent as any).xp ?? 0,
      tokens_per_second: (agent as any).tokens_per_second ?? 0,
      position: (agent as any).position ?? { x: 0, y: 0 },
    });
  }

  encodeEvent(eventType: string, agentId: string, data: Record<string, unknown>): string {
    return JSON.stringify({
      type: eventType,
      agent_id: agentId,
      timestamp: Date.now(),
      ...data,
    });
  }

  encodeBulkState(agents: Agent[]): string {
    return JSON.stringify({
      type: 'bulk_state',
      agents: agents.map((a) => ({
        id: a.id,
        status: a.status,
        xp: (a as any).xp ?? 0,
        position: (a as any).position ?? { x: 0, y: 0 },
      })),
    });
  }
}
