import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  tier: 'free' | 'pro' | 'team' | 'business' | 'enterprise';
  api_key: string;
}

export function useWorkspace() {
  return useQuery<Workspace>({
    queryKey: ['workspace'],
    queryFn: async () => {
      const { data } = await apiClient.get<Workspace>('/api/workspaces/me');
      return data;
    },
    staleTime: 60_000,
  });
}
