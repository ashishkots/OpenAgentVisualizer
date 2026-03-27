import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../hooks/useOrganizations', () => ({
  useOrgs: () => ({
    data: [
      { id: 'org1', name: 'Acme Corp', slug: 'acme', plan: 'pro', logo_url: null, created_by: 'u1', created_at: '' },
      { id: 'org2', name: 'Beta Ltd', slug: 'beta', plan: 'free', logo_url: null, created_by: 'u1', created_at: '' },
    ],
    isLoading: false,
  }),
  useCreateOrg: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../stores/orgStore', () => ({
  useOrgStore: (selector: (s: { currentOrgId: string; setCurrentOrgId: () => void; getCurrentOrg: () => { name: string } | null; orgs: [] }) => unknown) =>
    selector({
      currentOrgId: 'org1',
      setCurrentOrgId: vi.fn(),
      getCurrentOrg: () => ({ name: 'Acme Corp' }),
      orgs: [],
    }),
}));

import { OrgSwitcher } from '../OrgSwitcher';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('OrgSwitcher', () => {
  it('renders current org name', () => {
    render(<Wrap><OrgSwitcher /></Wrap>);
    expect(screen.getByText('Acme Corp')).toBeTruthy();
  });

  it('opens dropdown on click', () => {
    render(<Wrap><OrgSwitcher /></Wrap>);
    fireEvent.click(screen.getByRole('button', { name: /switch organization/i }));
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('shows org list items and create option in dropdown', () => {
    render(<Wrap><OrgSwitcher /></Wrap>);
    fireEvent.click(screen.getByRole('button', { name: /switch organization/i }));
    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('Beta Ltd')).toBeTruthy();
    expect(screen.getByText(/create organization/i)).toBeTruthy();
  });
});
