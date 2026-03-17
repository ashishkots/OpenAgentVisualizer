import type { IntegrationConfig } from '../../types/integration';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { CLICommandBlock } from './CLICommandBlock';
export function IntegrationCard({ config, onTest }: { config: IntegrationConfig; onTest?: () => void }) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-oav-text font-medium text-sm">{config.name}</p>
        <IntegrationStatusBadge status={config.status} />
      </div>
      {config.last_event_at && <p className="text-oav-muted text-xs">Last seen {config.last_event_at}</p>}
      <p className="text-oav-muted text-xs">{config.event_count_24h} events (24h)</p>
      <CLICommandBlock command={config.install_command} />
      {onTest && (
        <button onClick={onTest} className="w-full text-xs py-1.5 rounded-lg border transition-colors text-oav-muted hover:text-oav-text"
          style={{ borderColor: 'var(--oav-border)' }}>Test connection</button>
      )}
    </div>
  );
}
