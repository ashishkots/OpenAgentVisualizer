import { clsx } from 'clsx';
import type { IntegrationStatus } from '../../types/integration';

interface IntegrationStatusBadgeProps {
  status: IntegrationStatus;
  lastCheck?: string | null;
  className?: string;
}

const STATUS_CONFIG: Record<IntegrationStatus, { dot: string; text: string; label: string }> = {
  connected:     { dot: 'w-2 h-2 rounded-full bg-oav-success',    text: 'text-oav-success',   label: 'Connected'     },
  degraded:      { dot: 'w-2 h-2 rounded-full bg-oav-warning animate-pulse', text: 'text-oav-warning', label: 'Degraded' },
  disconnected:  { dot: 'w-2 h-2 rounded-full bg-oav-error',      text: 'text-oav-error',     label: 'Disconnected'  },
  not_configured:{ dot: 'w-2 h-2 rounded-full border border-dashed border-oav-muted', text: 'text-oav-muted', label: 'Not Configured' },
};

export function IntegrationStatusBadge({
  status,
  lastCheck,
  className,
}: IntegrationStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_configured;

  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 text-xs font-medium', className)}
      role="status"
      aria-label={`Integration status: ${config.label}`}
    >
      <span className={config.dot} aria-hidden="true" />
      <span className={config.text}>{config.label}</span>
      {lastCheck && status === 'connected' && (
        <span className="text-oav-muted">(last check: {lastCheck})</span>
      )}
    </span>
  );
}
