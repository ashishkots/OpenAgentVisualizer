// Sprint 7 — Plugin hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Plugin, PluginRegistry, PluginInstallRequest } from '../types/plugin';

interface PluginRegistryResponse {
  items: PluginRegistry[];
  total: number;
  page: number;
  page_size: number;
}

export function usePluginRegistry(params?: { search?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['plugin-registry', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page !== undefined) searchParams.set('page', String(params.page));
      if (params?.page_size !== undefined) searchParams.set('page_size', String(params.page_size));
      const { data } = await apiClient.get<PluginRegistryResponse>(
        `/api/v1/plugins/registry${searchParams.toString() ? `?${searchParams}` : ''}`,
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useInstalledPlugins() {
  return useQuery({
    queryKey: ['plugins-installed'],
    queryFn: async () => {
      const { data } = await apiClient.get<Plugin[]>('/api/v1/plugins');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useInstallPlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PluginInstallRequest) => {
      const { data } = await apiClient.post<Plugin>('/api/v1/plugins/install', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plugins-installed'] });
    },
  });
}

export function useEnablePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pluginId: string) => {
      const { data } = await apiClient.post<Plugin>(`/api/v1/plugins/${pluginId}/enable`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plugins-installed'] });
    },
  });
}

export function useDisablePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pluginId: string) => {
      const { data } = await apiClient.post<Plugin>(`/api/v1/plugins/${pluginId}/disable`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plugins-installed'] });
    },
  });
}

export function useUninstallPlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pluginId: string) => {
      await apiClient.delete(`/api/v1/plugins/${pluginId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plugins-installed'] });
    },
  });
}
