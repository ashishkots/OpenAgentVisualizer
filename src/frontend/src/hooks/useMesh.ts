import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../services/api';
import { useMeshStore } from '../stores/meshStore';
import type { MeshTopology, MeshNode } from '../types/mesh';

export function useMeshTopology(period: '1h' | '24h' | '7d' = '1h') {
  const setTopology = useMeshStore((s) => s.setTopology);

  const query = useQuery({
    queryKey: ['mesh-topology', period],
    queryFn: async () => {
      const { data } = await apiClient.get<MeshTopology>('/api/mesh/topology', {
        params: { period },
      });
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (query.data) setTopology(query.data);
  }, [query.data, setTopology]);

  return query;
}

export function useMeshNode(nodeId: string | null) {
  return useQuery({
    queryKey: ['mesh-node', nodeId],
    queryFn: async () => {
      const { data } = await apiClient.get<MeshNode>(`/api/mesh/nodes/${nodeId}`);
      return data;
    },
    enabled: !!nodeId,
    staleTime: 15_000,
  });
}
