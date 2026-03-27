import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../hooks/useWorkspace', () => ({
  useWorkspace: () => ({ data: { name: 'Test Workspace', api_key: 'test-key' }, isLoading: false }),
}));

import { SettingsPage } from '../SettingsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('SettingsPage', () => {
  it('renders CLI Plugins section in Integrations tab', () => {
    render(<Wrap><SettingsPage /></Wrap>);
    // Click the Integrations tab to activate it
    fireEvent.click(screen.getByText(/integrations/i));
    expect(screen.getByText('CLI Plugins')).toBeTruthy();
    expect(screen.getByText('Claude Code Plugin')).toBeTruthy();
    expect(screen.getByText('Codex Plugin')).toBeTruthy();
  });
});
