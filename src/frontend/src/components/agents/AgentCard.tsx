import type { Agent } from '../../types/agent';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { formatCost } from '../../lib/formatters';

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-oav-muted',
  working: 'bg-oav-accent',
  thinking: 'bg-oav-purple',
  communicating: 'bg-oav-success',
  error: 'bg-oav-error',
};

interface Props {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: Props) {
  return (
    <div
      className="bg-oav-surface border border-oav-border rounded-xl p-4 cursor-pointer hover:border-oav-accent transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[agent.status] ?? 'bg-oav-muted'}`} />
        <p className="text-oav-text font-medium text-sm truncate">{agent.name}</p>
        <span className="text-oav-muted text-xs ml-auto">{agent.framework}</span>
      </div>
      <XPProgressBar xpTotal={agent.xp_total} />
      <p className="text-oav-muted text-xs mt-2">{formatCost(agent.total_cost_usd)} total</p>
    </div>
  );
}
