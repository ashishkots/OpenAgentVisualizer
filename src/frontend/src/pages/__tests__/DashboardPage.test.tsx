import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useMetrics', () => ({
  useCosts: () => ({ data: null, isLoading: false }),
  useTokenUsage: () => ({ data: null, isLoading: false }),
}));
vi.mock('../../hooks/useAgents', () => ({
  useAgents: () => ({ data: { agents: [] }, isLoading: false, error: null }),
}));
vi.mock('../../hooks/useAlerts', () => ({
  useAlerts: () => ({ data: [], isLoading: false }),
}));

import { DashboardPage } from '../DashboardPage';
import { AlertsPage } from '../AlertsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('Page renders without crash', () => {
  it('DashboardPage renders', () => {
    const { container } = render(<Wrap><DashboardPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
  it('AlertsPage renders', () => {
    const { container } = render(<Wrap><AlertsPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
});
