import { clsx } from 'clsx';
import type { Agent } from '../../types/agent';
import { AgentAvatar } from '../ui/AgentAvatar';
import { StatusBadge } from '../ui/StatusBadge';
import { XPBar } from '../ui/XPBar';
import { xpProgress } from '../../lib/xpLevels';
import { formatCost } from '../../lib/formatters';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  agent: Agent;
  onClick?: () => void;
  isSelected?: boolean;
}

export function AgentCard({ agent, onClick, isSelected }: Props) {
  const { level, name: levelName } = xpProgress(agent.xp_total);
  const isError = agent.status === 'error';
  const lastActive = agent.last_active_at
    ? formatDistanceToNow(new Date(agent.last_active_at), { addSuffix: true })
    : formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true });

  return (
    <div
      className={clsx(
        'bg-oav-surface border rounded-xl p-4 cursor-pointer transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2 focus-visible:ring-offset-oav-bg',
        {
          'border-oav-border hover:bg-oav-surface-hover hover:border-oav-accent': !isSelected && !isError,
          'bg-oav-surface-active border-oav-accent ring-1 ring-oav-accent/30': isSelected,
          'border-oav-error/40 border-l-[3px] border-l-oav-error': isError && !isSelected,
        },
      )}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      tabIndex={0}
      role="button"
      aria-label={`Agent ${agent.name}, Level ${level} ${levelName}, Status ${agent.status}`}
      aria-pressed={isSelected}
    >
      {/* Row 1: Status dot + name + framework */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={clsx('w-2.5 h-2.5 rounded-full shrink-0', {
            'bg-oav-muted':    agent.status === 'idle',
            'bg-oav-success animate-pulse': agent.status === 'active',
            'bg-oav-warning':  agent.status === 'waiting',
            'bg-oav-error animate-pulse':   agent.status === 'error',
            'bg-oav-accent':   agent.status === 'complete',
          })}
          aria-hidden="true"
        />
        <p className="text-oav-text font-medium text-sm truncate flex-1">{agent.name}</p>
        <span className="text-oav-muted text-xs shrink-0">{agent.framework}</span>
      </div>

      {/* Row 2: Avatar + level + status badge */}
      <div className="flex items-center gap-3 mb-3">
        <AgentAvatar name={agent.name} level={level} size="md" />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-oav-muted">Lv {level}</span>
          <StatusBadge status={agent.status} />
        </div>
      </div>

      {/* Row 3: XP bar */}
      <XPBar xpTotal={agent.xp_total} size="sm" className="mb-2" />

      {/* Row 4: Last active + cost */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-oav-muted">{lastActive}</span>
        <span className="text-xs text-oav-muted">{formatCost(agent.total_cost_usd)}</span>
      </div>
    </div>
  );
}
