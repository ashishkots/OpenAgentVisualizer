import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockSharedAgents = [
  {
    id: 'sa1',
    agent_id: 'a1',
    agent_name: 'Alpha Bot',
    agent_status: 'active',
    source_workspace_id: 'ws1',
    source_workspace_name: 'Main WS',
    target_workspace_id: 'ws2',
    target_workspace_name: 'Secondary WS',
    permissions: 'read' as const,
    shared_by: 'u1',
    created_at: new Date().toISOString(),
  },
];

vi.mock('../../hooks/useOrganizations', () => ({
  useSharedAgents: () => ({ data: mockSharedAgents, isLoading: false }),
  useRevokeShare: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { SharedAgentsPage } from '../SharedAgentsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('SharedAgentsPage', () => {
  it('renders page heading', () => {
    render(<Wrap><SharedAgentsPage /></Wrap>);
    expect(screen.getByText('Shared Agents')).toBeTruthy();
  });

  it('renders shared agent name', () => {
    render(<Wrap><SharedAgentsPage /></Wrap>);
    expect(screen.getByText('Alpha Bot')).toBeTruthy();
  });

  it('renders permissions badge', () => {
    render(<Wrap><SharedAgentsPage /></Wrap>);
    expect(screen.getByText('Read')).toBeTruthy();
  });

  it('renders share agent button', () => {
    render(<Wrap><SharedAgentsPage /></Wrap>);
    expect(screen.getByRole('button', { name: /share an agent/i })).toBeTruthy();
  });
});
