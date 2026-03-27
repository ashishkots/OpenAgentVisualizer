import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Challenge, ChallengeProgress } from '../types/team';

interface ChallengesResponse {
  items: Challenge[];
  total: number;
}

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data } = await apiClient.get<ChallengesResponse | Challenge[]>('/api/challenges');
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}

export function useChallenge(id: string | undefined) {
  return useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Challenge>(`/api/challenges/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useChallengeProgress(id: string | undefined) {
  return useQuery({
    queryKey: ['challenge-progress', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ChallengeProgress[]>(
        `/api/challenges/${id}/progress`,
      );
      return data;
    },
    enabled: !!id,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}
