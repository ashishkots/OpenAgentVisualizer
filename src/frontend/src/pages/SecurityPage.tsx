import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { clsx } from 'clsx';
import { Shield } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { GradeBadge } from '../components/ui/GradeBadge';
import { GaugeChart, scoreToGrade } from '../components/ui/GaugeChart';
import { SlideInPanel } from '../components/ui/SlideInPanel';
import { IntegrationStatusBadge } from '../components/ui/IntegrationStatusBadge';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSecurityScores, useSecurityGrades, useViolationTimeline } from '../hooks/useSecurity';
import { useSecurityStore } from '../stores/securityStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { useAgentStore } from '../stores/agentStore';
import type { ViolationSeverity, ViolationTimelinePoint } from '../types/security';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Security' },
];

const SEVERITY_BADGE_CLASSES: Record<ViolationSeverity, string> = {
  critical: 'bg-oav-error/20 text-oav-error',
  high:     'bg-oav-shield/20 text-oav-shield',
  medium:   'bg-oav-warning/20 text-oav-warning',
  low:      'bg-oav-muted/20 text-oav-muted',
};

function CustomDot(props: { cx?: number; cy?: number; payload?: ViolationTimelinePoint }) {
  const { cx = 0, cy = 0, payload } = props;
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#fb923c',
    medium: '#f59e0b',
    low: '#94a3b8',
  };
  const fill = payload?.maxSeverity ? severityColors[payload.maxSeverity] : '#ef4444';
  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke="none" />;
}

