import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockAnalytics = {
  total_agents: 42,
  total_events: 1500,
  total_xp: 9800,
  active_workspaces: 3,
  workspace_breakdown: [
    { workspace_id: 'ws1', workspace_name: 'Main', agents: 20, events: 800, xp: 5000 },
    { workspace_id: 'ws2', workspace_name: 'Dev',  agents: 22, events: 700, xp: 4800 },
  ],
};

vi.mock('../../hooks/useOrganizations', () => ({
  useOrgAnalytics: () => ({ data: mockAnalytics, isLoading: false, isError: false }),
}));

vi.mock('../../stores/orgStore', () => ({
  useOrgStore: (selector: (s: { currentOrgId: string }) => unknown) =>
    selector({ currentOrgId: 'org1' }),
}));

import { OrgAnalyticsPage } from '../OrgAnalyticsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('OrgAnalyticsPage', () => {
  it('renders page heading', () => {
    render(<Wrap><OrgAnalyticsPage /></Wrap>);
    expect(screen.getByText('Organization Analytics')).toBeTruthy();
  });

  it('renders total agents stat card', () => {
    render(<Wrap><OrgAnalyticsPage /></Wrap>);
    expect(screen.getByText('Total Agents')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders total events stat card', () => {
    render(<Wrap><OrgAnalyticsPage /></Wrap>);
    expect(screen.getByText('Total Events')).toBeTruthy();
    expect(screen.getByText('1,500')).toBeTruthy();
  });

  it('renders active workspaces stat card', () => {
    render(<Wrap><OrgAnalyticsPage /></Wrap>);
    expect(screen.getByText('Active Workspaces')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });
});
