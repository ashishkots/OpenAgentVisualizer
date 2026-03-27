import { useState } from 'react';
import type { Agent } from '../../types/agent';
import { AgentAvatarRive } from './AgentAvatarRive';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { formatCost, formatTokens } from '../../lib/formatters';
import { useUIStore } from '../../stores/uiStore';

type Tab = 'overview' | 'traces' | 'cost' | 'xp';

export function AgentDetailPanel({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<Tab>('overview');
  const { selectAgent } = useUIStore();

  return (
    <div className="fixed right-0 top-0 h-full w-80 border-l z-40 overflow-y-auto"
      style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--oav-border)' }}>
        <div className="flex items-center gap-3">
          <AgentAvatarRive avatarId={agent.avatar_id} status={agent.status} xpLevel={agent.level} isSelected size={40} />
          <div>
            <p className="text-oav-text font-bold text-sm">{agent.name}</p>
            <p className="text-oav-muted text-xs">{agent.role} · {agent.framework}</p>
          </div>
        </div>
        <button onClick={() => selectAgent(null)} className="text-oav-muted hover:text-oav-text">✕</button>
      </div>
      <div className="flex border-b" style={{ borderColor: 'var(--oav-border)' }}>
        {(['overview','traces','cost','xp'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${tab === t ? 'text-oav-accent border-b-2 border-oav-accent' : 'text-oav-muted'}`}>
            {t === 'xp' ? 'XP Hist.' : t}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-4">
        {tab === 'overview' && <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
              <p className="text-oav-muted text-xs">Status</p>
              <p className="text-oav-text text-sm font-medium capitalize mt-1">{agent.status}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
              <p className="text-oav-muted text-xs">Level</p>
              <p className="text-oav-text text-sm font-bold mt-1">{agent.level}</p>
            </div>
          </div>
          <XPProgressBar xpTotal={agent.xp_total} />
        </>}
        {tab === 'traces' && (
          <div className="space-y-2">
            <p className="text-oav-muted text-xs mb-2">Recent tool calls and LLM spans</p>
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--oav-surface-2)' }}>
              <p className="text-oav-muted text-xs">View full trace in</p>
              <a href={`/replay?agent=${agent.id}`} className="text-oav-accent text-xs underline">Session Replay →</a>
            </div>
          </div>
        )}
        {tab === 'cost' && <>
          <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
            <p className="text-oav-muted text-xs">Total Cost</p>
            <p className="text-oav-text text-xl font-bold mt-1">{formatCost(agent.total_cost_usd)}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
            <p className="text-oav-muted text-xs">Total Tokens</p>
            <p className="text-oav-text text-xl font-bold mt-1">{formatTokens(agent.total_tokens)}</p>
          </div>
        </>}
        {tab === 'xp' && <>
          <XPProgressBar xpTotal={agent.xp_total} />
          <p className="text-oav-muted text-xs">Total XP: {agent.xp_total.toLocaleString()}</p>
        </>}
      </div>
    </div>
  );
}
