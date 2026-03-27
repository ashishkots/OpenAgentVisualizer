// Sprint 7 — Plugin registry browse page

import { useState } from 'react';
import { Search, Loader2, PackageSearch } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { PluginCard } from '../components/platform/PluginCard';
import { usePluginRegistry, useInstalledPlugins, useInstallPlugin } from '../hooks/usePlugins';
import { useDebounce } from '../hooks/useDebounce';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Plugin Registry' },
];

export function PluginRegistryPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const { data: registryData, isLoading: registryLoading } = usePluginRegistry({
    search: debouncedSearch || undefined,
    page_size: 24,
  });

  const { data: installedPlugins = [] } = useInstalledPlugins();
  const installMutation = useInstallPlugin();

  const installedRegistryIds = new Set(
    installedPlugins.map((p) => p.name), // match by name since registry_id not on installed
  );

  const handleInstall = async (registryId: string) => {
    setInstallingId(registryId);
    try {
      await installMutation.mutateAsync({ registry_id: registryId });
    } finally {
      setInstallingId(null);
    }
  };

  const plugins = registryData?.items ?? [];

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6" data-testid="plugin-registry-page">
      <Breadcrumb items={BREADCRUMB} />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-oav-text">Browse Plugins</h1>
        <p className="text-sm text-oav-muted mt-1">
          Extend OpenAgentVisualizer with community and verified plugins.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-oav-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plugins..."
          className="w-full bg-oav-surface border border-oav-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-oav-text placeholder-oav-muted focus:outline-none focus:ring-2 focus:ring-oav-accent"
          aria-label="Search plugin registry"
        />
      </div>

      {/* Stats */}
      {registryData && (
        <p className="text-xs text-oav-muted" aria-live="polite" aria-atomic="true">
          {registryData.total} plugin{registryData.total !== 1 ? 's' : ''} available
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Grid */}
      {registryLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-oav-muted">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Loading plugins...</span>
        </div>
      ) : plugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-oav-muted">
          <PackageSearch className="w-10 h-10 opacity-40" aria-hidden="true" />
          <p className="text-sm">
            {search ? `No plugins found for "${search}"` : 'No plugins in the registry yet.'}
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          aria-label="Plugin registry"
        >
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              isInstalled={installedRegistryIds.has(plugin.name)}
              isInstalling={installingId === plugin.id}
              onInstall={handleInstall}
            />
          ))}
        </div>
      )}
    </div>
  );
}
