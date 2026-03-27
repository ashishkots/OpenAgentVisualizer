import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Quest, AgentQuestProgress } from '../types/quest';

interface QuestsResponse {
  items: Quest[];
  total: number;
}

export function useQuests(params?: { type?: string; agent_id?: string }) {
  return useQuery({
    queryKey: ['quests', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.agent_id) searchParams.set('agent_id', params.agent_id);
      const qs = searchParams.toString();
      const { data } = await apiClient.get<QuestsResponse | Quest[]>(
        `/api/quests${qs ? `?${qs}` : ''}`,
      );
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 30_000,
  });
}

export function useAgentQuests(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agent-quests', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQuestProgress[]>(
        `/api/agents/${agentId}/quests`,
      );
      return data;
    },
    enabled: !!agentId,
    staleTime: 15_000,
  });
}

export function useClaimQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      const { data } = await apiClient.post(`/api/quests/${questId}/claim`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['quests'] });
      void queryClient.invalidateQueries({ queryKey: ['agent-quests'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
