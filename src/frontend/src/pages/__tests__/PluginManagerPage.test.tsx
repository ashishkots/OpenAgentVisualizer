import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/usePlugins', () => ({
  useInstalledPlugins: () => ({
    data: [
      {
        id: 'plug-1',
        workspace_id: 'ws-1',
        name: 'Slack Notifier',
        description: 'Sends alerts to Slack.',
        version: '1.0.0',
        author: 'OAV Team',
        manifest: { name: 'slack-notifier', version: '1.0.0', author: 'OAV Team', description: '', permissions: [], hooks: [], routes: [] },
        status: 'installed',
        installed_by: 'user-1',
        installed_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'plug-2',
        workspace_id: 'ws-1',
        name: 'Agent Namer',
        description: 'Names agents automatically.',
        version: '0.1.0',
        author: 'Community',
        manifest: { name: 'agent-namer', version: '0.1.0', author: 'Community', description: '', permissions: [], hooks: [], routes: [] },
        status: 'disabled',
        installed_by: 'user-1',
        installed_at: '2026-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
  }),
  useEnablePlugin: () => ({ mutate: vi.fn(), isPending: false }),
  useDisablePlugin: () => ({ mutate: vi.fn(), isPending: false }),
  useUninstallPlugin: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { PluginManagerPage } from '../PluginManagerPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('PluginManagerPage', () => {
  it('renders page heading', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    expect(screen.getByText('Installed Plugins')).toBeTruthy();
  });

  it('renders installed plugins', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    expect(screen.getByText('Slack Notifier')).toBeTruthy();
    expect(screen.getByText('Agent Namer')).toBeTruthy();
  });

  it('shows active status badge for installed plugin', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows disabled status badge for disabled plugin', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    expect(screen.getByText('Disabled')).toBeTruthy();
  });

  it('renders enable/disable toggles', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    const toggles = screen.getAllByRole('switch');
    expect(toggles.length).toBe(2);
  });

  it('renders uninstall buttons', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    const uninstallBtns = screen.getAllByRole('button', { name: /uninstall/i });
    expect(uninstallBtns.length).toBe(2);
  });

  it('shows confirmation text on first uninstall click', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    const uninstallBtns = screen.getAllByRole('button', { name: /uninstall slack notifier/i });
    fireEvent.click(uninstallBtns[0]);
    expect(screen.getByRole('button', { name: /confirm uninstall slack notifier/i })).toBeTruthy();
  });

  it('has Browse Registry link', () => {
    render(<Wrap><PluginManagerPage /></Wrap>);
    expect(screen.getByRole('link', { name: /browse plugin registry/i })).toBeTruthy();
  });
});
