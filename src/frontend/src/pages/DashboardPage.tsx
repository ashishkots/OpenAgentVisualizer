import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Bot, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAgents } from '../hooks/useAgents';
import { useCosts, useTokenUsage } from '../hooks/useMetrics';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAgentStore } from '../stores/agentStore';
import { AgentCard } from '../components/agents/AgentCard';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState as LegacyEmptyState } from '../components/common/EmptyState';
import { EmptyState } from '../components/ui/EmptyState';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { ActivityFeed } from '../components/collaboration/ActivityFeed';
import { useTour } from '../components/onboarding/TourProvider';
import { formatCost } from '../lib/formatters';
import { xpProgress } from '../lib/xpLevels';
import { clsx } from 'clsx';

const BREADCRUMB = [{ label: 'Dashboard' }];

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  isActive,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  isActive?: boolean;
}) {
  return (
    <div className="bg-oav-surface border border-oav-border rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-oav-muted">{label}</p>
      <p className={clsx('text-2xl font-bold tabular-nums', isActive ? 'text-oav-success' : 'text-oav-text')}>
        {isActive && (
          <span className="inline-block w-2 h-2 rounded-full bg-oav-success animate-pulse mr-2" aria-hidden="true" />
        )}
        {value}
      </p>
      {trend && trendLabel && (
        <p className={clsx('text-xs flex items-center gap-1', {
          'text-oav-success': trend === 'up',
          'text-oav-error': trend === 'down',
          'text-oav-muted': trend === 'neutral',
        })}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" aria-hidden="true" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" aria-hidden="true" />}
          {trend === 'neutral' && <Minus className="w-3 h-3" aria-hidden="true" />}
          {trendLabel}
        </p>
      )}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const workspaceId = localStorage.getItem('oav_workspace') ?? '';
  useWebSocket(workspaceId || null);
  const { startTour } = useTour();
  const [activityOpen, setActivityOpen] = useState(false);

  const { data: agentsFromApi, isLoading: agentsLoading } = useAgents();
  const { data: costs } = useCosts();
  const { data: tokenUsage } = useTokenUsage();

  const storeAgents = useAgentStore((s) => s.agents);
  const agents = Object.keys(storeAgents).length > 0
    ? Object.values(storeAgents)
    : (agentsFromApi ?? []);

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const totalXP = agents.reduce((sum, a) => sum + a.xp_total, 0);
  const totalCost = costs?.total_cost_usd ?? agents.reduce((sum, a) => sum + a.total_cost_usd, 0);

  // Sort for leaderboard
  const topAgents = [...agents]
    .sort((a, b) => b.xp_total - a.xp_total)
    .slice(0, 5);

  // Fake sparkline data from token usage if available
  const costChartData = costs
    ? [
        { name: 'Period Start', cost: 0 },
        { name: 'Daily', cost: costs.daily_cost_usd },
        { name: 'Weekly', cost: costs.weekly_cost_usd },
        { name: 'Total', cost: costs.total_cost_usd },
      ]
    : [];

  const tokenChartData = (tokenUsage ?? []).map((t) => ({
    name: t.agent_name,
    prompt: t.prompt_tokens,
    completion: t.completion_tokens,
  }));

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
    {/* Onboarding: show wizard when no agents exist */}
    {agents.length === 0 && <OnboardingWizard onComplete={startTour} />}

    <div className="flex h-full relative">
    <div className="flex-1 p-6 space-y-6 pb-20 md:pb-6 overflow-auto">
      <div className="flex items-center justify-between">
        <Breadcrumb items={BREADCRUMB} className="mb-1" />
        <button
          onClick={() => setActivityOpen((v) => !v)}
          className="flex items-center gap-2 text-xs text-oav-muted hover:text-oav-text border border-oav-border rounded-lg px-3 py-1.5 transition-colors"
          aria-label={activityOpen ? 'Hide activity feed' : 'Show activity feed'}
          aria-expanded={activityOpen}
        >
          <Activity className="w-3.5 h-3.5" aria-hidden="true" />
          {activityOpen ? 'Hide Activity' : 'Activity'}
        </button>
      </div>
      <h1 className="text-xl font-bold text-oav-text">Dashboard</h1>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Agents" value={String(totalAgents)} />
        <StatCard
          label="Active Now"
          value={String(activeAgents)}
          isActive={activeAgents > 0}
          trendLabel="running tasks"
          trend="neutral"
        />
        <StatCard
          label="Total XP Earned"
          value={totalXP.toLocaleString()}
          trend="up"
          trendLabel="all time"
        />
        <StatCard
          label="Total Cost"
          value={formatCost(totalCost)}
        />
      </div>

      {/* Agent Grid */}
      <section aria-labelledby="agents-heading" data-tour="agent-grid">
        <h2 id="agents-heading" className="text-lg font-semibold text-oav-text mb-4">
          Agents
        </h2>
        {agents.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No agents yet"
            description="Connect your first AI agent to start visualizing its activity in real time."
            actionLabel="Learn how to connect"
            onAction={() => navigate('/settings?tab=keys')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => navigate(`/agents/${agent.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Charts + Mini Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost chart */}
        <div className="bg-oav-surface border border-oav-border rounded-xl p-4 lg:col-span-1">
          <h2 className="text-oav-muted text-sm font-medium mb-3">Cost Over Time</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [`$${v.toFixed(4)}`, 'Cost']}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token usage chart */}
        <div className="bg-oav-surface border border-oav-border rounded-xl p-4 lg:col-span-1">
          <h2 className="text-oav-muted text-sm font-medium mb-3">Token Usage</h2>
          <div className="h-60">
            {tokenChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tokenChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="prompt" stackId="1" stroke="#06b6d4" fill="#06b6d433" />
                  <Area type="monotone" dataKey="completion" stackId="1" stroke="#3b82f6" fill="#3b82f633" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <LegacyEmptyState message="No token data" />
            )}
          </div>
        </div>

        {/* Mini Leaderboard */}
        <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-oav-muted text-sm font-medium">Top Agents by XP</h2>
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-xs text-oav-accent hover:underline flex items-center gap-1"
              aria-label="View full leaderboard"
            >
              View all <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-3">
            {topAgents.length === 0 ? (
              <LegacyEmptyState message="No agents yet" />
            ) : (
              topAgents.map((agent, i) => {
                const { level, name: levelName } = xpProgress(agent.xp_total);
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-oav-surface-hover rounded-lg px-2 py-1 transition-colors"
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/agents/${agent.id}`); }}
                  >
                    <span className="text-lg font-bold text-oav-muted w-6 tabular-nums">
                      {i + 1}
                    </span>
                    <AgentAvatar name={agent.name} level={level} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-oav-text truncate">{agent.name}</p>
                      <p className="text-[10px] text-oav-muted">{levelName}</p>
                    </div>
                    <span className="text-xs font-bold text-oav-text tabular-nums">
                      {agent.xp_total.toLocaleString()} XP
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Activity feed sidebar */}
    {activityOpen && (
      <ActivityFeed onClose={() => setActivityOpen(false)} />
    )}
    </div>
    </>
  );
}
