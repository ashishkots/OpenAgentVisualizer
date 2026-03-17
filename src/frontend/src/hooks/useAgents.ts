import { useQuery } from '@tanstack/react-query';
import { getAgents } from '../services/agentApi';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    staleTime: 30_000,
  });
}
