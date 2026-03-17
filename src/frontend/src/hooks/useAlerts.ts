import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.get('/api/alerts?limit=50').then(r => r.data),
    refetchInterval: 10000,
  });
}
