// Sprint 7 — SSO hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { SSOConfig, SSOConfigInput, SSOTestResult } from '../types/sso';

export function useSSOConfig() {
  return useQuery({
    queryKey: ['sso-config'],
    queryFn: async () => {
      const { data } = await apiClient.get<SSOConfig>('/api/v1/sso/config');
      return data;
    },
    retry: false,
  });
}

export function useUpdateSSOConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SSOConfigInput) => {
      const { data } = await apiClient.put<SSOConfig>('/api/v1/sso/config', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-config'] });
    },
  });
}

export function useDeleteSSOConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/api/v1/sso/config');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-config'] });
    },
  });
}

export function useTestSSO() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<SSOTestResult>('/api/v1/sso/config/test');
      return data;
    },
  });
}
