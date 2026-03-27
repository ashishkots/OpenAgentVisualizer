// Sprint 7 — Webhook hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type {
  Webhook,
  WebhookCreate,
  WebhookUpdate,
  WebhookCreatedResponse,
  WebhookDelivery,
} from '../types/webhook';

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data } = await apiClient.get<Webhook[]>('/api/v1/webhooks');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WebhookCreate) => {
      const { data } = await apiClient.post<WebhookCreatedResponse>(
        '/api/v1/webhooks',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useUpdateWebhook(webhookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WebhookUpdate) => {
      const { data } = await apiClient.put<Webhook>(
        `/api/v1/webhooks/${webhookId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (webhookId: string) => {
      await apiClient.delete(`/api/v1/webhooks/${webhookId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useWebhookDeliveries(webhookId: string | null, limit = 50) {
  return useQuery({
    queryKey: ['webhook-deliveries', webhookId, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<WebhookDelivery[]>(
        `/api/v1/webhooks/${webhookId}/deliveries?limit=${limit}`,
      );
      return data;
    },
    enabled: !!webhookId,
    refetchInterval: 10_000,
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { data } = await apiClient.post<{ status: string; delivery_id: string }>(
        `/api/v1/webhooks/${webhookId}/test`,
      );
      return data;
    },
  });
}
