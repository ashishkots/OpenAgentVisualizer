import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { SkillTree, AgentSkill } from '../types/skill';

export function useSkillTrees() {
  return useQuery({
    queryKey: ['skill-trees'],
    queryFn: async () => {
      const { data } = await apiClient.get<SkillTree[]>('/api/skill-trees');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useAgentSkills(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agent-skills', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<AgentSkill[]>(
        `/api/agents/${agentId}/skills`,
      );
      return data;
    },
    enabled: !!agentId,
    staleTime: 15_000,
  });
}

export function useUnlockSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      nodeId,
    }: {
      agentId: string;
      nodeId: string;
    }) => {
      const { data } = await apiClient.post(
        `/api/agents/${agentId}/skills/${nodeId}/unlock`,
      );
      return data;
    },
    onSuccess: (_data, { agentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['agent-skills', agentId] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
