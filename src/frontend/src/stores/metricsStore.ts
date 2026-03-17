import { create } from 'zustand';
import type { CostSummary } from '../types/metrics';

interface MetricsStore {
  costSummary: CostSummary | null;
  liveCostDelta: number;
  liveTokenDelta: number;
  setCostSummary: (summary: CostSummary) => void;
  updateLiveMetrics: (delta: { cost_delta: number; tokens_delta: number }) => void;
  reset: () => void;
}

export const useMetricsStore = create<MetricsStore>((set) => ({
  costSummary: null,
  liveCostDelta: 0,
  liveTokenDelta: 0,
  setCostSummary: (summary) => set({ costSummary: summary }),
  updateLiveMetrics: (delta) =>
    set((s) => ({
      liveCostDelta: s.liveCostDelta + delta.cost_delta,
      liveTokenDelta: s.liveTokenDelta + delta.tokens_delta,
    })),
  reset: () => set({ costSummary: null, liveCostDelta: 0, liveTokenDelta: 0 }),
}));
