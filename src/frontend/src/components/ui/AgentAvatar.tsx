import { clsx } from 'clsx';
import { getAvatarColor } from '../../lib/colorTokens';
import type { AgentStatus } from '../../types/agent';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface Props {
  name: string;
  level: number;
  status?: AgentStatus;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  idle:     'bg-oav-muted',
  active:   'bg-oav-success',
  waiting:  'bg-oav-warning',
  error:    'bg-oav-error',
  complete: 'bg-oav-accent',
};

function getLevelRingClass(level: number): string {
  if (level <= 0) return 'ring-1 ring-[#94a3b8]';
  if (level === 1) return 'ring-1 ring-[#94a3b8]';
  if (level === 2) return 'ring-1 ring-[#3b82f6]';
  if (level === 3) return 'ring-2 ring-[#22c55e]';
  if (level === 4) return 'ring-2 ring-[#a855f7]';
  if (level <= 7) return 'ring-[3px] ring-[#eab308]';
  if (level === 8) return 'ring-[3px] ring-[#eab308] shadow-[0_0_12px_#eab30860]';
  if (level === 9) return 'ring-[3px] ring-[#eab308] shadow-[0_0_16px_#eab30880]';
  return 'ring-[3px] ring-[#eab308] ring-offset-1 ring-offset-oav-bg shadow-[0_0_24px_#eab308a0]';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AgentAvatar({ name, level, status, size = 'md', className }: Props) {
  const bgColor = getAvatarColor(name);
  const initials = getInitials(name);
  const sizeClass = SIZE_CLASSES[size];
  const ringClass = getLevelRingClass(level);
  const dotColor = status ? (STATUS_DOT_COLORS[status] ?? 'bg-oav-muted') : null;

  return (
    <div className={clsx('relative inline-flex items-center justify-center shrink-0', className)}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-bold',
          sizeClass,
          ringClass,
        )}
        style={{
          backgroundColor: `${bgColor}33`,
          color: bgColor,
        }}
        aria-label={`Agent ${name}, Level ${level}`}
      >
        {initials}
      </div>
      {dotColor && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-oav-surface',
            dotColor,
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
