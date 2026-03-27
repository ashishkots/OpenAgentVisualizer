import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Team, TeamMember, TeamStats, TeamCreate } from '../types/team';

interface TeamsResponse {
  items: Team[];
  total: number;
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data } = await apiClient.get<TeamsResponse | Team[]>('/api/teams');
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 30_000,
  });
}

export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Team>(`/api/teams/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TeamCreate) => {
      const { data } = await apiClient.post<Team>('/api/teams', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, agentId }: { teamId: string; agentId: string }) => {
      const { data } = await apiClient.post<TeamMember>(`/api/teams/${teamId}/members`, {
        agent_id: agentId,
      });
      return data;
    },
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, agentId }: { teamId: string; agentId: string }) => {
      await apiClient.delete(`/api/teams/${teamId}/members/${agentId}`);
    },
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useTeamStats(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team-stats', teamId],
    queryFn: async () => {
      const { data } = await apiClient.get<TeamStats>(`/api/teams/${teamId}/stats`);
      return data;
    },
    enabled: !!teamId,
    staleTime: 15_000,
  });
}
