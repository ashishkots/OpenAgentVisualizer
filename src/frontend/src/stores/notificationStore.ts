import { create } from 'zustand';
import type { Notification, NotificationItem } from '../types/notification';

// -----------------------------------------------------------------------
// Legacy gamification notification store (Sprint 2 API — kept for compat)
// -----------------------------------------------------------------------
interface LegacyNotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  push: (n: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<LegacyNotificationStore>((set) => ({
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

// -----------------------------------------------------------------------
// Sprint 5: API-backed notification store
// -----------------------------------------------------------------------
interface ApiNotificationStore {
  apiNotifications: Notification[];
  apiUnreadCount: number;
  isDropdownOpen: boolean;
  setApiUnreadCount: (count: number) => void;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllApiRead: () => void;
  toggleDropdown: () => void;
  setDropdownOpen: (open: boolean) => void;
  setApiNotifications: (notifications: Notification[]) => void;
}

export const useApiNotificationStore = create<ApiNotificationStore>((set) => ({
  apiNotifications: [],
  apiUnreadCount: 0,
  isDropdownOpen: false,

  setApiUnreadCount: (count) => set({ apiUnreadCount: count }),

  addNotification: (n) =>
    set((s) => ({
      apiNotifications: [n, ...s.apiNotifications].slice(0, 50),
      apiUnreadCount: s.apiUnreadCount + (n.read ? 0 : 1),
    })),

  markRead: (id) =>
    set((s) => {
      const apiNotifications = s.apiNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return {
        apiNotifications,
        apiUnreadCount: Math.max(0, apiNotifications.filter((n) => !n.read).length),
      };
    }),

  markAllApiRead: () =>
    set((s) => ({
      apiNotifications: s.apiNotifications.map((n) => ({ ...n, read: true })),
      apiUnreadCount: 0,
    })),

  toggleDropdown: () => set((s) => ({ isDropdownOpen: !s.isDropdownOpen })),

  setDropdownOpen: (open) => set({ isDropdownOpen: open }),

  setApiNotifications: (notifications) =>
    set({
      apiNotifications: notifications,
      apiUnreadCount: notifications.filter((n) => !n.read).length,
    }),
}));