export function SecurityPage() {
  const shieldStatus = useIntegrationStore((s) => s.getStatus('openshield'));
  const { complianceScore, agentProfiles, violationTimeline, selectedAgentId, setSelectedAgent } =
    useSecurityStore();
  const agents = useAgentStore((s) => s.agents);

  const { isLoading: scoresLoading } = useSecurityScores();
  const { isLoading: gradesLoading } = useSecurityGrades();
  useViolationTimeline();

  const selectedProfile = agentProfiles.find((p) => p.agent_id === selectedAgentId);

  if (shieldStatus === 'disconnected' && !complianceScore) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-6">
        <Shield className="w-12 h-12 text-oav-muted" aria-hidden="true" />
        <p className="text-sm font-medium text-oav-text">OpenShield connection unavailable.</p>
        <p className="text-xs text-oav-muted max-w-xs">
          Security posture data requires OpenShield to be running.
        </p>
        <Link to="/settings?tab=integrations" className="text-oav-accent text-sm hover:underline">
          Configure OpenShield →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6" data-testid="security-page">
      <Breadcrumb items={BREADCRUMB} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-oav-text">Security Dashboard</h1>
        <IntegrationStatusBadge status={shieldStatus} />
      </div>

      {/* Summary stats row */}
      {scoresLoading && !complianceScore ? (
        <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
      ) : complianceScore && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Compliance Score',
              value: `${complianceScore.workspace_score}/100`,
              sub: `Grade ${complianceScore.workspace_grade}`,
              badge: <GradeBadge grade={complianceScore.workspace_grade} size="md" animate />,
            },
            {
              label: 'PII Exposures',
              value: String(complianceScore.pii_exposure_count),
              sub: 'last 24h',
            },
            {
              label: 'Violations',
              value: String(complianceScore.violation_count_24h),
              sub: 'last 24h',
            },
            {
              label: 'Active Threats',
              value: String(complianceScore.active_threat_count),
              sub: 'active',
            },
          ].map(({ label, value, sub, badge }) => (
            <div key={label} className="bg-oav-surface border border-oav-border rounded-xl p-4">
              <p className="text-xs text-oav-muted mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-oav-text">{value}</p>
                {badge}
              </div>
              <p className="text-xs text-oav-muted mt-1">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Compliance gauge */}
      {complianceScore && (
        <div className="bg-oav-surface border border-oav-border rounded-xl p-6 flex flex-col items-center gap-3">
          <GaugeChart
            score={complianceScore.workspace_score}
            grade={scoreToGrade(complianceScore.workspace_score)}
            lastUpdated={format(new Date(complianceScore.last_updated_at), 'MMM d, yyyy HH:mm')}
            className="w-full"
          />
        </div>
      )}

      {/* Agent security table */}
      <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-oav-bg/50 border-b border-oav-border">
              <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2.5">
                Agent
              </th>
              <th className="text-center text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2.5 w-16">
                Grade
              </th>
              <th className="text-right text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2.5 w-24">
                Score
              </th>
              <th className="text-right text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2.5 w-24">
                Violations
              </th>
              <th className="text-right text-xs text-oav-muted uppercase tracking-wider font-medium px-4 py-2.5 w-28 hidden md:table-cell">
                Last Violation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oav-border/50">
            {gradesLoading && agentProfiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : (
              agentProfiles.map((profile) => {
                const agent = agents[profile.agent_id];
                return (
                  <tr
                    key={profile.agent_id}
                    className={clsx(
                      'hover:bg-oav-surface-hover cursor-pointer transition-colors duration-100',
                      profile.grade === 'F' && 'border-l-2 border-l-oav-error',
                      profile.grade === 'D' && 'border-l-2 border-l-oav-shield',
                    )}
                    onClick={() => setSelectedAgent(profile.agent_id)}
                    data-testid="security-agent-row"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {agent && <AgentAvatar name={agent.name} level={agent.level} status={agent.status} size="sm" />}
                        <span className="text-sm font-medium text-oav-text">{profile.agent_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <GradeBadge grade={profile.grade} size="sm" animate />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-oav-bg rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              profile.grade === 'A' && 'bg-oav-success',
                              profile.grade === 'B' && 'bg-oav-knowledge',
                              profile.grade === 'C' && 'bg-oav-warning',
                              profile.grade === 'D' && 'bg-oav-shield',
                              profile.grade === 'F' && 'bg-oav-error',
                            )}
                            style={{ width: `${profile.score}%` }}
                          />
                        </div>
                        <span className="text-sm tabular-nums text-oav-text font-medium">
                          {profile.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={clsx(
                          'text-sm tabular-nums',
                          profile.violation_count > 0
                            ? 'text-oav-error font-semibold'
                            : 'text-oav-muted',
                        )}
                      >
                        {profile.violation_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-oav-muted tabular-nums hidden md:table-cell">
                      {profile.last_violation_at
                        ? format(new Date(profile.last_violation_at), 'HH:mm')
                        : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Violations timeline */}
      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-oav-text mb-3">Violations (last 24h)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={violationTimeline} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#2d3748' }}
              tickFormatter={(h) => `${h}:00`}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#1e2433',
                border: '1px solid #2d3748',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#e2e8f0',
              }}
              formatter={(value) => [`${value} violations`, '']}
              labelFormatter={(h) => `${h}:00`}
            />
            <Line
              type="monotone"
              dataKey="violations"
              stroke="#ef4444"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: '#ef4444', stroke: '#1e2433', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Agent security detail panel */}
      <SlideInPanel
        open={!!selectedProfile}
        onClose={() => setSelectedAgent(null)}
        title={selectedProfile?.agent_name ?? 'Security Detail'}
        width="360"
        data-testid="security-detail-panel"
      >
        {selectedProfile && (
          <div className="space-y-4">
            {/* Grade + score */}
            <div className="flex items-center gap-4 pb-4 border-b border-oav-border">
              <GradeBadge grade={selectedProfile.grade} size="lg" animate />
              <div>
                <p className="text-lg font-bold text-oav-text">{selectedProfile.score}/100</p>
                <p className="text-xs text-oav-muted">Overall score</p>
              </div>
            </div>

            {/* Score breakdown */}
            <div>
              <h3 className="text-xs text-oav-muted uppercase tracking-wider font-medium mb-2">
                Score Breakdown
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Data Privacy', score: selectedProfile.score_breakdown.data_privacy },
                  { label: 'Policy Compliance', score: selectedProfile.score_breakdown.policy_compliance },
                  { label: 'Access Control', score: selectedProfile.score_breakdown.access_control },
                ].map(({ label, score }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-oav-muted">{label}</span>
                      <span className="text-oav-text font-medium">{score}/100</span>
                    </div>
                    <div className="h-1.5 bg-oav-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-oav-accent"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent violations */}
            {selectedProfile.recent_violations.length > 0 && (
              <div>
                <h3 className="text-xs text-oav-muted uppercase tracking-wider font-medium mb-2">
                  Recent Violations
                </h3>
                <div className="space-y-2">
                  {selectedProfile.recent_violations.slice(0, 10).map((v) => (
                    <div key={v.id} className="bg-oav-bg rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-oav-muted">
                          {format(new Date(v.timestamp), 'HH:mm')}
                        </span>
                        <span
                          className={clsx(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                            SEVERITY_BADGE_CLASSES[v.severity],
                          )}
                        >
                          {v.severity.charAt(0).toUpperCase() + v.severity.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-oav-text">{v.description}</p>
                      <p className="text-[10px] text-oav-muted">{v.remediation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              to={`/agents/${selectedProfile.agent_id}`}
              className="block text-center text-sm text-oav-accent hover:underline"
              data-testid="view-agent-profile"
            >
              View Full Profile →
            </Link>
          </div>
        )}
      </SlideInPanel>
    </div>
  );
}
