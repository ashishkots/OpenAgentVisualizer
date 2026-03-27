import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../services/api';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import type { KnowledgeGraph, KnowledgeEntity, KnowledgeSearchResult } from '../types/knowledge';

export function useKnowledgeGraph(limit = 50) {
  const setGraph = useKnowledgeStore((s) => s.setGraph);

  const query = useQuery({
    queryKey: ['knowledge-graph', limit],
    queryFn: async () => {
      const { data } = await apiClient.get<KnowledgeGraph>('/api/knowledge/graph', {
        params: { limit },
      });
      return data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) setGraph(query.data);
  }, [query.data, setGraph]);

  return query;
}

export function useKnowledgeEntity(entityId: string | null) {
  return useQuery({
    queryKey: ['knowledge-entity', entityId],
    queryFn: async () => {
      const { data } = await apiClient.get<KnowledgeEntity>(`/api/knowledge/entities/${entityId}`);
      return data;
    },
    enabled: !!entityId,
    staleTime: 60_000,
  });
}

export function useKnowledgeSearch(query: string, enabled = true) {
  const setSearchResults = useKnowledgeStore((s) => s.setSearchResults);

  const result = useQuery({
    queryKey: ['knowledge-search', query],
    queryFn: async () => {
      const { data } = await apiClient.get<KnowledgeSearchResult>('/api/knowledge/search', {
        params: { q: query },
      });
      return data;
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (result.data) setSearchResults(result.data.entities);
  }, [result.data, setSearchResults]);

  return result;
}
