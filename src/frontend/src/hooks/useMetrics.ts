import { useQuery } from '@tanstack/react-query';
import { getTokenUsage } from '../services/metricsApi';
import { apiClient } from '../services/api';

export function useMetrics(period: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['metrics', period],
    queryFn: () => apiClient.get(`/api/dashboard/metrics?period=${period}`).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useCosts(period: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['costs', period],
    queryFn: () => apiClient.get(`/api/costs/breakdown?period=${period}`).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useTokenUsage() {
  return useQuery({
    queryKey: ['token-usage'],
    queryFn: getTokenUsage,
    staleTime: 60_000,
  });
}
