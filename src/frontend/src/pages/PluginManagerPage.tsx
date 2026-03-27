// Sprint 7 — Plugin manager page (installed plugins)

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Loader2,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  useInstalledPlugins,
  useEnablePlugin,
  useDisablePlugin,
  useUninstallPlugin,
} from '../hooks/usePlugins';
import type { Plugin, PluginStatus } from '../types/plugin';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Plugins' },
];

const STATUS_CONFIG: Record<
  PluginStatus,
  { label: string; className: string }
> = {
  installed: { label: 'Active',    className: 'bg-oav-success/15 text-oav-success' },
  disabled:  { label: 'Disabled',  className: 'bg-oav-border/60 text-oav-muted'   },
  error:     { label: 'Error',     className: 'bg-oav-error/15 text-oav-error'     },
};

function PluginRow({ plugin }: { plugin: Plugin }) {
  const enableMutation  = useEnablePlugin();
  const disableMutation = useDisablePlugin();
  const uninstallMutation = useUninstallPlugin();
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const isEnabled = plugin.status === 'installed';
  const isToggling = enableMutation.isPending || disableMutation.isPending;

  const handleToggle = () => {
    if (isEnabled) {
      disableMutation.mutate(plugin.id);
    } else {
      enableMutation.mutate(plugin.id);
    }
  };

  const handleUninstall = () => {
    if (!confirmUninstall) {
      setConfirmUninstall(true);
      setTimeout(() => setConfirmUninstall(false), 3000);
      return;
    }
    uninstallMutation.mutate(plugin.id);
  };

  const { label, className } = STATUS_CONFIG[plugin.status];

  return (
    <div className="flex items-start gap-4 px-4 py-4 border-b border-oav-border last:border-0">
      {/* Plugin icon */}
      <div
        className="w-9 h-9 rounded-lg bg-oav-accent/10 flex items-center justify-center shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <Package className="w-5 h-5 text-oav-accent" aria-hidden="true" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-oav-text">{plugin.name}</p>
          <span
            className={clsx(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              className,
            )}
            aria-label={`Status: ${label}`}
          >
            {plugin.status === 'error' && (
              <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            )}
            {label}
          </span>
          <span className="text-xs font-mono bg-oav-bg border border-oav-border px-1.5 py-0.5 rounded text-oav-muted">
            v{plugin.version}
          </span>
        </div>
        <p className="text-xs text-oav-muted mt-0.5">{plugin.author}</p>
        <p className="text-xs text-oav-muted mt-1 leading-relaxed line-clamp-2">
          {plugin.description}
        </p>
        <p className="text-xs text-oav-muted mt-1">
          Installed {new Date(plugin.installed_at).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 mt-1">
        {/* Enable / Disable toggle */}
        {plugin.status !== 'error' && (
          <button
            role="switch"
            aria-checked={isEnabled}
            aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${plugin.name}`}
            onClick={handleToggle}
            disabled={isToggling}
            className={clsx(
              'relative w-10 h-5 rounded-full transition-colors duration-200',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              'disabled:opacity-50',
              isEnabled ? 'bg-oav-accent' : 'bg-oav-border',
            )}
          >
            {isToggling ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" aria-hidden="true" />
              </span>
            ) : (
              <span
                className={clsx(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                  isEnabled ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            )}
          </button>
        )}

        {/* Uninstall */}
        <button
          onClick={handleUninstall}
          disabled={uninstallMutation.isPending}
          className={clsx(
            'flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 transition-colors',
            'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
            confirmUninstall
              ? 'bg-oav-error text-white hover:bg-oav-error/80'
              : 'text-oav-muted hover:text-oav-error border border-oav-border hover:border-oav-error/40',
            'disabled:opacity-50',
          )}
          aria-label={confirmUninstall ? `Confirm uninstall ${plugin.name}` : `Uninstall ${plugin.name}`}
        >
          {uninstallMutation.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          }
          {confirmUninstall ? 'Confirm' : 'Uninstall'}
        </button>
      </div>
    </div>
  );
}

export function PluginManagerPage() {
  const { data: plugins = [], isLoading } = useInstalledPlugins();

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6 max-w-3xl" data-testid="plugin-manager-page">
      <Breadcrumb items={BREADCRUMB} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-oav-text">Installed Plugins</h1>
          <p className="text-sm text-oav-muted mt-1">
            Manage plugins installed in this workspace.
          </p>
        </div>
        <Link
          to="/plugins/registry"
          className="flex items-center gap-1.5 text-sm text-oav-accent hover:underline shrink-0"
          aria-label="Browse plugin registry"
        >
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          Browse Registry
        </Link>
      </div>

      {/* Plugin list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : plugins.length === 0 ? (
        <div className="bg-oav-surface border border-oav-border rounded-xl p-10 flex flex-col items-center gap-3 text-center">
          <Package className="w-10 h-10 text-oav-muted opacity-40" aria-hidden="true" />
          <p className="text-sm text-oav-muted">No plugins installed yet.</p>
          <Link
            to="/plugins/registry"
            className="text-sm text-oav-accent hover:underline"
          >
            Browse the Plugin Registry
          </Link>
        </div>
      ) : (
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
          {/* Summary */}
          <div className="px-4 py-3 bg-oav-bg/50 border-b border-oav-border text-xs text-oav-muted">
            {plugins.length} plugin{plugins.length !== 1 ? 's' : ''} installed
            {' · '}
            {plugins.filter((p) => p.status === 'installed').length} active
            {plugins.some((p) => p.status === 'error') && (
              <span className="text-oav-error ml-1">
                · {plugins.filter((p) => p.status === 'error').length} error{plugins.filter((p) => p.status === 'error').length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {plugins.map((p) => (
            <PluginRow key={p.id} plugin={p} />
          ))}
        </div>
      )}
    </div>
  );
}
