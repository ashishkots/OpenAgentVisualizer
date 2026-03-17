import { useQuery } from '@tanstack/react-query';
export function useSessionReplay() {
  const query = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch('/api/replay/sessions?limit=20', { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch sessions');
      return r.json();
    },
    staleTime: 10_000,
  });
  return { sessions: (query.data ?? []) as any[], isLoading: query.isLoading };
}
