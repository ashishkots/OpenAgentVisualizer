import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletBadge } from '../WalletBadge';
import { useEconomyStore } from '../../../stores/economyStore';

vi.mock('../../../hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    data: { id: 'w-1', workspace_id: 'ws-1', balance: 1250, created_at: '', recent_transactions: [] },
    isLoading: false,
  })),
}));

vi.mock('../WalletDropdown', () => ({
  WalletDropdown: () => <div data-testid="wallet-dropdown">Dropdown</div>,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('WalletBadge', () => {
  beforeEach(() => {
    useEconomyStore.setState({ isWalletDropdownOpen: false });
  });

  it('renders wallet balance', () => {
    render(<WalletBadge />, { wrapper: Wrapper });
    expect(screen.getByText('1,250')).toBeTruthy();
  });

  it('renders wallet button with accessible label', () => {
    render(<WalletBadge />, { wrapper: Wrapper });
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toContain('1,250');
  });

  it('toggles dropdown on click', () => {
    render(<WalletBadge />, { wrapper: Wrapper });
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(useEconomyStore.getState().isWalletDropdownOpen).toBe(true);
  });

  it('shows dropdown when open', () => {
    useEconomyStore.setState({ isWalletDropdownOpen: true });
    render(<WalletBadge />, { wrapper: Wrapper });
    expect(screen.getByTestId('wallet-dropdown')).toBeTruthy();
  });

  it('hides dropdown when closed', () => {
    render(<WalletBadge />, { wrapper: Wrapper });
    expect(screen.queryByTestId('wallet-dropdown')).toBeNull();
  });
});
