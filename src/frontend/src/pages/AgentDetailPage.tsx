import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Award,
  Play,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../services/api';
import { useAgentStore } from '../stores/agentStore';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { XPBar } from '../components/ui/XPBar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { xpProgress, getLevelName } from '../lib/xpLevels';
import { formatCost } from '../lib/formatters';
import { clsx } from 'clsx';
import type { Agent } from '../types/agent';
import type { Achievement } from '../types/gamification';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'events' | 'state' | 'achievements' | 'sessions' | 'xp';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'events',       label: 'Events',        icon: Activity },
  { id: 'state',        label: 'State Machine',  icon: Cpu      },
  { id: 'achievements', label: 'Achievements',   icon: Award    },
  { id: 'sessions',     label: 'Sessions',       icon: Play     },
  { id: 'xp',           label: 'XP History',     icon: TrendingUp },
];

interface AgentEvent {
  id: string;
  event_type: string;
  timestamp: string;
  payload: Record<string, unknown>;
  xp_delta?: number;
}

const FSM_STATES = ['idle', 'active', 'waiting', 'error', 'complete'] as const;
const FSM_TRANSITIONS: Array<{ from: string; event: string; to: string }> = [
  { from: 'idle',     event: 'ACTIVATE',  to: 'active'   },
  { from: 'idle',     event: 'ERROR',     to: 'error'    },
  { from: 'active',   event: 'WAIT',      to: 'waiting'  },
  { from: 'active',   event: 'COMPLETE',  to: 'complete' },
  { from: 'active',   event: 'ERROR',     to: 'error'    },
  { from: 'waiting',  event: 'RESUME',    to: 'active'   },
  { from: 'error',    event: 'RECOVER',   to: 'active'   },
  { from: 'error',    event: 'RESET',     to: 'idle'     },
  { from: 'complete', event: 'RESET',     to: 'idle'     },
];

const STATE_COLORS: Record<string, string> = {
  idle:     'border-oav-muted text-oav-muted bg-oav-muted/10',
  active:   'border-oav-success text-oav-success bg-oav-success/10',
  waiting:  'border-oav-warning text-oav-warning bg-oav-warning/10',
  error:    'border-oav-error text-oav-error bg-oav-error/10',
  complete: 'border-oav-accent text-oav-accent bg-oav-accent/10',
};

