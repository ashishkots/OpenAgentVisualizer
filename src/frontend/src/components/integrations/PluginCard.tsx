import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { CLICommandBlock } from './CLICommandBlock';
interface Props { name: string; version?: string; active: boolean; commands: string[]; installCommand: string; onUpdate?: () => void; onRemove?: () => void; }
export function PluginCard({ name, version, active, commands, installCommand, onUpdate, onRemove }: Props) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-oav-text font-medium text-sm">{name}</p>
          {version && <p className="text-oav-muted text-xs">v{version}</p>}
        </div>
        <IntegrationStatusBadge status={active ? 'connected' : 'not_configured'} />
      </div>
      {active && commands.length > 0 && (
        <div className="space-y-1">
          {commands.map(c => <p key={c} className="text-oav-muted text-xs font-mono">{c}</p>)}
        </div>
      )}
      {!active && <CLICommandBlock command={installCommand} />}
      {active && (
        <div className="flex gap-2">
          {onUpdate && <button onClick={onUpdate} className="flex-1 text-xs py-1 rounded border text-oav-muted hover:text-oav-text transition-colors" style={{ borderColor: 'var(--oav-border)' }}>Update</button>}
          {onRemove && <button onClick={onRemove} className="flex-1 text-xs py-1 rounded border text-oav-error hover:opacity-80 transition-colors" style={{ borderColor: 'var(--oav-error)' }}>Remove</button>}
        </div>
      )}
    </div>
  );
}
