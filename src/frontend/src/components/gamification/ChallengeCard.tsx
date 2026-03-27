import { Clock, Coins, Star } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { clsx } from 'clsx';
import type { Challenge, ChallengeGoalType } from '../../types/team';

interface Props {
  challenge: Challenge;
  onViewDetails?: (challenge: Challenge) => void;
}

const GOAL_TYPE_LABELS: Record<ChallengeGoalType, string> = {
  events: 'Events',
  tasks:  'Tasks',
  xp:     'XP',
};

const GOAL_TYPE_BADGES: Record<ChallengeGoalType, string> = {
  events: 'bg-blue-500/20 text-blue-400',
  tasks:  'bg-green-500/20 text-green-400',
  xp:     'bg-amber-500/20 text-amber-400',
};

function ProgressBar({ current, goal }: { current: number; goal: number }) {
  const pct = Math.min(100, goal > 0 ? Math.round((current / goal) * 100) : 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-oav-muted">
          {current.toLocaleString()} / {goal.toLocaleString()}
        </span>
        <span className="font-medium text-oav-text">{pct}%</span>
      </div>
      <div
        className="h-2 rounded-full bg-oav-border overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Challenge progress: ${pct}%`}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-[width] duration-500',
            pct >= 100
              ? 'bg-oav-success'
              : pct >= 75
                ? 'bg-oav-accent'
                : 'bg-oav-accent/70',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ChallengeCard({ challenge, onViewDetails }: Props) {
  const goalBadge = GOAL_TYPE_BADGES[challenge.goal_type];
  const goalLabel = GOAL_TYPE_LABELS[challenge.goal_type];
  const isEnded = isPast(new Date(challenge.end_at));

  const statusColor =
    challenge.status === 'completed'
      ? 'text-oav-success'
      : challenge.status === 'failed'
        ? 'text-oav-error'
        : 'text-oav-accent';

  return (
    <article
      className={clsx(
        'bg-oav-surface border border-oav-border rounded-xl p-5 flex flex-col gap-4',
        'hover:border-oav-accent/40 transition-colors',
        onViewDetails && 'cursor-pointer',
      )}
      onClick={() => onViewDetails?.(challenge)}
      role={onViewDetails ? 'button' : undefined}
      tabIndex={onViewDetails ? 0 : undefined}
      onKeyDown={(e) => {
        if (onViewDetails && (e.key === 'Enter' || e.key === ' ')) onViewDetails(challenge);
      }}
      aria-label={`Challenge: ${challenge.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-oav-text mb-0.5">{challenge.name}</p>
          {challenge.description && (
            <p className="text-xs text-oav-muted line-clamp-2">{challenge.description}</p>
          )}
        </div>
        <span
          className={clsx(
            'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium',
            goalBadge,
          )}
        >
          {goalLabel}
        </span>
      </div>

      {/* Progress */}
      <ProgressBar current={challenge.current_value} goal={challenge.goal_value} />

      {/* Rewards + countdown */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Token reward */}
        <div className="flex items-center gap-1 text-oav-muted">
          <Coins className="w-3.5 h-3.5 text-oav-gold" aria-hidden="true" />
          <span className="font-medium text-oav-text">{challenge.reward_tokens.toLocaleString()}</span>
          <span>tokens</span>
        </div>

        {/* XP reward */}
        <div className="flex items-center gap-1 text-oav-muted">
          <Star className="w-3.5 h-3.5 text-oav-accent" aria-hidden="true" />
          <span className="font-medium text-oav-text">{challenge.reward_xp.toLocaleString()}</span>
          <span>XP</span>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1 text-oav-muted ml-auto">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {challenge.status !== 'active' ? (
            <span className={statusColor}>
              {challenge.status === 'completed' ? 'Completed' : 'Failed'}
            </span>
          ) : isEnded ? (
            <span className="text-oav-muted">Ended</span>
          ) : (
            <span>{formatDistanceToNow(new Date(challenge.end_at), { addSuffix: true })}</span>
          )}
        </div>
      </div>
    </article>
  );
}
