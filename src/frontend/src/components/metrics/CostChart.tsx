import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ date: string; cost: number }>;
}

export function CostChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis
          stroke="#475569"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickFormatter={(v) => `$${v.toFixed(2)}`}
        />
        <Tooltip
          contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', color: '#e2e8f0' }}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="#3b82f6"
          fill="url(#costGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
