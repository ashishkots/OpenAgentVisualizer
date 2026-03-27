import { useNavigate } from 'react-router-dom';
import { Trophy, AlertTriangle, Info, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useMarkRead } from '../../hooks/useNotifications';
import type { Notification, NotificationType } from '../../types/notification';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; color: string }> = {
  achievement: { icon: Trophy, color: 'text-oav-gold' },
  alert:       { icon: AlertTriangle, color: 'text-oav-error' },
  system:      { icon: Info, color: 'text-oav-accent' },
  collaboration: { icon: Users, color: 'text-oav-mesh' },
};

interface Props {
  notification: Notification;
  onClose?: () => void;
}

export function NotificationItem({ notification, onClose }: Props) {
  const navigate = useNavigate();
  const { mutate: markRead } = useMarkRead();
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read) {
      markRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oav-accent focus-visible:outline-none',
        notification.read
          ? 'hover:bg-oav-surface-hover'
          : 'bg-oav-accent/5 border-l-2 border-l-oav-accent hover:bg-oav-accent/10',
      )}
      aria-label={`${notification.type} notification: ${notification.title}${notification.read ? '' : ', unread'}`}
    >
      <div
        className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', {
          'bg-oav-gold/15':    notification.type === 'achievement',
          'bg-oav-error/15':   notification.type === 'alert',
          'bg-oav-accent/15':  notification.type === 'system',
          'bg-oav-mesh/15':    notification.type === 'collaboration',
        })}
        aria-hidden="true"
      >
        <Icon className={clsx('w-4 h-4', config.color)} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', notification.read ? 'text-oav-muted' : 'text-oav-text')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-oav-muted truncate mt-0.5">{notification.body}</p>
        )}
        <p className="text-[10px] text-oav-muted mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-oav-accent shrink-0 mt-2" aria-hidden="true" />
      )}
    </div>
  );
}
