import { create } from 'zustand';
import type { NotificationItem } from '../types/notification';

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  push: (n: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  push: (n) =>
    set((s) => {
      const item: NotificationItem = {
        ...n,
        id: crypto.randomUUID(),
        read: false,
        created_at: new Date().toISOString(),
      };
      const notifications = [item, ...s.notifications].slice(0, 50);
      return { notifications, unreadCount: notifications.filter((x) => !x.read).length };
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  dismiss: (id) =>
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((x) => !x.read).length };
    }),
}));
