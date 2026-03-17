import { GlassCard } from '../common/GlassCard';
import { AnimatedCounter } from './AnimatedCounter';
import { SparklineChart } from './SparklineChart';

interface Props {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: number;
  sparkline?: number[];
  colSpan?: number;
}

export function BentoMetricCard({
  title,
  value,
  prefix,
  suffix,
  delta,
  sparkline,
  colSpan = 3,
}: Props) {
  return (
    <GlassCard className={`col-span-${colSpan}`}>
      <p className="text-oav-muted text-xs mb-1">{title}</p>
      <AnimatedCounter
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={2}
        className="text-oav-text text-2xl font-bold"
      />
      {delta !== undefined && (
        <p className={`text-xs mt-1 ${delta >= 0 ? 'text-oav-success' : 'text-oav-error'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </p>
      )}
      {sparkline && (
        <div className="mt-2">
          <SparklineChart data={sparkline} />
        </div>
      )}
    </GlassCard>
  );
}
