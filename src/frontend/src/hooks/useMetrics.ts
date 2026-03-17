import { useQuery } from '@tanstack/react-query';
import { getCosts, getTokenUsage } from '../services/metricsApi';

export function useMetrics(period: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['metrics', period],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch(`/api/dashboard/metrics?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch metrics');
      return r.json();
    },
    staleTime: 30_000,
  });
}

export function useCosts() {
  return useQuery({
    queryKey: ['costs'],
    queryFn: getCosts,
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
