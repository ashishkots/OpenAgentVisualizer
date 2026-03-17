import { create } from 'zustand';
import type { Agent, AgentStatus, AgentPosition } from '../types/agent';

interface AgentStore {
  agents: Record<string, Agent>;
  positions: Record<string, AgentPosition>;
  upsertAgent: (agent: Agent) => void;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agent: Agent) => void;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  setAgentPosition: (pos: AgentPosition) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {},
  positions: {},
  upsertAgent: (agent) => set((s) => ({ agents: { ...s.agents, [agent.id]: agent } })),
  setAgents: (agents) =>
    set({
      agents: Object.fromEntries(agents.map((a) => [a.id, a])),
    }),
  updateAgent: (agent) => set((s) => ({ agents: { ...s.agents, [agent.id]: agent } })),
  setAgentStatus: (agentId, status) =>
    set((s) => ({
      agents: s.agents[agentId]
        ? { ...s.agents, [agentId]: { ...s.agents[agentId], status } }
        : s.agents,
    })),
  setAgentPosition: (pos) => set((s) => ({ positions: { ...s.positions, [pos.agentId]: pos } })),
  reset: () => set({ agents: {}, positions: {} }),
}));
