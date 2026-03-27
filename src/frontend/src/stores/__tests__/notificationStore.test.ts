import { describe, it, expect, beforeEach } from 'vitest';
import { useApiNotificationStore } from '../notificationStore';
import type { Notification } from '../../types/notification';

const makeNotification = (id: string, read = false): Notification => ({
  id,
  type: 'system',
  title: `Notification ${id}`,
  body: 'test body',
  read,
  link: null,
  created_at: new Date().toISOString(),
});

describe('useApiNotificationStore', () => {
  beforeEach(() => {
    useApiNotificationStore.setState({
      apiNotifications: [],
      apiUnreadCount: 0,
      isDropdownOpen: false,
    });
  });

  it('addNotification prepends and increments unread count for unread item', () => {
    useApiNotificationStore.getState().addNotification(makeNotification('n1', false));
    const s = useApiNotificationStore.getState();
    expect(s.apiNotifications).toHaveLength(1);
    expect(s.apiUnreadCount).toBe(1);
  });

  it('addNotification does not increment count for read item', () => {
    useApiNotificationStore.getState().addNotification(makeNotification('n1', true));
    expect(useApiNotificationStore.getState().apiUnreadCount).toBe(0);
  });

  it('markRead sets item to read and decrements count', () => {
    useApiNotificationStore.getState().addNotification(makeNotification('n1', false));
    useApiNotificationStore.getState().addNotification(makeNotification('n2', false));
    useApiNotificationStore.getState().markRead('n1');
    const s = useApiNotificationStore.getState();
    const n1 = s.apiNotifications.find((n) => n.id === 'n1');
    expect(n1?.read).toBe(true);
    expect(s.apiUnreadCount).toBe(1);
  });

  it('markAllApiRead marks everything and sets count to zero', () => {
    useApiNotificationStore.getState().addNotification(makeNotification('n1', false));
    useApiNotificationStore.getState().addNotification(makeNotification('n2', false));
    useApiNotificationStore.getState().markAllApiRead();
    const s = useApiNotificationStore.getState();
    expect(s.apiUnreadCount).toBe(0);
    expect(s.apiNotifications.every((n) => n.read)).toBe(true);
  });

  it('toggleDropdown flips isDropdownOpen', () => {
    expect(useApiNotificationStore.getState().isDropdownOpen).toBe(false);
    useApiNotificationStore.getState().toggleDropdown();
    expect(useApiNotificationStore.getState().isDropdownOpen).toBe(true);
    useApiNotificationStore.getState().toggleDropdown();
    expect(useApiNotificationStore.getState().isDropdownOpen).toBe(false);
  });

  it('setApiUnreadCount updates count', () => {
    useApiNotificationStore.getState().setApiUnreadCount(42);
    expect(useApiNotificationStore.getState().apiUnreadCount).toBe(42);
  });
});
