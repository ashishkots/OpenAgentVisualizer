import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Wallet, Transaction } from '../types/economy';

interface TransactionsResponse {
  items: Transaction[];
  total: number;
}

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const { data } = await apiClient.get<Wallet>('/api/wallet');
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useTransactions(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['wallet-transactions', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
      if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
      const qs = searchParams.toString();
      const { data } = await apiClient.get<TransactionsResponse | Transaction[]>(
        `/api/wallet/transactions${qs ? `?${qs}` : ''}`,
      );
      return Array.isArray(data) ? data : (data.items ?? []);
    },
    staleTime: 15_000,
  });
}
