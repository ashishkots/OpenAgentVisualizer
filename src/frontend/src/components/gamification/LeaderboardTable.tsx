import type { LeaderboardEntry } from '../../types/gamification';
import { XPProgressBar } from './XPProgressBar';

interface Props {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-oav-muted text-sm">No agents yet.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div
          key={entry.agent_id}
          className="flex items-center gap-3 bg-oav-surface border border-oav-border rounded-lg px-4 py-2"
        >
          <span className="text-oav-muted text-sm w-6 shrink-0">#{idx + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-oav-text text-sm font-medium truncate">{entry.agent_name}</p>
            <XPProgressBar xpTotal={entry.total_xp} />
          </div>
          <span className="text-oav-muted text-xs shrink-0">{entry.total_xp} XP</span>
        </div>
      ))}
    </div>
  );
}
