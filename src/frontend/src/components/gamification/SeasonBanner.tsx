import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { useCurrentSeason } from '../../hooks/useTournaments';

export function SeasonBanner() {
  const { data: season, isLoading } = useCurrentSeason();

  if (isLoading || !season) return null;

  const totalDays = Math.max(
    1,
    Math.round(
      (new Date(season.end_at).getTime() - new Date(season.start_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const daysRemaining = Math.max(0, season.days_remaining);
  const progress = Math.min(1, Math.max(0, (totalDays - daysRemaining) / totalDays));
  const progressPct = Math.round(progress * 100);

  return (
    <div
      className={clsx(
        'rounded-xl border border-oav-gold/30 bg-gradient-to-r from-[#eab308]/10 via-[#eab308]/5 to-transparent',
        'px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3',
      )}
      role="region"
      aria-label={`Current season: ${season.name}`}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-oav-gold/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-oav-gold" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-oav-gold font-medium uppercase tracking-wide">
            Season {season.number}
          </p>
          <p className="text-sm font-semibold text-oav-text">{season.name}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex justify-between text-xs text-oav-muted">
          <span aria-live="polite">
            {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining` : 'Ending today'}
          </span>
          <span>{progressPct}% complete</span>
        </div>
        <div
          className="h-2 rounded-full bg-oav-border overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Season progress: ${progressPct}%`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-oav-gold/80 to-oav-gold transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
