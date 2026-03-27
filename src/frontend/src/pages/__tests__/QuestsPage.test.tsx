import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuestsPage } from '../QuestsPage';
import { useQuestStore } from '../../stores/questStore';
import type { Quest } from '../../types/quest';

const mockDailyQuest: Quest = {
  id: 'q-1',
  workspace_id: 'ws-1',
  name: 'Daily Test Quest',
  description: 'A daily quest',
  type: 'daily',
  steps: [{ description: 'Do something', condition_type: 'tasks', condition_value: 1, completed: false }],
  xp_reward: 100,
  currency_reward: 10,
  icon: '✦',
  active: true,
  reset_hours: 24,
  created_at: '2026-03-27T00:00:00Z',
};

vi.mock('../../hooks/useQuests', () => ({
  useQuests: vi.fn(() => ({ data: [mockDailyQuest], isLoading: false })),
  useClaimQuest: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  })),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('QuestsPage', () => {
  beforeEach(() => {
    useQuestStore.setState({ activeTab: 'daily' });
  });

  it('renders page heading', () => {
    render(<QuestsPage />, { wrapper: Wrapper });
    expect(screen.getByText('Quests')).toBeTruthy();
  });

  it('renders tab bar with Daily, Weekly, Epic', () => {
    render(<QuestsPage />, { wrapper: Wrapper });
    expect(screen.getByRole('tab', { name: 'Daily' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Weekly' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Epic' })).toBeTruthy();
  });

  it('shows quest card from mocked data', () => {
    render(<QuestsPage />, { wrapper: Wrapper });
    expect(screen.getByText('Daily Test Quest')).toBeTruthy();
  });

  it('switches active tab on click', () => {
    render(<QuestsPage />, { wrapper: Wrapper });
    const weeklyTab = screen.getByRole('tab', { name: 'Weekly' });
    fireEvent.click(weeklyTab);
    expect(useQuestStore.getState().activeTab).toBe('weekly');
  });
});
