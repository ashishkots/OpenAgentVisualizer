import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ChallengeCard } from '../components/gamification/ChallengeCard';
import { useChallenges, useChallengeProgress } from '../hooks/useChallenges';
import type { Challenge } from '../types/team';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Challenges' },
];

function ContributorBreakdown({ challengeId }: { challengeId: string }) {
  const { data: progress, isLoading } = useChallengeProgress(challengeId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!progress || progress.length === 0) {
    return (
      <p className="text-xs text-oav-muted text-center py-3">
        No contributions yet
      </p>
    );
  }

  const total = progress.reduce((sum, p) => sum + p.contribution, 0);

  return (
    <div className="space-y-2 pt-2">
      <p className="text-xs font-medium text-oav-muted uppercase tracking-wide">
        Contributors
      </p>
      {progress.map((p) => {
        const pct = total > 0 ? Math.round((p.contribution / total) * 100) : 0;
        return (
          <div key={p.id} className="flex items-center gap-3">
            <span className="text-xs text-oav-text w-32 truncate">
              {p.contributor_name ?? p.contributor_id.slice(0, 8)}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-oav-border overflow-hidden">
              <div
                className="h-full rounded-full bg-oav-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-oav-muted w-16 text-right tabular-nums">
              {p.contribution.toLocaleString()} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ChallengeWithBreakdown({ challenge }: { challenge: Challenge }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <ChallengeCard challenge={challenge} />
      <button
        onClick={() => setExpanded((v) => !v)}
        className={clsx(
          'flex items-center justify-center gap-1.5 py-2 text-xs text-oav-muted',
          'hover:text-oav-text transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-oav-accent rounded-b-xl',
          'bg-oav-surface border border-t-0 border-oav-border rounded-b-xl',
        )}
        aria-expanded={expanded}
        aria-label={expanded ? 'Hide contributor breakdown' : 'Show contributor breakdown'}
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            Hide breakdown
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            View contributors
          </>
        )}
      </button>
      {expanded && (
        <div className="bg-oav-surface border border-t-0 border-oav-border rounded-b-xl px-5 pb-4">
          <ContributorBreakdown challengeId={challenge.id} />
        </div>
      )}
    </div>
  );
}

export function ChallengesPage() {
  const { data: challenges, isLoading } = useChallenges();

  const active = (challenges ?? []).filter((c) => c.status === 'active');
  const history = (challenges ?? []).filter((c) => c.status !== 'active');

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />
      <h1 className="text-xl font-bold text-oav-text">Cooperative Challenges</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (challenges ?? []).length === 0 ? (
        <EmptyState
          message="No challenges available right now. New challenges are created weekly!"
          icon="🏔️"
        />
      ) : (
        <div className="space-y-8">
          {/* Active challenges */}
          {active.length > 0 && (
            <section aria-labelledby="active-challenges-heading">
              <h2
                id="active-challenges-heading"
                className="text-sm font-semibold text-oav-text mb-3 uppercase tracking-wide"
              >
                Active Challenges ({active.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {active.map((challenge) => (
                  <ChallengeWithBreakdown key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section aria-labelledby="history-challenges-heading">
              <h2
                id="history-challenges-heading"
                className="text-sm font-semibold text-oav-muted mb-3 uppercase tracking-wide"
              >
                Completed / Failed ({history.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-75">
                {history.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
