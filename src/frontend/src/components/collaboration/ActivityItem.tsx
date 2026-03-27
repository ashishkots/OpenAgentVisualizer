import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityEntry } from '../../types/collaboration';

function getAvatarColor(id: string): string {
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899'];
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % COLORS.length;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getAvatarInitials(userId: string | null): string {
  if (!userId) return 'SYS';
  return userId.slice(0, 2).toUpperCase();
}

function formatAction(entry: ActivityEntry): string {
  const action = entry.action.replace(/_/g, ' ');
  if (entry.target_type && entry.target_id) {
    return `${action} ${entry.target_type} ${entry.target_id.slice(0, 8)}`;
  }
  return action;
}

interface Props {
  entry: ActivityEntry;
}

export function ActivityItem({ entry }: Props) {
  const navigate = useNavigate();
  const color = getAvatarColor(entry.user_id ?? 'system');
  const initials = getAvatarInitials(entry.user_id);

  const handleClick = () => {
    if (!entry.target_type || !entry.target_id) return;
    if (entry.target_type === 'agent') navigate(`/agents/${entry.target_id}`);
  };

  const isClickable = Boolean(entry.target_type && entry.target_id);

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') handleClick(); } : undefined}
      className={`flex items-start gap-3 px-4 py-3 ${isClickable ? 'cursor-pointer hover:bg-oav-surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oav-accent focus-visible:outline-none' : ''}`}
      aria-label={isClickable ? `Go to ${entry.target_type}: ${formatAction(entry)}` : undefined}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white mt-0.5"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-oav-text font-medium leading-snug">{formatAction(entry)}</p>
        <p className="text-[10px] text-oav-muted mt-0.5">
          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
