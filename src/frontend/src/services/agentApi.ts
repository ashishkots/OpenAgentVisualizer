import { apiClient } from './api';
import type { Agent } from '../types/agent';

export const getAgents = async (): Promise<Agent[]> => {
  const { data } = await apiClient.get<Agent[]>('/api/agents');
  return data;
};

export const createAgent = async (payload: Pick<Agent, 'name' | 'role' | 'framework'>): Promise<Agent> => {
  const { data } = await apiClient.post<Agent>('/api/agents', payload);
  return data;
};

export const getAgentStats = async (agentId: string): Promise<Agent> => {
  const { data } = await apiClient.get<Agent>(`/api/agents/${agentId}/stats`);
  return data;
};
