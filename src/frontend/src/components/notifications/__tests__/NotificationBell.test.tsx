import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from '../NotificationBell';
import { useApiNotificationStore } from '../../../stores/notificationStore';

// Stub the useUnreadCount hook so it doesn't fire real network requests
vi.mock('../../../hooks/useNotifications', () => ({
  useUnreadCount: vi.fn(() => ({ data: 0 })),
  useNotifications: vi.fn(() => ({ isLoading: false, data: [] })),
  useMarkAllRead: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useMarkRead: vi.fn(() => ({ mutate: vi.fn() })),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    useApiNotificationStore.setState({
      apiNotifications: [],
      apiUnreadCount: 0,
      isDropdownOpen: false,
    });
  });

  it('renders bell button', () => {
    render(<NotificationBell />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /notifications/i })).toBeTruthy();
  });

  it('shows unread badge when count > 0', () => {
    useApiNotificationStore.setState({ apiUnreadCount: 5 });
    render(<NotificationBell />, { wrapper: Wrapper });
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('shows 99+ when count exceeds 99', () => {
    useApiNotificationStore.setState({ apiUnreadCount: 150 });
    render(<NotificationBell />, { wrapper: Wrapper });
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('toggles dropdown on click', () => {
    render(<NotificationBell />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(btn);
    expect(useApiNotificationStore.getState().isDropdownOpen).toBe(true);
  });
});
