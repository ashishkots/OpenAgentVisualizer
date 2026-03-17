import type { AlertType } from '../../types/gamification';
import { useResolveAlert } from '../../hooks/useAlerts';

interface Props {
  alert: AlertType;
}

export function AlertBanner({ alert }: Props) {
  const { mutate: resolve } = useResolveAlert();
  return (
    <div className="bg-oav-error/20 border border-oav-error rounded-lg px-4 py-2 flex items-center justify-between">
      <p className="text-oav-error text-sm font-medium">{alert.message}</p>
      <button
        onClick={() => resolve(alert.id)}
        className="text-xs text-oav-text hover:text-white ml-4"
      >
        Dismiss
      </button>
    </div>
  );
}
