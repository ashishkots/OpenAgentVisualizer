import { useQuery } from '@tanstack/react-query';
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch('/api/alerts?limit=50', { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch alerts');
      return r.json();
    },
    refetchInterval: 10000,
  });
}
