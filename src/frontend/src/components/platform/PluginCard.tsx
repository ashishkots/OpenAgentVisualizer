// Sprint 7 — Plugin registry card

import { ShieldCheck, Download, Package, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { PluginRegistry } from '../../types/plugin';

interface PluginCardProps {
  plugin: PluginRegistry;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: (registryId: string) => void;
  onUninstall?: (registryId: string) => void;
}

export function PluginCard({
  plugin,
  isInstalled,
  isInstalling,
  onInstall,
  onUninstall,
}: PluginCardProps) {
  return (
    <article
      className={clsx(
        'flex flex-col gap-3 p-4 rounded-xl border-2 bg-oav-surface transition-colors',
        plugin.verified
          ? 'border-oav-success/40 hover:border-oav-success/70'
          : 'border-oav-border hover:border-oav-border/70',
      )}
      aria-label={`${plugin.name} plugin${plugin.verified ? ' (verified)' : ''}`}
    >
      {/* Header: icon + name + verified badge */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg bg-oav-accent/10 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Package className="w-5 h-5 text-oav-accent" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-oav-text truncate">{plugin.name}</h3>
            {plugin.verified && (
              <span
                className="flex items-center gap-0.5 text-xs text-oav-success font-medium"
                title="Verified plugin"
                aria-label="Verified"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-oav-muted truncate">{plugin.author}</p>
        </div>
        {/* Version tag */}
        <span className="shrink-0 text-xs font-mono bg-oav-bg border border-oav-border px-1.5 py-0.5 rounded text-oav-muted">
          v{plugin.version}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-oav-muted leading-relaxed line-clamp-2 flex-1">
        {plugin.description}
      </p>

      {/* Footer: download count + action */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 text-xs text-oav-muted">
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{plugin.downloads.toLocaleString()}</span>
        </div>

        {isInstalled ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-oav-success bg-oav-success/10 px-2 py-1 rounded-full">
              Installed
            </span>
            {onUninstall && (
              <button
                onClick={() => onUninstall(plugin.id)}
                className="text-xs text-oav-error hover:underline"
                aria-label={`Uninstall ${plugin.name}`}
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onInstall(plugin.id)}
            disabled={isInstalling}
            className={clsx(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
              'text-white bg-oav-accent hover:bg-oav-accent/80 disabled:opacity-50',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
            )}
            aria-label={`Install ${plugin.name}`}
          >
            {isInstalling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              : <Download className="w-3.5 h-3.5" aria-hidden="true" />
            }
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
        )}
      </div>
    </article>
  );
}
