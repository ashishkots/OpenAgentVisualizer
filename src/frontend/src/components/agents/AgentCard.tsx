import type { Agent } from '../../types/agent';
import { AgentAvatarRive } from './AgentAvatarRive';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { formatCost } from '../../lib/formatters';
import { useMode } from '../../hooks/useMode';

const STATUS_DOT: Record<string, string> = {
  idle:'bg-oav-muted', working:'bg-oav-accent', thinking:'bg-oav-accent-2',
  communicating:'bg-oav-success', error:'bg-oav-error',
};

interface Props { agent: Agent; onClick?: () => void; }

export function AgentCard({ agent, onClick }: Props) {
  const { mode } = useMode();
  return (
    <div
      onClick={onClick}
      className="rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)',
        boxShadow: mode === 'gamified' ? '0 0 8px var(--oav-glow)' : undefined }}
    >
      <div className="flex items-center gap-3 mb-3">
        <AgentAvatarRive avatarId={agent.avatar_id} status={agent.status} xpLevel={agent.level} isSelected={false} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-oav-text font-medium text-sm truncate">{agent.name}</p>
          <p className="text-oav-muted text-xs">{agent.framework}</p>
        </div>
        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[agent.status] ?? 'bg-oav-muted'}`} />
      </div>
      <XPProgressBar xpTotal={agent.xp_total} />
      <p className="text-oav-muted text-xs mt-2">{formatCost(agent.total_cost_usd)} total cost</p>
    </div>
  );
}