export function AgentDetailPage() {
  const { id: agentId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const storeAgent = useAgentStore((s) => s.agents[agentId ?? '']);

  const { data: apiAgent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<Agent>(`/api/agents/${agentId}`);
      return data;
    },
    enabled: !!agentId && !storeAgent,
  });

  const agent = storeAgent ?? apiAgent;

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['agent-events', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<AgentEvent[]>(`/api/agents/${agentId}/events`);
      return data;
    },
    enabled: !!agentId && activeTab === 'events',
    staleTime: 15_000,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['agent-achievements', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<Achievement[]>(`/api/agents/${agentId}/achievements`);
      return data;
    },
    enabled: !!agentId && activeTab === 'achievements',
  });

  const { data: xpHistory = [] } = useQuery({
    queryKey: ['agent-xp-history', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<{ timestamp: string; xp: number; delta: number; reason: string }>>(`/api/agents/${agentId}/xp-history`);
      return data;
    },
    enabled: !!agentId && activeTab === 'xp',
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>;
  }

  if (!agent) {
    return <div className="p-6"><EmptyState message="Agent not found" /></div>;
  }

  const { level, name: levelName } = xpProgress(agent.xp_total);
  const breadcrumb = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Agents' },
    { label: agent.name },
  ];

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <Breadcrumb items={breadcrumb} />

      {/* Profile Header */}
      <div className="bg-oav-surface border border-oav-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AgentAvatar name={agent.name} level={level} status={agent.status} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-oav-text truncate">{agent.name}</h1>
              <StatusBadge status={agent.status} />
            </div>
            <p className="text-oav-muted text-sm mt-1">
              Level {level} {levelName} · {agent.role} · {agent.framework}
            </p>
            <div className="mt-3 max-w-xs">
              <XPBar xpTotal={agent.xp_total} size="md" showLabels />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-oav-text tabular-nums">
              {formatCost(agent.total_cost_usd)}
            </p>
            <p className="text-xs text-oav-muted">total cost</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-oav-border">
        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`tab-panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                'border-b-2 -mb-px focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                activeTab === id
                  ? 'border-oav-accent text-oav-accent'
                  : 'border-transparent text-oav-muted hover:text-oav-text',
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div role="tabpanel" id={`tab-panel-${activeTab}`}>
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {eventsLoading ? (
              <LoadingSpinner />
            ) : events.length === 0 ? (
              <EmptyState message="No events recorded" />
            ) : (
              <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
                {events.slice(0, 100).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 py-2 px-4 border-b border-oav-border last:border-0"
                  >
                    <span className="text-xs font-mono text-oav-muted w-20 shrink-0 tabular-nums pt-0.5">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-oav-bg text-oav-accent border border-oav-accent/30 shrink-0">
                      {ev.event_type}
                    </span>
                    <span className="text-sm text-oav-text flex-1">
                      {JSON.stringify(ev.payload).slice(0, 80)}
                    </span>
                    {ev.xp_delta != null && ev.xp_delta > 0 && (
                      <span className="text-xs text-oav-success font-medium w-16 text-right shrink-0">
                        +{ev.xp_delta} XP
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* State Machine Tab */}
        {activeTab === 'state' && (
          <div className="bg-oav-surface border border-oav-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-oav-text mb-4">FSM Diagram</h2>
            <div className="flex flex-wrap gap-3 mb-6">
              {FSM_STATES.map((state) => (
                <div
                  key={state}
                  className={clsx(
                    'px-4 py-2 rounded-lg border text-sm font-medium capitalize',
                    STATE_COLORS[state] ?? 'border-oav-border text-oav-muted',
                    agent.status === state && 'ring-2 ring-offset-2 ring-offset-oav-bg',
                  )}
                  aria-current={agent.status === state ? 'true' : undefined}
                >
                  {state}
                  {agent.status === state && (
                    <span className="ml-2 text-xs opacity-70">(current)</span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-oav-muted">
              <p className="font-medium mb-2">Transitions:</p>
              <div className="space-y-1 font-mono">
                {FSM_TRANSITIONS.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={clsx('px-1.5 py-0.5 rounded', STATE_COLORS[t.from])}>{t.from}</span>
                    <span className="text-oav-muted">—{t.event}→</span>
                    <span className={clsx('px-1.5 py-0.5 rounded', STATE_COLORS[t.to])}>{t.to}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div>
            {achievements.length === 0 ? (
              <EmptyState message="No achievements data" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={clsx(
                      'rounded-lg p-3 border flex flex-col items-center gap-2 text-center',
                      ach.unlocked
                        ? 'bg-oav-surface border-oav-gold/40'
                        : 'bg-oav-bg border-oav-border/50 opacity-60',
                    )}
                    title={ach.description}
                  >
                    <div
                      className={clsx(
                        'w-8 h-8 flex items-center justify-center',
                        !ach.unlocked && 'grayscale',
                      )}
                    >
                      <Award
                        className={clsx('w-6 h-6', ach.unlocked ? 'text-oav-gold' : 'text-oav-muted')}
                      />
                    </div>
                    <p className="text-xs font-medium text-oav-text">{ach.name}</p>
                    <p className="text-[10px] text-oav-muted">+{ach.xp_bonus} XP</p>
                    {ach.unlocked && ach.unlocked_at && (
                      <p className="text-[10px] text-oav-success">
                        {formatDistanceToNow(new Date(ach.unlocked_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
            <EmptyState message="Session history available in Sessions page" />
          </div>
        )}

        {/* XP History Tab */}
        {activeTab === 'xp' && (
          <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
            <h2 className="text-lg font-semibold text-oav-text mb-4">XP History</h2>
            {xpHistory.length === 0 ? (
              <EmptyState message="No XP history available" />
            ) : (
              <>
                <div className="h-60 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={xpHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(v) => new Date(v).toLocaleDateString()}
                        stroke="#94a3b8"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', borderRadius: 8 }}
                        labelStyle={{ color: '#e2e8f0' }}
                        formatter={(v: number) => [`${v} XP`, 'Total XP']}
                      />
                      <Line type="monotone" dataKey="xp" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {xpHistory.slice(0, 20).map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-oav-border last:border-0">
                      <span className="text-xs font-mono text-oav-muted w-24 shrink-0">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-oav-success font-medium w-16 shrink-0">
                        +{entry.delta} XP
                      </span>
                      <span className="text-xs text-oav-muted flex-1 truncate">{entry.reason}</span>
                      <span className="text-xs font-bold text-oav-text tabular-nums">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
