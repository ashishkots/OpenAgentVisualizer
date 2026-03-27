import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useSessionReplay', () => ({
  useSessionReplay: () => ({ sessions: [], isLoading: false }),
}));
vi.mock('../../hooks/useWorkspace', () => ({
  useWorkspace: () => ({ data: null }),
}));

import { ReplayPage } from '../ReplayPage';
import { SettingsPage } from '../SettingsPage';
import { LoginPage } from '../LoginPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('Task 13 pages render without crash', () => {
  it('ReplayPage renders', () => {
    const { container } = render(<Wrap><ReplayPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
  it('SettingsPage renders', () => {
    const { container } = render(<Wrap><SettingsPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
  it('LoginPage renders', () => {
    const { container } = render(<Wrap><LoginPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
});
