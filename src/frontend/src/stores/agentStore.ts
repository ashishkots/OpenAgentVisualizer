import { create } from 'zustand';
import type { Agent, AgentStatus, AgentPosition } from '../types/agent';

interface AgentStore {
  agents: Record<string, Agent>;
  positions: Record<string, AgentPosition>;
  selectedAgentId: string | null;
  filterStatus: AgentStatus | 'all';
  filterLevelMin: number;
  filterLevelMax: number;
  upsertAgent: (agent: Agent) => void;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  setAgentPosition: (pos: AgentPosition) => void;
  setSelectedAgent: (id: string | null) => void;
  setFilterStatus: (status: AgentStatus | 'all') => void;
  setFilterLevel: (min: number, max: number) => void;
  getFilteredAgents: () => Agent[];
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: {},
  positions: {},
  selectedAgentId: null,
  filterStatus: 'all',
  filterLevelMin: 1,
  filterLevelMax: 10,

  upsertAgent: (agent) =>
    set((s) => ({ agents: { ...s.agents, [agent.id]: agent } })),

  setAgentStatus: (agentId, status) =>
    set((s) => ({
      agents: s.agents[agentId]
        ? { ...s.agents, [agentId]: { ...s.agents[agentId], status } }
        : s.agents,
    })),

  setAgentPosition: (pos) =>
    set((s) => ({ positions: { ...s.positions, [pos.agentId]: pos } })),

  setSelectedAgent: (id) => set({ selectedAgentId: id }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setFilterLevel: (min, max) => set({ filterLevelMin: min, filterLevelMax: max }),

  getFilteredAgents: () => {
    const { agents, filterStatus, filterLevelMin, filterLevelMax } = get();
    return Object.values(agents).filter((a) => {
      const statusMatch = filterStatus === 'all' || a.status === filterStatus;
      const levelMatch = a.level >= filterLevelMin && a.level <= filterLevelMax;
      return statusMatch && levelMatch;
    });
  },

  reset: () =>
    set({
      agents: {},
      positions: {},
      selectedAgentId: null,
      filterStatus: 'all',
      filterLevelMin: 1,
      filterLevelMax: 10,
    }),
}));
