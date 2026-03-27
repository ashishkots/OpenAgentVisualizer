import { create } from 'zustand';
import type { Trace, Span, TraceSearchParams } from '../types/trace';

interface TraceStore {
  traces: Trace[];
  total: number;
  selectedTrace: Trace | null;
  selectedSpan: Span | null;
  expandedTraceIds: Set<string>;
  searchParams: TraceSearchParams;

  setTraces: (traces: Trace[], total: number) => void;
  setSelectedTrace: (trace: Trace | null) => void;
  setSelectedSpan: (span: Span | null) => void;
  toggleTraceExpanded: (traceId: string) => void;
  setSearchParams: (params: Partial<TraceSearchParams>) => void;
  reset: () => void;
}

const DEFAULT_PARAMS: TraceSearchParams = {
  time_range: 'last_1h',
  page: 1,
  page_size: 20,
};

export const useTraceStore = create<TraceStore>((set, get) => ({
  traces: [],
  total: 0,
  selectedTrace: null,
  selectedSpan: null,
  expandedTraceIds: new Set(),
  searchParams: { ...DEFAULT_PARAMS },

  setTraces: (traces, total) => set({ traces, total }),

  setSelectedTrace: (trace) => set({ selectedTrace: trace }),

  setSelectedSpan: (span) => set({ selectedSpan: span }),

  toggleTraceExpanded: (traceId) => {
    const current = new Set(get().expandedTraceIds);
    if (current.has(traceId)) {
      current.delete(traceId);
    } else {
      current.add(traceId);
    }
    set({ expandedTraceIds: current });
  },

  setSearchParams: (params) =>
    set((s) => ({ searchParams: { ...s.searchParams, ...params } })),

  reset: () =>
    set({
      traces: [],
      total: 0,
      selectedTrace: null,
      selectedSpan: null,
      expandedTraceIds: new Set(),
      searchParams: { ...DEFAULT_PARAMS },
    }),
}));
