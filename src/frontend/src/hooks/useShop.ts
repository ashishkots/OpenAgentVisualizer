import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { ShopItem, InventoryItem } from '../types/economy';

interface ShopResponse {
  items: ShopItem[];
  total: number;
}

interface InventoryResponse {
  items: InventoryItem[];
  total: number;
}

export function useShopItems() {
  return useQuery({
    queryKey: ['shop-items'],
    queryFn: async () => {
      const { data } = await apiClient.get<ShopResponse | ShopItem[]>('/api/shop');
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 60_000,
  });
}

export function useBuyItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await apiClient.post(`/api/shop/${itemId}/buy`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shop-items'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await apiClient.get<InventoryResponse | InventoryItem[]>('/api/inventory');
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 15_000,
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inventoryId,
      agentId,
    }: {
      inventoryId: string;
      agentId: string;
    }) => {
      const { data } = await apiClient.post(`/api/inventory/${inventoryId}/equip`, {
        agent_id: agentId,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUnequipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventoryId: string) => {
      const { data } = await apiClient.post(`/api/inventory/${inventoryId}/unequip`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
