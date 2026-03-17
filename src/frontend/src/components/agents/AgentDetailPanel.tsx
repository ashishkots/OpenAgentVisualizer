import type { Agent } from '../../types/agent';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { formatCost, formatTokens } from '../../lib/formatters';
import { useUIStore } from '../../stores/uiStore';

interface Props {
  agent: Agent;
}

export function AgentDetailPanel({ agent }: Props) {
  const { selectAgent } = useUIStore();

  return (
    <div className="fixed right-0 top-0 h-full w-72 bg-oav-surface border-l border-oav-border p-6 overflow-y-auto z-40">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-oav-text font-bold">{agent.name}</h2>
        <button onClick={() => selectAgent(null)} className="text-oav-muted hover:text-oav-text">✕</button>
      </div>
      <p className="text-oav-muted text-xs mb-4">{agent.role} · {agent.framework}</p>
      <div className="space-y-4">
        <div>
          <p className="text-oav-muted text-xs mb-1">XP Progress</p>
          <XPProgressBar xpTotal={agent.xp_total} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-oav-bg rounded-lg p-3">
            <p className="text-oav-muted text-xs">Tokens</p>
            <p className="text-oav-text text-sm font-bold">{formatTokens(agent.total_tokens)}</p>
          </div>
          <div className="bg-oav-bg rounded-lg p-3">
            <p className="text-oav-muted text-xs">Cost</p>
            <p className="text-oav-text text-sm font-bold">{formatCost(agent.total_cost_usd)}</p>
          </div>
        </div>
        <div className="bg-oav-bg rounded-lg p-3">
          <p className="text-oav-muted text-xs mb-1">Status</p>
          <p className="text-oav-text text-sm capitalize">{agent.status}</p>
        </div>
      </div>
    </div>
  );
}
