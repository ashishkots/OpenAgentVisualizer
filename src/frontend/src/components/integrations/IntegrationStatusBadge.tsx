import type { IntegrationStatus } from '../../types/integration';
const CFG: Record<IntegrationStatus, { label: string; color: string }> = {
  connected:      { label: 'Connected',       color: 'var(--oav-success)' },
  not_configured: { label: 'Not configured',  color: 'var(--oav-muted)'   },
  error:          { label: 'Error',           color: 'var(--oav-error)'   },
};
export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const { label, color } = CFG[status];
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${color}18`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
