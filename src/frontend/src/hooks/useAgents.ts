import { useQuery } from '@tanstack/react-query';
export function useAgents(workspaceId = 'default') {
  return useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch(`/api/agents?workspace_id=${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch agents');
      return r.json();
    },
    refetchInterval: 5000,
  });
}
