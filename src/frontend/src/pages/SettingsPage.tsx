import { useState } from 'react';
import { ModeToggle } from '../components/layout/ModeToggle';
import { SectionHeader } from '../components/layout/SectionHeader';
import { IntegrationCard } from '../components/integrations/IntegrationCard';
import { PluginCard } from '../components/integrations/PluginCard';
import { useWorkspace } from '../hooks/useWorkspace';
import type { IntegrationConfig } from '../types/integration';

type Tab = 'general' | 'workspace' | 'integrations' | 'api-keys' | 'appearance' | 'danger';

const PLUGIN_CARDS = [
  { name: 'Claude Code Plugin', active: false, commands: ['/oav-status','/oav-agents','/oav-alerts','/oav-cost','/oav-replay','/oav-debug'], installCommand: 'oav install claude-code-plugin' },
  { name: 'Codex Plugin', active: false, commands: ['/oav status','/oav agents','/oav alerts','/oav cost','/oav watch'], installCommand: 'oav install codex-plugin' },
];

const INTEGRATIONS: IntegrationConfig[] = [
  { id: 'langchain', name: 'LangChain', type: 'sdk', status: 'not_configured', last_event_at: null, event_count_24h: 0, install_command: 'pip install oav-langchain' },
  { id: 'openai', name: 'OpenAI SDK', type: 'sdk', status: 'not_configured', last_event_at: null, event_count_24h: 0, install_command: 'pip install oav-openai' },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const { data: ws } = useWorkspace();
  const TABS: Tab[] = ['general','workspace','integrations','api-keys','appearance','danger'];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Settings" />
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--oav-border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'text-oav-accent border-oav-accent' : 'text-oav-muted border-transparent hover:text-oav-text'}`}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
            <p className="text-oav-text font-medium text-sm mb-1">Workspace</p>
            <p className="text-oav-muted text-xs">{ws?.name ?? '…'}</p>
          </div>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 flex items-center justify-between" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
            <div>
              <p className="text-oav-text text-sm font-medium">Display Mode</p>
              <p className="text-oav-muted text-xs">Professional or Gamified</p>
            </div>
            <ModeToggle />
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="space-y-6">
          <div>
            <p className="text-oav-muted text-xs uppercase font-semibold mb-3">SDK Integrations</p>
            <div className="grid gap-4">
              {INTEGRATIONS.map(cfg => <IntegrationCard key={cfg.id} config={cfg} />)}
            </div>
          </div>
          <div>
            <p className="text-oav-muted text-xs uppercase font-semibold mb-3">CLI Plugins</p>
            <div className="grid gap-4">
              {PLUGIN_CARDS.map(p => <PluginCard key={p.name} {...p} />)}
            </div>
          </div>
        </div>
      )}

      {tab === 'api-keys' && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
          <p className="text-oav-text text-sm font-medium">API Key</p>
          <p className="text-oav-muted text-xs mt-1 font-mono">{ws?.api_key ?? '…'}</p>
        </div>
      )}

      {(tab === 'workspace' || tab === 'danger') && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
          <p className="text-oav-muted text-sm">Coming soon</p>
        </div>
      )}
    </div>
  );
}
