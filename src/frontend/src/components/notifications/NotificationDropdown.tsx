import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApiNotificationStore } from '../../stores/notificationStore';
import { useNotifications, useMarkAllRead } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function NotificationDropdown() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const setDropdownOpen = useApiNotificationStore((s) => s.setDropdownOpen);
  const apiNotifications = useApiNotificationStore((s) => s.apiNotifications);
  const { isLoading } = useNotifications({ limit: 20 });
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setDropdownOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setDropdownOpen]);

  const displayed = apiNotifications.slice(0, 20);

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications"
      aria-modal="false"
      className="absolute right-0 top-full mt-2 w-[360px] bg-oav-surface border border-oav-border rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-oav-border">
        <h2 className="text-sm font-semibold text-oav-text">Notifications</h2>
        <button
          onClick={() => markAllRead()}
          disabled={markingAll}
          className="text-xs text-oav-accent hover:text-oav-accent/80 transition-colors disabled:opacity-50"
          aria-label="Mark all notifications as read"
        >
          {markingAll ? 'Marking...' : 'Mark all read'}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto" role="list">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size="sm" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <p className="text-sm text-oav-muted">You're all caught up!</p>
            <p className="text-xs text-oav-muted mt-1">No new notifications.</p>
          </div>
        ) : (
          displayed.map((n) => (
            <div key={n.id} role="listitem">
              <NotificationItem
                notification={n}
                onClose={() => setDropdownOpen(false)}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-oav-border px-4 py-2.5 flex justify-center">
        <Link
          to="/notifications"
          onClick={() => setDropdownOpen(false)}
          className="text-xs text-oav-accent hover:text-oav-accent/80 transition-colors"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
