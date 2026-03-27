import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../services/api';
import { useTraceStore } from '../stores/traceStore';
import type { Trace, TraceListResponse, TraceSearchParams, WaterfallData } from '../types/trace';

export function useTraces(params: TraceSearchParams) {
  const setTraces = useTraceStore((s) => s.setTraces);

  const query = useQuery({
    queryKey: ['traces', params],
    queryFn: async () => {
      const { data } = await apiClient.get<TraceListResponse>('/api/traces', { params });
      return data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (query.data) setTraces(query.data.traces, query.data.total);
  }, [query.data, setTraces]);

  return query;
}

export function useTrace(traceId: string | null) {
  return useQuery({
    queryKey: ['trace', traceId],
    queryFn: async () => {
      const { data } = await apiClient.get<Trace>(`/api/traces/${traceId}`);
      return data;
    },
    enabled: !!traceId,
    staleTime: 60_000,
  });
}

export function useTraceWaterfall(traceId: string | null) {
  return useQuery({
    queryKey: ['trace-waterfall', traceId],
    queryFn: async () => {
      const { data } = await apiClient.get<WaterfallData>(`/api/traces/${traceId}/waterfall`);
      return data;
    },
    enabled: !!traceId,
    staleTime: 60_000,
  });
}

export function useAgentTraces(agentId: string, limit = 20) {
  return useQuery({
    queryKey: ['agent-traces', agentId, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<TraceListResponse>('/api/traces', {
        params: { agent_id: agentId, page: 1, page_size: limit },
      });
      return data;
    },
    staleTime: 30_000,
    enabled: !!agentId,
  });
}
