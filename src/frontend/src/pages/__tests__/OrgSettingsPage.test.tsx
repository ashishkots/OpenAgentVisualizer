import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockOrg = {
  id: 'org1',
  name: 'Acme Corp',
  slug: 'acme',
  plan: 'pro',
  logo_url: null,
  created_by: 'u1',
  created_at: new Date().toISOString(),
};

const mockMembers = [
  { id: 'm1', org_id: 'org1', user_id: 'u1', email: 'owner@acme.com', name: 'Owner User', role: 'owner', joined_at: new Date().toISOString() },
  { id: 'm2', org_id: 'org1', user_id: 'u2', email: 'dev@acme.com',   name: 'Dev User',   role: 'member', joined_at: new Date().toISOString() },
];

vi.mock('../../hooks/useOrganizations', () => ({
  useOrg: () => ({ data: mockOrg, isLoading: false }),
  useOrgMembers: () => ({ data: mockMembers, isLoading: false }),
  useOrgWorkspaces: () => ({ data: [], isLoading: false }),
  useUpdateOrg: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddOrgMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveOrgMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../stores/orgStore', () => ({
  useOrgStore: (selector: (s: { currentOrgId: string }) => unknown) =>
    selector({ currentOrgId: 'org1' }),
}));

import { OrgSettingsPage } from '../OrgSettingsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('OrgSettingsPage', () => {
  it('renders page heading', () => {
    render(<Wrap><OrgSettingsPage /></Wrap>);
    expect(screen.getByText('Organization Settings')).toBeTruthy();
  });

  it('renders org name in input', () => {
    render(<Wrap><OrgSettingsPage /></Wrap>);
    const input = screen.getByLabelText(/organization name/i) as HTMLInputElement;
    expect(input.value).toBe('Acme Corp');
  });

  it('renders plan badge', () => {
    render(<Wrap><OrgSettingsPage /></Wrap>);
    expect(screen.getByText('pro')).toBeTruthy();
  });

  it('renders member list', () => {
    render(<Wrap><OrgSettingsPage /></Wrap>);
    expect(screen.getByText('Owner User')).toBeTruthy();
    expect(screen.getByText('Dev User')).toBeTruthy();
  });

  it('renders member role badges', () => {
    render(<Wrap><OrgSettingsPage /></Wrap>);
    expect(screen.getByText('Owner')).toBeTruthy();
    expect(screen.getByText('Member')).toBeTruthy();
  });

  it('renders invite form', () => {
    render(<Wrap><OrgSettingsPage /></Wrap>);
    expect(screen.getByPlaceholderText(/colleague@company.com/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /invite member/i })).toBeTruthy();
  });
});
