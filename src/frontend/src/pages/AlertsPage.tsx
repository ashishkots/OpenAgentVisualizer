import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useAlerts, useResolveAlert } from '../hooks/useAlerts';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { AlertType } from '../types/gamification';

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Alerts' }];

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    iconColor: 'text-oav-error',
    borderLeft: 'border-l-2 border-l-oav-error',
    bg: 'bg-oav-error/10',
    badge: 'bg-oav-error/20 text-oav-error',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-oav-warning',
    borderLeft: 'border-l-2 border-l-oav-warning',
    bg: 'bg-oav-warning/10',
    badge: 'bg-oav-warning/20 text-oav-warning',
  },
  info: {
    icon: Info,
    iconColor: 'text-oav-accent',
    borderLeft: '',
    bg: 'transparent',
    badge: 'bg-oav-accent/20 text-oav-accent',
  },
} as const;

export function AlertsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const severityFilter = searchParams.get('severity') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';

  const { data: alerts = [], isLoading } = useAlerts();
  const { mutate: resolveAlert } = useResolveAlert();

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.resolved);

  const filtered = alerts.filter((a) => {
    const sev = severityFilter === 'all' || a.severity === severityFilter;
    const st =
      statusFilter === 'all' ||
      (statusFilter === 'open' && !a.resolved) ||
      (statusFilter === 'resolved' && a.resolved);
    return sev && st;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resolveSelected = () => {
    for (const id of selected) {
      resolveAlert(id);
    }
    setSelected(new Set());
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="p-6 space-y-4 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />
      <h1 className="text-xl font-bold text-oav-text">Alerts</h1>

      {/* Critical banner */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-xl border border-oav-error/40 bg-oav-error/10 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-oav-error shrink-0" aria-hidden="true" />
          <p className="text-sm text-oav-text flex-1">
            {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require attention
          </p>
          <button
            className="text-sm text-oav-error font-medium hover:underline"
            onClick={() => setSearchParams({ severity: 'critical', status: 'open' })}
          >
            View
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-lg overflow-hidden border border-oav-border" role="group" aria-label="Filter by severity">
          {['all', 'critical', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSearchParams({ severity: sev, status: statusFilter })}
              className={clsx(
                'px-3 py-2 text-sm capitalize transition-colors min-h-[44px]',
                severityFilter === sev
                  ? 'bg-oav-accent text-white'
                  : 'bg-oav-surface text-oav-muted hover:text-oav-text',
              )}
              aria-pressed={severityFilter === sev}
            >
              {sev}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-oav-border" role="group" aria-label="Filter by status">
          {['all', 'open', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setSearchParams({ severity: severityFilter, status: st })}
              className={clsx(
                'px-3 py-2 text-sm capitalize transition-colors min-h-[44px]',
                statusFilter === st
                  ? 'bg-oav-accent text-white'
                  : 'bg-oav-surface text-oav-muted hover:text-oav-text',
              )}
              aria-pressed={statusFilter === st}
            >
              {st}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <button
            onClick={resolveSelected}
            className="ml-auto text-sm text-oav-success border border-oav-success/40 rounded-lg px-3 py-2 hover:bg-oav-success/10 transition-colors min-h-[44px]"
            aria-label={`Resolve ${selected.size} selected alerts`}
          >
            Resolve {selected.size} selected
          </button>
        )}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <EmptyState message="No alerts match your filters" />
      ) : (
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
          {filtered.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG]
              ?? SEVERITY_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 border-b border-oav-border last:border-0',
                  'hover:bg-oav-surface-hover transition-colors',
                  cfg.borderLeft,
                  alert.resolved && 'opacity-50',
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(alert.id)}
                  onChange={() => toggleSelect(alert.id)}
                  className="w-4 h-4 rounded border-oav-border accent-oav-accent"
                  aria-label={`Select alert: ${alert.message}`}
                  disabled={alert.resolved}
                />

                {/* Severity icon */}
                <Icon className={clsx('w-5 h-5 shrink-0', cfg.iconColor)} aria-hidden="true" />

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-oav-text font-medium truncate">{alert.message}</p>
                  {alert.agent_id && (
                    <button
                      className="text-xs text-oav-muted hover:text-oav-accent underline"
                      onClick={() => navigate(`/agents/${alert.agent_id}`)}
                    >
                      View Agent
                    </button>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-xs text-oav-muted w-24 text-right shrink-0 hidden sm:block">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </span>

                {/* Status badge */}
                <span className={clsx(
                  'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                  alert.resolved
                    ? 'bg-oav-success/20 text-oav-success'
                    : cfg.badge,
                )}>
                  {alert.resolved ? 'Resolved' : alert.severity}
                </span>

                {/* Resolve button */}
                {!alert.resolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="text-xs text-oav-muted hover:text-oav-success border border-oav-border rounded px-2 py-1 transition-colors min-h-[32px] shrink-0"
                    aria-label={`Resolve alert: ${alert.message}`}
                  >
                    Resolve
                  </button>
                )}

                {alert.resolved && (
                  <CheckCircle className="w-4 h-4 text-oav-success shrink-0" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
