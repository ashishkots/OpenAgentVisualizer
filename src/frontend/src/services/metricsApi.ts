import { apiClient } from './api';
import type { CostSummary, TokenUsage } from '../types/metrics';

export const getCosts = async (): Promise<CostSummary> => {
  const { data } = await apiClient.get<CostSummary>('/api/metrics/costs');
  return data;
};

export const getTokenUsage = async (): Promise<TokenUsage[]> => {
  const { data } = await apiClient.get<TokenUsage[]>('/api/metrics/tokens');
  return data;
};
