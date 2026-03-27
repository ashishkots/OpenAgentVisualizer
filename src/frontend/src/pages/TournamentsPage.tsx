import { useState } from 'react';
import { X, Coins, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { TournamentCard } from '../components/gamification/TournamentCard';
import { useTournaments, useEnterTournament, useTournamentLeaderboard } from '../hooks/useTournaments';
import { useTournamentStore } from '../stores/tournamentStore';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Tournament, TournamentStatus } from '../types/tournament';
import type { Wallet } from '../types/economy';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tournaments' },
];

const TABS: { id: TournamentStatus; label: string }[] = [
  { id: 'upcoming',  label: 'Upcoming'  },
  { id: 'active',    label: 'Active'    },
  { id: 'completed', label: 'Completed' },
];

function LiveLeaderboard({ tournamentId }: { tournamentId: string }) {
  const { data: entries, isLoading } = useTournamentLeaderboard(tournamentId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return <p className="text-xs text-oav-muted text-center py-3">No entries yet</p>;
  }

  return (
    <div className="mt-3 border-t border-oav-border pt-3 space-y-1">
      <p className="text-xs font-medium text-oav-muted mb-2 uppercase tracking-wide">
        Live Rankings
      </p>
      {entries.slice(0, 5).map((entry, i) => (
        <div
          key={entry.id}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-oav-surface-hover"
        >
          <span
            className={clsx(
              'text-xs font-bold w-5 text-center tabular-nums',
              i === 0 ? 'text-oav-gold' : 'text-oav-muted',
            )}
          >
            #{i + 1}
          </span>
          <AgentAvatar name={entry.agent_name} level={1} size="sm" />
          <span className="flex-1 text-xs text-oav-text truncate">{entry.agent_name}</span>
          <span className="text-xs font-medium text-oav-text tabular-nums">
            {entry.score.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface EnterModalProps {
  tournament: Tournament;
  walletBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function EnterModal({ tournament, walletBalance, onConfirm, onCancel, isPending }: EnterModalProps) {
  const afterBalance = walletBalance - tournament.entry_fee;
  const canAfford = walletBalance >= tournament.entry_fee;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enter-modal-title"
    >
      <div className="bg-oav-surface border border-oav-border rounded-xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-oav-border">
          <h2 id="enter-modal-title" className="text-base font-semibold text-oav-text">
            Enter Tournament
          </h2>
          <button
            onClick={onCancel}
            className="text-oav-muted hover:text-oav-text transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-oav-text font-medium">{tournament.name}</p>

          <div className="bg-oav-surface-hover rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-oav-muted">Entry fee</span>
              <div className="flex items-center gap-1 font-medium text-oav-text">
                <Coins className="w-3.5 h-3.5 text-oav-gold" aria-hidden="true" />
                {tournament.entry_fee.toLocaleString()}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-oav-muted">Current balance</span>
              <div className="flex items-center gap-1 font-medium text-oav-text">
                <Coins className="w-3.5 h-3.5 text-oav-gold" aria-hidden="true" />
                {walletBalance.toLocaleString()}
              </div>
            </div>
            <div className="border-t border-oav-border pt-2 flex justify-between">
              <span className="text-oav-muted">Balance after</span>
              <div
                className={clsx(
                  'flex items-center gap-1 font-bold',
                  canAfford ? 'text-oav-text' : 'text-oav-error',
                )}
              >
                <Coins className="w-3.5 h-3.5 text-oav-gold" aria-hidden="true" />
                {afterBalance.toLocaleString()}
              </div>
            </div>
          </div>

          {!canAfford && (
            <div className="flex items-start gap-2 text-xs text-oav-error bg-oav-error/10 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Insufficient balance to enter this tournament.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-oav-border">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-oav-muted bg-oav-surface-hover hover:bg-oav-border transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford || isPending}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              canAfford && !isPending
                ? 'bg-oav-accent text-white hover:bg-oav-accent/80'
                : 'bg-oav-surface-hover text-oav-muted cursor-not-allowed',
            )}
          >
            {isPending ? 'Entering...' : 'Confirm Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TournamentsPage() {
  const { activeTab, setActiveTab } = useTournamentStore();
  const [enterTarget, setEnterTarget] = useState<Tournament | null>(null);

  const { data: tournaments, isLoading } = useTournaments(activeTab);
  const enterMutation = useEnterTournament();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const { data } = await apiClient.get<Wallet>('/api/wallet');
      return data;
    },
    staleTime: 30_000,
  });

  const walletBalance = wallet?.balance ?? 0;

  const handleConfirmEnter = () => {
    if (!enterTarget) return;
    enterMutation.mutate(enterTarget.id, {
      onSuccess: () => setEnterTarget(null),
    });
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />
      <h1 className="text-xl font-bold text-oav-text">Tournaments</h1>

      {/* Tabs */}
      <div
        className="flex rounded-lg overflow-hidden border border-oav-border w-fit"
        role="tablist"
        aria-label="Tournament status"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'px-4 py-2 text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              activeTab === id
                ? 'bg-oav-accent text-white'
                : 'bg-oav-surface text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !tournaments || tournaments.length === 0 ? (
        <EmptyState
          message={`No ${activeTab} tournaments right now. Check back soon!`}
          icon="🏆"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="flex flex-col">
              <TournamentCard
                tournament={tournament}
                walletBalance={walletBalance}
                onEnter={setEnterTarget}
              />
              {tournament.status === 'active' && (
                <LiveLeaderboard tournamentId={tournament.id} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enter confirmation modal */}
      {enterTarget && (
        <EnterModal
          tournament={enterTarget}
          walletBalance={walletBalance}
          onConfirm={handleConfirmEnter}
          onCancel={() => setEnterTarget(null)}
          isPending={enterMutation.isPending}
        />
      )}
    </div>
  );
}
