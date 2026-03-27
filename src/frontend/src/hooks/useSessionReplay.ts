import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export interface SessionSummary {
  id: string;
  started_at: string;
  ended_at?: string;
  agent_count?: number;
}

export function useSessionReplay() {
  const query = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiClient.get('/api/replay/sessions?limit=20').then(r => r.data),
    staleTime: 10_000,
  });
  return { sessions: (query.data ?? []) as SessionSummary[], isLoading: query.isLoading };
}
