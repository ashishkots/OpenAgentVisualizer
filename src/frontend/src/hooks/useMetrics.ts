import { useQuery } from '@tanstack/react-query';
import { getCosts, getTokenUsage } from '../services/metricsApi';

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
