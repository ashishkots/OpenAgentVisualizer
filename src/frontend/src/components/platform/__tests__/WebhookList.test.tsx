import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../hooks/useWebhooks', () => ({
  useDeleteWebhook: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateWebhook: () => ({ mutate: vi.fn(), isPending: false }),
  useWebhookDeliveries: () => ({ data: [], isLoading: false, refetch: vi.fn(), isFetching: false }),
  useTestWebhook: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { WebhookList } from '../WebhookList';
import type { Webhook } from '../../../types/webhook';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

const WEBHOOK: Webhook = {
  id: 'wh-1',
  workspace_id: 'ws-1',
  name: 'Slack Alerts',
  url: 'https://hooks.slack.com/services/test',
  events: ['agent.created', 'alert.triggered'],
  active: true,
  created_at: '2026-01-01T00:00:00Z',
};

describe('WebhookList', () => {
  it('renders empty state when no webhooks', () => {
    render(<Wrap><WebhookList webhooks={[]} onEdit={vi.fn()} /></Wrap>);
    expect(screen.getByText(/no webhooks configured/i)).toBeTruthy();
  });

  it('renders webhook name and event count', () => {
    render(<Wrap><WebhookList webhooks={[WEBHOOK]} onEdit={vi.fn()} /></Wrap>);
    expect(screen.getByText('Slack Alerts')).toBeTruthy();
    expect(screen.getByText('2 events')).toBeTruthy();
  });

  it('renders active toggle switch', () => {
    render(<Wrap><WebhookList webhooks={[WEBHOOK]} onEdit={vi.fn()} /></Wrap>);
    const toggle = screen.getByRole('switch', { name: /deactivate webhook slack alerts/i });
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<Wrap><WebhookList webhooks={[WEBHOOK]} onEdit={onEdit} /></Wrap>);
    fireEvent.click(screen.getByRole('button', { name: /edit webhook slack alerts/i }));
    expect(onEdit).toHaveBeenCalledWith(WEBHOOK);
  });

  it('toggles delivery log on activity button click', () => {
    render(<Wrap><WebhookList webhooks={[WEBHOOK]} onEdit={vi.fn()} /></Wrap>);
    const activityBtn = screen.getByRole('button', { name: /show delivery log/i });
    fireEvent.click(activityBtn);
    expect(activityBtn.getAttribute('aria-expanded')).toBe('true');
  });
});
