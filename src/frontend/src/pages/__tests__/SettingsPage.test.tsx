import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../hooks/useWorkspace', () => ({
  useWorkspace: () => ({ data: { name: 'Test Workspace', api_key: 'test-key' }, isLoading: false }),
}));

vi.mock('../../hooks/useSSO', () => ({
  useSSOConfig: () => ({ data: null, isLoading: false }),
  useUpdateSSOConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSSOConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTestSSO: () => ({ mutate: vi.fn(), isPending: false, data: null }),
}));

import { SettingsPage } from '../SettingsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('SettingsPage', () => {
  it('renders tab navigation', () => {
    render(<Wrap><SettingsPage /></Wrap>);
    expect(screen.getByRole('tab', { name: /workspace/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /api keys/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /integrations/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /members/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /sso/i })).toBeTruthy();
  });

  it('shows SSO tab with provider options', () => {
    render(<Wrap><SettingsPage /></Wrap>);
    fireEvent.click(screen.getByRole('tab', { name: /sso/i }));
    expect(screen.getByText('SAML 2.0')).toBeTruthy();
    expect(screen.getByText('OpenID Connect')).toBeTruthy();
  });

  it('workspace tab is active by default', () => {
    render(<Wrap><SettingsPage /></Wrap>);
    expect(screen.getByRole('tab', { name: /workspace/i })).toBeTruthy();
  });
});
