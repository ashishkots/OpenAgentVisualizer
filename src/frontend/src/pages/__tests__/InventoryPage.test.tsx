import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryPage } from '../InventoryPage';
import type { InventoryItem } from '../../types/economy';

const mockInvItem: InventoryItem = {
  id: 'inv-1',
  workspace_id: 'ws-1',
  item_id: 'item-1',
  agent_id: null,
  equipped: false,
  acquired_at: '2026-03-27T00:00:00Z',
  item: {
    id: 'item-1',
    name: 'Golden Ring',
    description: 'A golden ring.',
    category: 'cosmetic',
    price: 200,
    icon: '💍',
    rarity: 'rare',
    effect_data: {},
    active: true,
    owned: true,
  },
};

const mockEquippedItem: InventoryItem = {
  ...mockInvItem,
  id: 'inv-2',
  agent_id: 'agent-1',
  equipped: true,
  item: { ...mockInvItem.item, id: 'item-2', name: 'Diamond Ring' },
};

vi.mock('../../hooks/useShop', () => ({
  useInventory: vi.fn(() => ({ data: [mockInvItem, mockEquippedItem], isLoading: false })),
  useEquipItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUnequipItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useShopItems: vi.fn(() => ({ data: [], isLoading: false })),
  useBuyItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('../../stores/agentStore', () => ({
  useAgentStore: vi.fn((selector: (s: { agents: Record<string, unknown> }) => unknown) =>
    selector({ agents: {} })
  ),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('InventoryPage', () => {
  it('renders page heading', () => {
    render(<InventoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('Inventory')).toBeTruthy();
  });

  it('shows item count', () => {
    render(<InventoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('2 items owned')).toBeTruthy();
  });

  it('renders category filter tabs', () => {
    render(<InventoryPage />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: 'All' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Cosmetics' })).toBeTruthy();
  });

  it('renders item cards', () => {
    render(<InventoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('Golden Ring')).toBeTruthy();
    expect(screen.getByText('Diamond Ring')).toBeTruthy();
  });

  it('shows equipped badge for equipped items', () => {
    render(<InventoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('Equipped')).toBeTruthy();
  });

  it('shows unequip button for equipped items', () => {
    render(<InventoryPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /unequip diamond ring/i })).toBeTruthy();
  });
});
