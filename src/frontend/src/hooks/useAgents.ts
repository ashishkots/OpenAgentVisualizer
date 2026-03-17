import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export function useAgents(workspaceId = 'default') {
  return useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: () => apiClient.get(`/api/agents?workspace_id=${workspaceId}`).then(r => r.data),
    refetchInterval: 5000,
  });
}
