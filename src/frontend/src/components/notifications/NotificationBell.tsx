import { useRef } from 'react';
import { Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { useApiNotificationStore } from '../../stores/notificationStore';
import { useUnreadCount } from '../../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const isDropdownOpen = useApiNotificationStore((s) => s.isDropdownOpen);
  const toggleDropdown = useApiNotificationStore((s) => s.toggleDropdown);
  const apiUnreadCount = useApiNotificationStore((s) => s.apiUnreadCount);

  // Fetch unread count (polls every 30s)
  useUnreadCount();

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside clicks (handled in NotificationDropdown too,
  // but the bell button itself needs to toggle correctly)
  const badgeLabel = apiUnreadCount > 99 ? '99+' : String(apiUnreadCount);

  return (
    <div ref={containerRef} className="relative" data-testid="notification-bell">
      <button
        onClick={toggleDropdown}
        aria-label={
          apiUnreadCount > 0
            ? `Notifications — ${apiUnreadCount} unread`
            : 'Notifications — no new'
        }
        aria-expanded={isDropdownOpen}
        aria-haspopup="dialog"
        className={clsx(
          'relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
          'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
          isDropdownOpen
            ? 'bg-oav-surface-hover text-oav-accent'
            : 'text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
        )}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />

        {apiUnreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-oav-error text-white text-[10px] font-bold px-1 leading-none"
            aria-hidden="true"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {isDropdownOpen && <NotificationDropdown />}
    </div>
  );
}
