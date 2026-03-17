import { apiClient } from './api';

export interface Session {
  id: string;
  workspace_id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  event_count: number;
}

export interface ReplayEvent {
  id: string;
  event_type: string;
  agent_id: string | null;
  payload: Record<string, unknown>;
  timestamp: string;
}

export const getSessions = async (): Promise<Session[]> => {
  const { data } = await apiClient.get<Session[]>('/api/sessions');
  return data;
};

export const getSessionReplay = async (sessionId: string): Promise<ReplayEvent[]> => {
  const { data } = await apiClient.get<ReplayEvent[]>(`/api/sessions/${sessionId}/replay`);
  return data;
};

export const createSession = async (name?: string): Promise<Session> => {
  const { data } = await apiClient.post<Session>('/api/sessions', { name });
  return data;
};
