import { useState } from 'react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkAllRead } from '../hooks/useNotifications';
import { useApiNotificationStore } from '../stores/notificationStore';
import { clsx } from 'clsx';
import type { NotificationType } from '../types/notification';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Notifications' },
];

type FilterTab = 'all' | NotificationType;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all',           label: 'All' },
  { value: 'achievement',   label: 'Achievements' },
  { value: 'alert',         label: 'Alerts' },
  { value: 'system',        label: 'System' },
  { value: 'collaboration', label: 'Collaboration' },
];

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [offset, setOffset] = useState(0);

  const { isLoading } = useNotifications({
    type: activeTab === 'all' ? undefined : activeTab,
    limit: PAGE_SIZE,
    offset,
  });

  const apiNotifications = useApiNotificationStore((s) => s.apiNotifications);
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  const filtered = activeTab === 'all'
    ? apiNotifications
    : apiNotifications.filter((n) => n.type === activeTab);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setOffset(0);
  };

  return (
    <div className="p-6 max-w-2xl space-y-5 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-oav-text">Notifications</h1>
        <button
          onClick={() => markAllRead()}
          disabled={markingAll}
          className="text-sm text-oav-accent hover:text-oav-accent/80 transition-colors disabled:opacity-50"
          aria-label="Mark all notifications as read"
        >
          {markingAll ? 'Marking...' : 'Mark all read'}
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 bg-oav-bg rounded-lg p-1 border border-oav-border overflow-x-auto"
        role="tablist"
        aria-label="Filter notifications by type"
      >
        {FILTER_TABS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => handleTabChange(value)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === value
                ? 'bg-oav-accent text-white'
                : 'text-oav-muted hover:text-oav-text',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. Check back later for updates."
          actionLabel="Go to Dashboard"
          onAction={() => window.history.back()}
        />
      ) : (
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden" role="list">
          {filtered.map((n) => (
            <div
              key={n.id}
              role="listitem"
              className="border-b border-oav-border last:border-0"
            >
              <NotificationItem notification={n} />
            </div>
          ))}

          {/* Load more */}
          {filtered.length >= PAGE_SIZE && (
            <div className="p-3 flex justify-center border-t border-oav-border">
              <button
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                className="text-sm text-oav-accent hover:text-oav-accent/80 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
