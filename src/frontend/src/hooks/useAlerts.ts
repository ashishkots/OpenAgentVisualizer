import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { AlertType } from '../types/gamification';

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await apiClient.get<AlertType[]>('/api/alerts');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await apiClient.patch(`/api/alerts/${alertId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
