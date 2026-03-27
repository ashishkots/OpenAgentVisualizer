// Sprint 7 — Organization analytics page (cross-workspace aggregation)

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Zap, Trophy, Building2 } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useOrgAnalytics } from '../hooks/useOrganizations';
import { useOrgStore } from '../stores/orgStore';
import { clsx } from 'clsx';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Organization Analytics' },
];

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  colorClass: string;
}

function StatCard({ label, value, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-oav-surface border border-oav-border rounded-xl p-5 flex items-center gap-4">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
        <Icon className="w-5 h-5" aria-hidden={true} />
      </div>
      <div>
        <p className="text-xs text-oav-muted">{label}</p>
        <p className="text-2xl font-bold text-oav-text mt-0.5">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

export function OrgAnalyticsPage() {
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const { data: analytics, isLoading, isError } = useOrgAnalytics(currentOrgId);

  if (!currentOrgId) {
    return (
      <div className="p-6">
        <EmptyState message="No organization selected. Select an organization using the switcher in the header." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="p-6">
        <EmptyState message="Analytics unavailable. Could not load organization analytics. Ensure your workspaces are connected." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6" data-testid="org-analytics-page">
      <Breadcrumb items={BREADCRUMB} />
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-oav-accent" aria-hidden="true" />
        <h1 className="text-xl font-bold text-oav-text">Organization Analytics</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Agents"
          value={analytics.total_agents}
          icon={Users}
          colorClass="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="Total Events"
          value={analytics.total_events}
          icon={Zap}
          colorClass="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          label="Total XP"
          value={analytics.total_xp}
          icon={Trophy}
          colorClass="bg-yellow-500/15 text-yellow-400"
        />
        <StatCard
          label="Active Workspaces"
          value={analytics.active_workspaces}
          icon={Building2}
          colorClass="bg-green-500/15 text-green-400"
        />
      </div>

      {/* Workspace breakdown charts */}
      {analytics.workspace_breakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agents by workspace */}
          <div className="bg-oav-surface border border-oav-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-oav-text mb-4">Agents by Workspace</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.workspace_breakdown}
                  margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-oav-border, #2a2a3a)" />
                  <XAxis
                    dataKey="workspace_name"
                    tick={{ fontSize: 11, fill: 'var(--color-oav-muted, #888)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-oav-muted, #888)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-oav-surface, #1a1a2e)',
                      border: '1px solid var(--color-oav-border, #2a2a3a)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="agents" name="Agents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Events by workspace */}
          <div className="bg-oav-surface border border-oav-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-oav-text mb-4">Events by Workspace</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.workspace_breakdown}
                  margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-oav-border, #2a2a3a)" />
                  <XAxis
                    dataKey="workspace_name"
                    tick={{ fontSize: 11, fill: 'var(--color-oav-muted, #888)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-oav-muted, #888)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-oav-surface, #1a1a2e)',
                      border: '1px solid var(--color-oav-border, #2a2a3a)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="events" name="Events" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* XP by workspace */}
          <div className="bg-oav-surface border border-oav-border rounded-xl p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-oav-text mb-4">XP by Workspace</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.workspace_breakdown}
                  margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-oav-border, #2a2a3a)" />
                  <XAxis
                    dataKey="workspace_name"
                    tick={{ fontSize: 11, fill: 'var(--color-oav-muted, #888)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-oav-muted, #888)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-oav-surface, #1a1a2e)',
                      border: '1px solid var(--color-oav-border, #2a2a3a)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="xp" name="XP" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {analytics.workspace_breakdown.length === 0 && (
        <EmptyState message="No workspace data. Add workspaces to your organization to see cross-workspace analytics." />
      )}
    </div>
  );
}
