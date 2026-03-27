import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopPage } from '../ShopPage';
import { useEconomyStore } from '../../stores/economyStore';
import type { ShopItem } from '../../types/economy';

const mockItem: ShopItem = {
  id: 'item-1',
  name: 'Golden Ring',
  description: 'A shiny golden ring.',
  category: 'cosmetic',
  price: 200,
  icon: '💍',
  rarity: 'rare',
  effect_data: {},
  active: true,
  owned: false,
};

const mockOwnedItem: ShopItem = {
  ...mockItem,
  id: 'item-2',
  name: 'Diamond Ring',
  owned: true,
};

vi.mock('../../hooks/useShop', () => ({
  useShopItems: vi.fn(() => ({ data: [mockItem, mockOwnedItem], isLoading: false })),
  useBuyItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useInventory: vi.fn(() => ({ data: [], isLoading: false })),
  useEquipItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUnequipItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('../../hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    data: { id: 'w-1', workspace_id: 'ws-1', balance: 500, created_at: '', recent_transactions: [] },
    isLoading: false,
  })),
  useTransactions: vi.fn(() => ({ data: [], isLoading: false })),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ShopPage', () => {
  beforeEach(() => {
    useEconomyStore.setState({ shopCategory: 'all' });
  });

  it('renders page heading', () => {
    render(<ShopPage />, { wrapper: Wrapper });
    expect(screen.getByText('Shop')).toBeTruthy();
  });

  it('renders category tabs', () => {
    render(<ShopPage />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: 'All' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Cosmetics' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Boosts' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Titles' })).toBeTruthy();
  });

  it('renders item cards', () => {
    render(<ShopPage />, { wrapper: Wrapper });
    expect(screen.getByText('Golden Ring')).toBeTruthy();
    expect(screen.getByText('Diamond Ring')).toBeTruthy();
  });

  it('shows "Owned" for owned items instead of Buy button', () => {
    render(<ShopPage />, { wrapper: Wrapper });
    expect(screen.getByText('Owned')).toBeTruthy();
  });

  it('shows wallet balance', () => {
    render(<ShopPage />, { wrapper: Wrapper });
    expect(screen.getByText('500 tokens')).toBeTruthy();
  });

  it('opens buy modal on Buy click', () => {
    render(<ShopPage />, { wrapper: Wrapper });
    const buyBtn = screen.getByRole('button', { name: /buy golden ring/i });
    fireEvent.click(buyBtn);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('switches category filter', () => {
    render(<ShopPage />, { wrapper: Wrapper });
    const cosmeticsTab = screen.getByRole('tab', { name: 'Cosmetics' });
    fireEvent.click(cosmeticsTab);
    expect(useEconomyStore.getState().shopCategory).toBe('cosmetic');
  });
});
