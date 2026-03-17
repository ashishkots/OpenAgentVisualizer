import { useCosts, useTokenUsage } from '../hooks/useMetrics';
import { useAgents } from '../hooks/useAgents';
import { BentoGrid } from '../components/common/BentoGrid';
import { BentoMetricCard } from '../components/metrics/BentoMetricCard';
import { CostHeatmap } from '../components/metrics/CostHeatmap';
import { LeaderboardTable } from '../components/gamification/LeaderboardTable';
import { SectionHeader } from '../components/layout/SectionHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function DashboardPage() {
  const { data: costs, isLoading: costsLoading } = useCosts();
  const { data: tokenUsage, isLoading: tokensLoading } = useTokenUsage();
  const { data: agentsData, isLoading: agentsLoading } = useAgents();
  const agents = (agentsData as any)?.agents ?? [];

  if (costsLoading || tokensLoading || agentsLoading) return (
    <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>
  );

  const activeAgents = agents.filter((a: any) => a.status !== 'idle').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <SectionHeader title="Overview" />
      <BentoGrid>
        <BentoMetricCard title="Total Agents" value={agents.length} colSpan={3} />
        <BentoMetricCard title="Active Now"   value={activeAgents}  colSpan={3} />
        <BentoMetricCard title="Cost Today"   value={(costs as any)?.daily_cost_usd ?? 0}  prefix="$" colSpan={3} />
        <BentoMetricCard title="Total Cost"   value={(costs as any)?.total_cost_usd ?? 0}  prefix="$" colSpan={3} />
      </BentoGrid>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
          <SectionHeader title="Cost Heatmap (7 days)" />
          <CostHeatmap data={[]} />
        </div>
        <div className="col-span-4 rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
          <SectionHeader title="Leaderboard" />
          <LeaderboardTable agents={agents} />
        </div>
      </div>
    </div>
  );
}
