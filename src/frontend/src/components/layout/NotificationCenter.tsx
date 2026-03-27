import { useState } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';

const SEV_COLOR: Record<string, string> = {
  info: 'text-oav-accent',
  warning: 'text-oav-warning',
  critical: 'text-oav-error',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotificationStore();
  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        className="relative p-2 text-oav-muted hover:text-oav-text transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-oav-error text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-xl border shadow-xl z-50 overflow-hidden"
          style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}
        >
          <div
            className="px-4 py-3 border-b text-xs font-semibold text-oav-muted uppercase tracking-wider"
            style={{ borderColor: 'var(--oav-border)' }}
          >
            Notifications
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-oav-muted text-sm text-center">No notifications</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div key={n.id} className="px-4 py-3 border-b text-sm" style={{ borderColor: 'var(--oav-border)' }}>
                <p className={`font-medium ${SEV_COLOR[n.severity] ?? 'text-oav-text'}`}>{n.title}</p>
                <p className="text-oav-muted text-xs mt-0.5">{n.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
