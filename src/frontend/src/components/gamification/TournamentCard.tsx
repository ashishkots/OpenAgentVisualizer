import { Coins, Users, Clock, Trophy } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { clsx } from 'clsx';
import type { Tournament, TournamentType } from '../../types/tournament';

interface Props {
  tournament: Tournament;
  walletBalance?: number;
  onEnter: (tournament: Tournament) => void;
}

const TYPE_BADGES: Record<TournamentType, { label: string; className: string }> = {
  speed:           { label: 'Speed',           className: 'bg-blue-500/20 text-blue-400'  },
  accuracy:        { label: 'Accuracy',        className: 'bg-green-500/20 text-green-400' },
  cost_efficiency: { label: 'Cost Efficiency', className: 'bg-amber-500/20 text-amber-400' },
};

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const past = isPast(new Date(targetDate));
  if (past) return <span className="text-oav-muted text-xs">Ended</span>;
  return (
    <span className="text-oav-text text-xs tabular-nums">
      {formatDistanceToNow(new Date(targetDate), { addSuffix: true })}
    </span>
  );
}

export function TournamentCard({ tournament, walletBalance, onEnter }: Props) {
  const badge = TYPE_BADGES[tournament.type];
  const isUpcoming = tournament.status === 'upcoming';
  const isActive = tournament.status === 'active';
  const isCompleted = tournament.status === 'completed';

  const canEnter = (isUpcoming || isActive) && !tournament.is_entered;
  const insufficientBalance =
    walletBalance !== undefined && walletBalance < tournament.entry_fee;
  const enterDisabled = !canEnter || insufficientBalance || isCompleted;

  const countdownDate = isUpcoming ? tournament.start_at : tournament.end_at;
  const countdownLabel = isUpcoming ? 'Starts' : isActive ? 'Ends' : 'Ended';

  return (
    <article
      className="bg-oav-surface border border-oav-border rounded-xl p-5 flex flex-col gap-4 hover:border-oav-accent/40 transition-colors"
      aria-label={`Tournament: ${tournament.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-oav-gold shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-oav-text truncate">{tournament.name}</h3>
          </div>
          {tournament.description && (
            <p className="text-xs text-oav-muted line-clamp-2">{tournament.description}</p>
          )}
        </div>
        <span
          className={clsx(
            'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium',
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {/* Prize pool */}
        <div>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Coins className="w-3.5 h-3.5 text-oav-gold" aria-hidden="true" />
            <span className="text-sm font-bold text-oav-text tabular-nums">
              {tournament.prize_pool.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-oav-muted">Prize Pool</p>
        </div>

        {/* Entry count */}
        <div>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="w-3.5 h-3.5 text-oav-muted" aria-hidden="true" />
            <span className="text-sm font-bold text-oav-text tabular-nums">
              {tournament.entry_count ?? 0}
            </span>
          </div>
          <p className="text-xs text-oav-muted">Entries</p>
        </div>

        {/* Countdown */}
        <div>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-oav-muted" aria-hidden="true" />
            <CountdownTimer targetDate={countdownDate} />
          </div>
          <p className="text-xs text-oav-muted">{countdownLabel}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-oav-border">
        {tournament.is_entered ? (
          <span className="text-xs font-medium text-oav-success">Entered</span>
        ) : isCompleted ? (
          <span className="text-xs text-oav-muted">Completed</span>
        ) : (
          <div className="flex items-center gap-1 text-xs text-oav-muted">
            <Coins className="w-3 h-3" aria-hidden="true" />
            <span>Entry: {tournament.entry_fee} tokens</span>
          </div>
        )}

        {!isCompleted && (
          <button
            onClick={() => onEnter(tournament)}
            disabled={enterDisabled}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[32px]',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              tournament.is_entered
                ? 'bg-oav-surface-hover text-oav-muted cursor-not-allowed'
                : insufficientBalance
                  ? 'bg-oav-error/20 text-oav-error cursor-not-allowed'
                  : 'bg-oav-accent text-white hover:bg-oav-accent/80 active:scale-95',
            )}
            aria-label={
              tournament.is_entered
                ? 'Already entered'
                : insufficientBalance
                  ? 'Insufficient balance'
                  : `Enter tournament for ${tournament.entry_fee} tokens`
            }
          >
            {tournament.is_entered
              ? 'Entered'
              : insufficientBalance
                ? 'Insufficient'
                : 'Enter'}
          </button>
        )}
      </div>
    </article>
  );
}
