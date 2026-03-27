import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/usePlugins', () => ({
  usePluginRegistry: () => ({
    data: {
      items: [
        {
          id: 'reg-1',
          name: 'Slack Notifier',
          description: 'Sends alerts to Slack.',
          version: '1.0.0',
          author: 'OAV Team',
          manifest_url: '',
          download_url: '',
          verified: true,
          downloads: 2500,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'reg-2',
          name: 'Agent Namer',
          description: 'Names your agents.',
          version: '0.1.0',
          author: 'Community',
          manifest_url: '',
          download_url: '',
          verified: false,
          downloads: 200,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      page_size: 24,
    },
    isLoading: false,
  }),
  useInstalledPlugins: () => ({ data: [] }),
  useInstallPlugin: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../hooks/useDebounce', () => ({
  useDebounce: (v: string) => v,
}));

import { PluginRegistryPage } from '../PluginRegistryPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('PluginRegistryPage', () => {
  it('renders page heading', () => {
    render(<Wrap><PluginRegistryPage /></Wrap>);
    expect(screen.getByText('Browse Plugins')).toBeTruthy();
  });

  it('renders search input', () => {
    render(<Wrap><PluginRegistryPage /></Wrap>);
    expect(screen.getByRole('searchbox', { name: /search plugin registry/i })).toBeTruthy();
  });

  it('renders plugin cards from registry', () => {
    render(<Wrap><PluginRegistryPage /></Wrap>);
    expect(screen.getByText('Slack Notifier')).toBeTruthy();
    expect(screen.getByText('Agent Namer')).toBeTruthy();
  });

  it('shows total count', () => {
    render(<Wrap><PluginRegistryPage /></Wrap>);
    expect(screen.getByText(/2 plugins available/i)).toBeTruthy();
  });
});
