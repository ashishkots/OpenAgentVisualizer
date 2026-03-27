import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../services/api';
import { useIntegrationStore } from '../stores/integrationStore';
import type { IntegrationConfig, IntegrationType, IntegrationConfigInput, ConnectionTestResult } from '../types/integration';

export function useIntegrations() {
  const setAllConfigs = useIntegrationStore((s) => s.setAllConfigs);

  const query = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data } = await apiClient.get<IntegrationConfig[]>('/api/integrations');
      return data;
    },
    staleTime: 60_000, // matches backend Redis TTL
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (query.data) setAllConfigs(query.data);
  }, [query.data, setAllConfigs]);

  return query;
}

export function useIntegrationTest() {
  const setTestResult = useIntegrationStore((s) => s.setTestResult);
  const setTestingProduct = useIntegrationStore((s) => s.setTestingProduct);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      product,
      config,
    }: {
      product: IntegrationType;
      config: IntegrationConfigInput;
    }) => {
      setTestingProduct(product);
      const { data } = await apiClient.post<ConnectionTestResult>(
        `/api/integrations/${product}/test`,
        config,
      );
      return { product, result: data };
    },
    onSuccess: ({ product, result }) => {
      setTestResult(product, result);
      setTestingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (_, { product }) => {
      setTestingProduct(null);
      setTestResult(product, {
        success: false,
        latency_ms: null,
        error: 'Request failed',
        tested_at: new Date().toISOString(),
      });
    },
  });
}

export function useSaveIntegration() {
  const queryClient = useQueryClient();
  const setConfig = useIntegrationStore((s) => s.setConfig);

  return useMutation({
    mutationFn: async ({
      product,
      config,
    }: {
      product: IntegrationType;
      config: IntegrationConfigInput;
    }) => {
      const { data } = await apiClient.put<IntegrationConfig>(
        `/api/integrations/${product}`,
        config,
      );
      return { product, data };
    },
    onSuccess: ({ product, data }) => {
      setConfig(product, data);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}
