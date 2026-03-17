import { useCosts, useTokenUsage } from '../hooks/useMetrics';
import { CostChart } from '../components/metrics/CostChart';
import { TokenUsageBar } from '../components/metrics/TokenUsageBar';
import { CostSummaryCard } from '../components/metrics/CostSummaryCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export function DashboardPage() {
  const { data: costs, isLoading: costsLoading } = useCosts();
  const { data: tokenUsage, isLoading: tokensLoading } = useTokenUsage();

  if (costsLoading || tokensLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Build chart data from costs summary
  const costChartData = costs
    ? [{ date: 'Today', cost: costs.daily_cost_usd }, { date: 'Week', cost: costs.weekly_cost_usd }]
    : [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-oav-text">Dashboard</h1>

      {costs ? (
        <CostSummaryCard summary={costs} />
      ) : (
        <EmptyState message="No cost data available" />
      )}

      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <h2 className="text-oav-muted text-sm mb-3">Cost Over Time</h2>
        <CostChart data={costChartData} />
      </div>

      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <h2 className="text-oav-muted text-sm mb-3">Token Usage by Agent</h2>
        {tokenUsage && tokenUsage.length > 0 ? (
          <TokenUsageBar data={tokenUsage} />
        ) : (
          <EmptyState message="No token usage data" />
        )}
      </div>
    </div>
  );
}
