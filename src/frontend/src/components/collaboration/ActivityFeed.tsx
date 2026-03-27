import { X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { useActivity } from '../../hooks/useCollaboration';
import { ActivityItem } from './ActivityItem';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  onClose?: () => void;
}

export function ActivityFeed({ onClose }: Props) {
  const activity = useCollaborationStore((s) => s.activity);
  const { isLoading } = useActivity();

  const displayed = activity.slice(0, 20);

  return (
    <aside
      className="w-[280px] shrink-0 flex flex-col bg-oav-surface border-l border-oav-border overflow-hidden animate-slide-in-right"
      aria-label="Activity feed"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-oav-border shrink-0">
        <h2 className="text-sm font-semibold text-oav-text">Activity</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-oav-muted hover:text-oav-text transition-colors"
            aria-label="Close activity feed"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" role="list">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size="sm" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-xs text-oav-muted text-center px-4">
              No activity yet. Actions taken by workspace members will appear here.
            </p>
          </div>
        ) : (
          displayed.map((entry) => (
            <div key={entry.id} role="listitem" className="border-b border-oav-border/50 last:border-0">
              <ActivityItem entry={entry} />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {activity.length > 20 && (
        <div className="border-t border-oav-border px-4 py-2.5 shrink-0">
          <Link
            to="/settings?tab=members"
            className="text-xs text-oav-accent hover:text-oav-accent/80 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
      )}
    </aside>
  );
}
