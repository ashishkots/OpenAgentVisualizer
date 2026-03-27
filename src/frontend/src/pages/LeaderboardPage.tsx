import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Minus, Crown, ChevronDown } from 'lucide-react';
import { apiClient } from '../services/api';
import { useGamificationStore } from '../stores/gamificationStore';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { SeasonBanner } from '../components/gamification/SeasonBanner';
import { xpProgress } from '../lib/xpLevels';
import { clsx } from 'clsx';
import { useCurrentSeason, useSeasonLeaderboard, useTournaments, useTournamentLeaderboard } from '../hooks/useTournaments';
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

type LeaderboardTab = 'agents' | 'seasonal' | 'tournament' | 'teams';

const LEADERBOARD_TABS: { id: LeaderboardTab; label: string }[] = [
  { id: 'agents',     label: 'Agents'     },
  { id: 'seasonal',   label: 'Seasonal'   },
  { id: 'tournament', label: 'Tournament' },
  { id: 'teams',      label: 'Teams'      },
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

function SeasonalLeaderboard() {
  const { data: season, isLoading: seasonLoading } = useCurrentSeason();
  const { data: entries, isLoading: entriesLoading } = useSeasonLeaderboard(season?.id);

  if (seasonLoading || entriesLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  if (!season) {
    return <EmptyState message="No active season found" />;
  }

  if (!entries || entries.length === 0) {
    return <EmptyState message="No seasonal rankings yet" />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
        {entries.map((entry, i) => (
          <div
            key={`${entry.season_id}-${entry.agent_id}`}
            className="flex items-center gap-4 px-4 py-3 border-b border-oav-border last:border-0"
          >
            <span className={clsx(
              'w-10 text-lg font-bold tabular-nums',
              i === 0 ? 'text-oav-gold' : 'text-oav-muted',
            )}>
              #{i + 1}
            </span>
            <AgentAvatar name={entry.agent_name} level={1} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-oav-text truncate">{entry.agent_name}</p>
              <p className="text-xs text-oav-muted">Season {season.number}</p>
            </div>
            <span className="text-sm font-bold text-oav-text tabular-nums w-28 text-right">
              {entry.xp.toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TournamentLeaderboardTab() {
  const { data: activeTournaments, isLoading } = useTournaments('active');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | undefined>(undefined);

  const activeTournamentId = selectedTournamentId ?? activeTournaments?.[0]?.id;
  const { data: entries, isLoading: entriesLoading } = useTournamentLeaderboard(activeTournamentId);

  if (isLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  if (!activeTournaments || activeTournaments.length === 0) {
    return <EmptyState message="No active tournaments. Check the Tournaments page for upcoming ones." />;
  }

  return (
    <div className="space-y-4">
      {/* Tournament selector */}
      {activeTournaments.length > 1 && (
        <div className="relative">
          <select
            value={activeTournamentId ?? ''}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full appearance-none bg-oav-surface border border-oav-border rounded-lg px-4 py-2 pr-10 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
            aria-label="Select active tournament"
          >
            {activeTournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-oav-muted pointer-events-none" aria-hidden="true" />
        </div>
      )}

      {entriesLoading ? (
        <div className="flex justify-center py-4"><LoadingSpinner /></div>
      ) : !entries || entries.length === 0 ? (
        <EmptyState message="No entries yet in this tournament" />
      ) : (
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-oav-border last:border-0"
            >
              <span className={clsx(
                'w-10 text-lg font-bold tabular-nums',
                i === 0 ? 'text-oav-gold' : 'text-oav-muted',
              )}>
                #{i + 1}
              </span>
              <AgentAvatar name={entry.agent_name} level={1} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-oav-text truncate">{entry.agent_name}</p>
                <p className="text-xs text-oav-muted">Score</p>
              </div>
              <span className="text-sm font-bold text-oav-text tabular-nums w-24 text-right">
                {entry.score.toFixed(2)}
              </span>
              {entry.prize_awarded != null && entry.prize_awarded > 0 && (
                <span className="text-xs font-medium text-oav-gold">
                  +{entry.prize_awarded}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamsLeaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['teams-leaderboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<{
        id: string;
        name: string;
        icon: string;
        member_count: number;
        total_xp: number;
        level: number;
      }>>('/api/teams');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  if (!data || data.length === 0) {
    return <EmptyState message="No teams yet. Create a team on the Teams page!" />;
  }

  const sorted = [...data].sort((a, b) => b.total_xp - a.total_xp);

  return (
    <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
      {sorted.map((team, i) => (
        <div
          key={team.id}
          className="flex items-center gap-4 px-4 py-3 border-b border-oav-border last:border-0"
        >
          <span className={clsx(
            'w-10 text-lg font-bold tabular-nums',
            i === 0 ? 'text-oav-gold' : 'text-oav-muted',
          )}>
            #{i + 1}
          </span>
          <div
            className="w-9 h-9 rounded-full bg-oav-accent/20 flex items-center justify-center text-sm shrink-0"
            aria-hidden="true"
          >
            {team.icon || '⚡'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-oav-text truncate">{team.name}</p>
            <p className="text-xs text-oav-muted">{team.member_count} members · Level {team.level}</p>
          </div>
          <span className="text-sm font-bold text-oav-text tabular-nums w-28 text-right">
            {(team.total_xp ?? 0).toLocaleString()} XP
          </span>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>('agents');

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
    enabled: leaderboardTab === 'agents',
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

      {/* Season banner */}
      <SeasonBanner />

      {/* Top-level tab selector */}
      <div
        className="flex rounded-lg overflow-hidden border border-oav-border w-fit"
        role="tablist"
        aria-label="Leaderboard type"
      >
        {LEADERBOARD_TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={leaderboardTab === id}
            onClick={() => setLeaderboardTab(id)}
            className={clsx(
              'px-4 py-2 text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              leaderboardTab === id
                ? 'bg-oav-accent text-white'
                : 'bg-oav-surface text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Agents tab content */}
      {leaderboardTab === 'agents' && (
        <>
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
        </>
      )}

      {/* Seasonal tab */}
      {leaderboardTab === 'seasonal' && <SeasonalLeaderboard />}

      {/* Tournament tab */}
      {leaderboardTab === 'tournament' && <TournamentLeaderboardTab />}

      {/* Teams tab */}
      {leaderboardTab === 'teams' && <TeamsLeaderboard />}
    </div>
  );
}
