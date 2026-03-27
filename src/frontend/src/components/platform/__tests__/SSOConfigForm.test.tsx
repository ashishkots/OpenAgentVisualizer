import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../hooks/useSSO', () => ({
  useSSOConfig: () => ({ data: null, isLoading: false }),
  useUpdateSSOConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSSOConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTestSSO: () => ({ mutate: vi.fn(), isPending: false, data: null }),
}));

import { SSOConfigForm } from '../SSOConfigForm';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('SSOConfigForm', () => {
  it('renders provider type selector with SAML and OIDC options', () => {
    render(<Wrap><SSOConfigForm /></Wrap>);
    expect(screen.getByText('SAML 2.0')).toBeTruthy();
    expect(screen.getByText('OpenID Connect')).toBeTruthy();
  });

  it('shows SAML fields by default', () => {
    render(<Wrap><SSOConfigForm /></Wrap>);
    expect(screen.getByLabelText(/entity id/i)).toBeTruthy();
    expect(screen.getByLabelText(/sso url/i)).toBeTruthy();
    expect(screen.getByLabelText(/certificate/i)).toBeTruthy();
  });

  it('switches to OIDC fields when OIDC provider selected', () => {
    render(<Wrap><SSOConfigForm /></Wrap>);
    fireEvent.click(screen.getByText('OpenID Connect'));
    expect(screen.getByLabelText(/client id/i)).toBeTruthy();
    expect(screen.getByLabelText(/client secret/i)).toBeTruthy();
    expect(screen.getByLabelText(/issuer url/i)).toBeTruthy();
  });

  it('renders enable/disable toggle', () => {
    render(<Wrap><SSOConfigForm /></Wrap>);
    expect(screen.getByRole('switch', { name: /toggle sso/i })).toBeTruthy();
  });

  it('renders save and test buttons', () => {
    render(<Wrap><SSOConfigForm /></Wrap>);
    expect(screen.getByRole('button', { name: /save configuration/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /test connection/i })).toBeTruthy();
  });
});
