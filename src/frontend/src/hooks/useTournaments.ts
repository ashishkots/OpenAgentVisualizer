import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Tournament, TournamentEntry, TournamentStatus, Season, SeasonalXP } from '../types/tournament';

interface TournamentsResponse {
  items: Tournament[];
  total: number;
}

interface SeasonLeaderboardResponse {
  items: SeasonalXP[];
  total: number;
}

export function useTournaments(status?: TournamentStatus) {
  return useQuery({
    queryKey: ['tournaments', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await apiClient.get<TournamentsResponse | Tournament[]>(
        `/api/tournaments${params}`,
      );
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 30_000,
  });
}

export function useTournament(id: string | undefined) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Tournament>(`/api/tournaments/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useEnterTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const { data } = await apiClient.post<TournamentEntry>(
        `/api/tournaments/${tournamentId}/enter`,
      );
      return data;
    },
    onSuccess: (_data, tournamentId) => {
      void queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      void queryClient.invalidateQueries({ queryKey: ['tournament-leaderboard', tournamentId] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useTournamentLeaderboard(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['tournament-leaderboard', tournamentId],
    queryFn: async () => {
      const { data } = await apiClient.get<TournamentEntry[]>(
        `/api/tournaments/${tournamentId}/leaderboard`,
      );
      return data;
    },
    enabled: !!tournamentId,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ['season', 'current'],
    queryFn: async () => {
      const { data } = await apiClient.get<Season>('/api/seasons/current');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useSeasonLeaderboard(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['season-leaderboard', seasonId],
    queryFn: async () => {
      const { data } = await apiClient.get<SeasonLeaderboardResponse | SeasonalXP[]>(
        `/api/seasons/${seasonId}/leaderboard`,
      );
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    enabled: !!seasonId,
    staleTime: 30_000,
  });
}
