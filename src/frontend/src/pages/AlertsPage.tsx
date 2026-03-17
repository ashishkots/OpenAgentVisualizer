import { useAlerts } from '../hooks/useAlerts';
import { AlertList } from '../components/alerts/AlertList';
import { AlertBanner } from '../components/alerts/AlertBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.resolved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-oav-text">Alerts</h1>

      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {criticalAlerts.map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <h2 className="text-oav-muted text-sm mb-3">All Alerts</h2>
        <AlertList alerts={alerts} />
      </div>
    </div>
  );
}
