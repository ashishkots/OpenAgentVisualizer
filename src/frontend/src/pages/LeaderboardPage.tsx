import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Minus, Crown } from 'lucide-react';
import { apiClient } from '../services/api';
import { useGamificationStore } from '../stores/gamificationStore';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { XPBar } from '../components/ui/XPBar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { xpProgress } from '../lib/xpLevels';
import { clsx } from 'clsx';
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardCategory } from '../types/gamification';

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leaderboard' }];

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'daily',    label: 'Daily'     },
  { id: 'weekly',   label: 'Weekly'    },
  { id: 'monthly',  label: 'Monthly'   },
  { id: 'all_time', label: 'All Time'  },
];

const CATEGORIES: { id: LeaderboardCategory; label: string }[] = [
  { id: 'xp',              label: 'XP'           },
  { id: 'tasks',           label: 'Tasks'         },
  { id: 'cost_efficiency', label: 'Cost Eff.'     },
  { id: 'streaks',         label: 'Streaks'       },
];

function ChampionCard({ entry }: { entry: LeaderboardEntry }) {
  const { level, name: levelName } = xpProgress(entry.total_xp);
  return (
    <div className="relative rounded-xl p-6 border border-oav-gold/40 overflow-hidden bg-gradient-to-r from-[#eab308]/10 via-[#eab308]/5 to-transparent max-w-2xl mx-auto">
      <Crown className="w-6 h-6 text-oav-gold mx-auto mb-3" aria-hidden="true" />
      <span className="block mx-auto w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-oav-gold/20 text-oav-gold mb-4">
        Champion
      </span>
      <div className="flex justify-center mb-3">
        <AgentAvatar name={entry.agent_name} level={level} size="lg" />
      </div>
      <p className="text-lg font-bold text-oav-text mt-3 text-center">{entry.agent_name}</p>
      <p className="text-sm text-oav-muted text-center">{levelName}</p>
      <div className="flex justify-center gap-6 mt-4 text-center">
        <div>
          <p className="text-lg font-bold text-oav-text tabular-nums">
            {entry.total_xp.toLocaleString()}
          </p>
          <p className="text-xs text-oav-muted">Total XP</p>
        </div>
        <div>
          <p className="text-lg font-bold text-oav-text tabular-nums">
            {entry.achievement_count ?? 0}
          </p>
          <p className="text-xs text-oav-muted">Achievements</p>
        </div>
        {entry.prev_rank != null && entry.rank != null && (
          <div>
            <p className={clsx(
              'text-lg font-bold tabular-nums',
              entry.rank < entry.prev_rank ? 'text-oav-success' : 'text-oav-muted',
            )}>
              {entry.rank < entry.prev_rank ? `+${entry.prev_rank - entry.rank}` : '—'}
            </p>
            <p className="text-xs text-oav-muted">Rank Change</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendIcon({ rank, prevRank }: { rank?: number; prevRank?: number }) {
  if (rank == null || prevRank == null) return <Minus className="w-4 h-4 text-oav-muted" aria-label="No change" />;
  if (rank < prevRank) return <ArrowUp className="w-4 h-4 text-oav-success" aria-label="Rank improved" />;
  if (rank > prevRank) return <ArrowDown className="w-4 h-4 text-oav-error" aria-label="Rank declined" />;
  return <Minus className="w-4 h-4 text-oav-muted" aria-label="No change" />;
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    leaderboard,
    leaderboardPeriod,
    leaderboardCategory,
    setLeaderboard,
    setLeaderboardPeriod,
    setLeaderboardCategory,
  } = useGamificationStore();

  const period = (searchParams.get('period') as LeaderboardPeriod) ?? leaderboardPeriod;
  const category = (searchParams.get('category') as LeaderboardCategory) ?? leaderboardCategory;

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period, category],
    queryFn: async () => {
      const { data } = await apiClient.get<LeaderboardEntry[]>('/api/gamification/leaderboard', {
        params: { period, category },
      });
      return data;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) setLeaderboard(data);
  }, [data, setLeaderboard]);

  const entries = data ?? leaderboard;
  const champion = entries[0] ?? null;

  const selectPeriod = (p: LeaderboardPeriod) => {
    setLeaderboardPeriod(p);
    setSearchParams({ period: p, category });
  };

  const selectCategory = (c: LeaderboardCategory) => {
    setLeaderboardCategory(c);
    setSearchParams({ period, category: c });
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />
      <h1 className="text-xl font-bold text-oav-text">Leaderboard</h1>

      {/* Period + Category selectors */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg overflow-hidden border border-oav-border" role="group" aria-label="Time period">
          {PERIODS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => selectPeriod(id)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
                period === id
                  ? 'bg-oav-accent text-white'
                  : 'bg-oav-surface text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
              )}
              aria-pressed={period === id}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-oav-border" role="group" aria-label="Category">
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => selectCategory(id)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
                category === id
                  ? 'bg-oav-accent text-white'
                  : 'bg-oav-surface text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
              )}
              aria-pressed={category === id}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center"><LoadingSpinner /></div>
      ) : entries.length === 0 ? (
        <EmptyState message="No leaderboard data yet" />
      ) : (
        <div className="space-y-6">
          {/* Champion card */}
          {champion && <ChampionCard entry={champion} />}

          {/* Ranked list */}
          <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
            {entries.map((entry, i) => {
              const { level, name: levelName } = xpProgress(entry.total_xp);
              return (
                <div
                  key={entry.agent_id}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3 border-b border-oav-border last:border-0',
                    'cursor-pointer hover:bg-oav-surface-hover transition-colors duration-150',
                  )}
                  onClick={() => navigate(`/agents/${entry.agent_id}`)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/agents/${entry.agent_id}`); }}
                >
                  {/* Rank */}
                  <span className={clsx(
                    'w-10 text-lg font-bold tabular-nums',
                    i === 0 ? 'text-oav-gold' : 'text-oav-muted',
                  )}>
                    #{i + 1}
                  </span>

                  {/* Avatar */}
                  <AgentAvatar name={entry.agent_name} level={level} size="sm" />

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-oav-text truncate">{entry.agent_name}</p>
                    <p className="text-xs text-oav-muted">Lv {level} · {levelName}</p>
                  </div>

                  {/* XP value */}
                  <span className="text-sm font-bold text-oav-text tabular-nums w-24 text-right">
                    {entry.total_xp.toLocaleString()} XP
                  </span>

                  {/* Achievement count (hidden on mobile) */}
                  <span className="hidden md:block text-xs text-oav-muted w-16 text-center">
                    {entry.achievement_count ?? 0} badges
                  </span>

                  {/* Trend */}
                  <div className="w-8 flex justify-end">
                    <TrendIcon rank={entry.rank} prevRank={entry.prev_rank} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
