interface Plugin {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'not_installed' | 'error';
  commands: string[];
  installCommand: string;
}

interface Props {
  plugin: Plugin;
  onInstall?: () => void;
  onUpdate?: () => void;
  onRemove?: () => void;
}

export function PluginCard({ plugin, onInstall, onUpdate, onRemove }: Props) {
  const isActive = plugin.status === 'active';
  const maxCommands = 3;
  const visibleCommands = plugin.commands.slice(0, maxCommands);
  const extraCount = plugin.commands.length - maxCommands;

  return (
    <div className="rounded-xl border border-[var(--oav-border)] bg-[var(--oav-surface)] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-[var(--oav-text)] text-sm">{plugin.name}</p>
          <p className="text-[var(--oav-muted)] text-xs mt-0.5">v{plugin.version}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isActive
              ? 'bg-green-500/10 text-green-400'
              : plugin.status === 'error'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-[var(--oav-surface-2)] text-[var(--oav-muted)]'
          }`}
        >
          {isActive ? '● Active' : plugin.status === 'error' ? '✕ Error' : '○ Not installed'}
        </span>
      </div>

      {/* Commands */}
      <div className="flex flex-wrap gap-1">
        {visibleCommands.map((cmd) => (
          <code key={cmd} className="text-xs bg-[var(--oav-surface-2)] text-[var(--oav-accent)] px-1.5 py-0.5 rounded">
            {cmd}
          </code>
        ))}
        {extraCount > 0 && (
          <span className="text-xs text-[var(--oav-muted)] px-1.5 py-0.5">+{extraCount} more</span>
        )}
      </div>

      {/* Actions */}
      {isActive ? (
        <div className="flex gap-2 mt-auto">
          {onUpdate && (
            <button onClick={onUpdate} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--oav-border)] text-[var(--oav-muted)] hover:text-[var(--oav-text)] transition-colors">
              Update
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/70 hover:text-red-400 transition-colors">
              Remove
            </button>
          )}
        </div>
      ) : (
        <div className="mt-auto">
          <code className="text-xs bg-[var(--oav-surface-2)] text-[var(--oav-muted)] px-2 py-1 rounded block mb-2">
            {plugin.installCommand}
          </code>
          <button
            onClick={onInstall}
            className="w-full text-xs py-1.5 rounded-lg bg-[var(--oav-accent)]/10 text-[var(--oav-accent)] hover:bg-[var(--oav-accent)]/20 transition-colors"
          >
            Install
          </button>
        </div>
      )}
    </div>
  );
}
