import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatTokens } from '../../lib/formatters';
import type { TokenUsage } from '../../types/metrics';

interface Props {
  data: TokenUsage[];
}

export function TokenUsageBar({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.agent_name,
    tokens: d.total_tokens,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <YAxis
          stroke="#475569"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickFormatter={(v) => formatTokens(v)}
        />
        <Tooltip
          contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', color: '#e2e8f0' }}
          formatter={(v: number) => [formatTokens(v), 'Tokens']}
        />
        <Bar dataKey="tokens" fill="#3b82f6" radius={[3, 3, 0, 0]}>
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={idx % 2 === 0 ? '#3b82f6' : '#a855f7'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
