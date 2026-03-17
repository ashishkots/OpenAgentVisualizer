import { formatCost } from '../../lib/formatters';
import type { CostSummary } from '../../types/metrics';

interface Props {
  summary: CostSummary;
}

export function CostSummaryCard({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <p className="text-oav-muted text-xs mb-1">Daily Cost</p>
        <p className="text-oav-text text-xl font-bold">{formatCost(summary.daily_cost_usd)}</p>
      </div>
      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <p className="text-oav-muted text-xs mb-1">Weekly Cost</p>
        <p className="text-oav-text text-xl font-bold">{formatCost(summary.weekly_cost_usd)}</p>
      </div>
      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <p className="text-oav-muted text-xs mb-1">Total Cost</p>
        <p className="text-oav-text text-xl font-bold">{formatCost(summary.total_cost_usd)}</p>
      </div>
    </div>
  );
}
