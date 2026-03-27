import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';
import { apiClient } from '../services/api';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { clsx } from 'clsx';

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }];

type Range = '24h' | '7d' | '30d';
type Interval = 'hourly' | 'daily';

const RANGES: { id: Range; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d',  label: '7d'  },
  { id: '30d', label: '30d' },
];

const PIE_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#eab308'];

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const range: Range = (searchParams.get('range') as Range) ?? '7d';
  const interval: Interval = (searchParams.get('interval') as Interval) ?? 'daily';

  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['analytics', range, interval],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/metrics/analytics', {
        params: { range, interval },
      });
      return data as {
        cost_over_time: Array<{ timestamp: string; cost: number }>;
        token_usage: Array<{ timestamp: string; prompt: number; completion: number }>;
        latency_distribution: Array<{ bucket: string; count: number }>;
        cost_per_agent: Array<{ agent_name: string; cost: number }>;
      };
    },
    staleTime: 60_000,
  });

  const setRange = (r: Range) => setSearchParams({ range: r, interval });
  const setInterval = (i: Interval) => setSearchParams({ range, interval: i });

  const handleExportCSV = () => {
    // Trigger CSV download from API
    window.open(`/api/metrics/analytics/export?range=${range}&interval=${interval}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-oav-text">Analytics</h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 text-sm text-oav-muted hover:text-oav-text border border-oav-border rounded-lg px-3 py-2 transition-colors min-h-[44px]"
          aria-label="Export data as CSV"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg overflow-hidden border border-oav-border" role="group" aria-label="Time range">
          {RANGES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setRange(id)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
                range === id
                  ? 'bg-oav-accent text-white'
                  : 'bg-oav-surface text-oav-muted hover:text-oav-text',
              )}
              aria-pressed={range === id}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-oav-border" role="group" aria-label="Interval">
          {(['hourly', 'daily'] as Interval[]).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={clsx(
                'px-3 py-2 text-sm font-medium transition-colors capitalize min-h-[44px]',
                interval === i
                  ? 'bg-oav-accent text-white'
                  : 'bg-oav-surface text-oav-muted hover:text-oav-text',
              )}
              aria-pressed={interval === i}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : !metricsData ? (
        <EmptyState message="No analytics data available" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Cost over time */}
          <div className="bg-oav-surface border border-oav-border rounded-xl p-4 lg:col-span-2">
            <h2 className="text-sm font-medium text-oav-muted mb-3">Token Cost Over Time</h2>
            <div className="h-64">
              {metricsData.cost_over_time.length === 0 ? (
                <EmptyState message="No data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData.cost_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(v) => new Date(v).toLocaleDateString()}
                      stroke="#94a3b8"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', borderRadius: 8 }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(v: number) => [`$${v.toFixed(4)}`, 'Cost']}
                    />
                    <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Cost per agent pie */}
          <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
            <h2 className="text-sm font-medium text-oav-muted mb-3">Cost Per Agent</h2>
            <div className="h-64">
              {metricsData.cost_per_agent.length === 0 ? (
                <EmptyState message="No data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricsData.cost_per_agent}
                      dataKey="cost"
                      nameKey="agent_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ agent_name, percent }) =>
                        `${agent_name.slice(0, 8)} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {metricsData.cost_per_agent.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', borderRadius: 8 }}
                      formatter={(v: number) => [`$${v.toFixed(4)}`, 'Cost']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Token usage stacked */}
          <div className="bg-oav-surface border border-oav-border rounded-xl p-4 lg:col-span-2">
            <h2 className="text-sm font-medium text-oav-muted mb-3">Token Usage</h2>
            <div className="h-64">
              {metricsData.token_usage.length === 0 ? (
                <EmptyState message="No data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData.token_usage}>
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
                    />
                    <Legend />
                    <Bar dataKey="prompt" stackId="a" fill="#06b6d4" name="Prompt" />
                    <Bar dataKey="completion" stackId="a" fill="#3b82f6" name="Completion" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Latency histogram */}
          <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
            <h2 className="text-sm font-medium text-oav-muted mb-3">Latency Distribution</h2>
            <div className="h-64">
              {metricsData.latency_distribution.length === 0 ? (
                <EmptyState message="No data" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData.latency_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis dataKey="bucket" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', borderRadius: 8 }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="count" fill="#a855f7" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
