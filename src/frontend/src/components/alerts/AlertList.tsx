import type { AlertType } from '../../types/gamification';
import { useResolveAlert } from '../../hooks/useAlerts';

interface Props {
  alerts: AlertType[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'border-oav-error text-oav-error',
  warning: 'border-oav-warning text-oav-warning',
  info: 'border-oav-accent text-oav-accent',
};

export function AlertList({ alerts }: Props) {
  const { mutate: resolve } = useResolveAlert();

  if (alerts.length === 0) {
    return <p className="text-oav-muted text-sm">No alerts. All systems green.</p>;
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 bg-oav-surface rounded-lg px-4 py-3 flex items-start justify-between gap-4 ${SEVERITY_COLORS[alert.severity] ?? 'border-oav-border text-oav-muted'}`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-oav-text text-sm font-medium">{alert.message}</p>
            <p className="text-oav-muted text-xs mt-0.5">
              {alert.alert_type} · {new Date(alert.created_at).toLocaleString()}
            </p>
          </div>
          {!alert.resolved && (
            <button
              onClick={() => resolve(alert.id)}
              className="text-xs text-oav-accent hover:text-blue-400 shrink-0"
            >
              Resolve
            </button>
          )}
          {alert.resolved && (
            <span className="text-xs text-oav-success shrink-0">Resolved</span>
          )}
        </div>
      ))}
    </div>
  );
}
