import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useApiNotificationStore } from '../stores/notificationStore';
import type { Notification } from '../types/notification';

interface UnreadCountResponse {
  count: number;
}

interface NotificationsResponse {
  items: Notification[];
  total: number;
}

export function useNotifications(params?: { type?: string; limit?: number; offset?: number }) {
  const setApiNotifications = useApiNotificationStore((s) => s.setApiNotifications);

  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
      if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));

      const { data } = await apiClient.get<NotificationsResponse | Notification[]>(
        `/api/notifications${searchParams.toString() ? `?${searchParams}` : ''}`,
      );

      // Handle both paginated and plain array responses
      const notifications = Array.isArray(data) ? data : data.items ?? [];
      setApiNotifications(notifications);
      return notifications;
    },
  });
}

export function useUnreadCount() {
  const setApiUnreadCount = useApiNotificationStore((s) => s.setApiUnreadCount);

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get<UnreadCountResponse>('/api/notifications/unread-count');
      setApiUnreadCount(data.count);
      return data.count;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  const markRead = useApiNotificationStore((s) => s.markRead);

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/notifications/${id}/read`);
      return id;
    },
    onSuccess: (id) => {
      markRead(id);
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const markAllApiRead = useApiNotificationStore((s) => s.markAllApiRead);

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/notifications/read-all');
    },
    onSuccess: () => {
      markAllApiRead();
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
