import type { Agent } from '../../types/agent';
import { XPProgressBar } from './XPProgressBar';
const MEDALS = ['🥇','🥈','🥉'];
export function LeaderboardTable({ agents }: { agents: Agent[] }) {
  const sorted = [...agents].sort((a,b) => b.xp_total - a.xp_total).slice(0, 10);
  return (
    <div className="space-y-2">
      {sorted.map((a, i) => (
        <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors"
          style={{ background: 'var(--oav-surface-2)' }}>
          <span className="w-6 text-center text-sm">{MEDALS[i] ?? `#${i+1}`}</span>
          <div className="flex-1 min-w-0">
            <p className="text-oav-text text-sm truncate">{a.name}</p>
            <XPProgressBar xpTotal={a.xp_total} />
          </div>
          <span className="text-oav-muted text-xs shrink-0">{a.xp_total.toLocaleString()} XP</span>
        </div>
      ))}
    </div>
  );
}
