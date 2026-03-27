import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../hooks/useWebhooks', () => ({
  useCreateWebhook: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 'wh-new', secret: 'super-secret' }), isPending: false }),
  useUpdateWebhook: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}));

import { WebhookModal } from '../WebhookModal';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('WebhookModal — create mode', () => {
  it('renders create title and form fields', () => {
    render(<Wrap><WebhookModal onClose={vi.fn()} /></Wrap>);
    expect(screen.getByText('Create Webhook')).toBeTruthy();
    expect(screen.getByLabelText(/name/i)).toBeTruthy();
    expect(screen.getByLabelText(/endpoint url/i)).toBeTruthy();
  });

  it('renders all 8 event type checkboxes', () => {
    render(<Wrap><WebhookModal onClose={vi.fn()} /></Wrap>);
    expect(screen.getByText('Agent Created')).toBeTruthy();
    expect(screen.getByText('Agent Status Changed')).toBeTruthy();
    expect(screen.getByText('Task Completed')).toBeTruthy();
    expect(screen.getByText('Alert Triggered')).toBeTruthy();
    expect(screen.getByText('Achievement Unlocked')).toBeTruthy();
    expect(screen.getByText('Level Up')).toBeTruthy();
    expect(screen.getByText('Challenge Completed')).toBeTruthy();
    expect(screen.getByText('Tournament Finalized')).toBeTruthy();
  });

  it('submit button is disabled when form is empty', () => {
    render(<Wrap><WebhookModal onClose={vi.fn()} /></Wrap>);
    const submitBtn = screen.getByRole('button', { name: /create webhook/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<Wrap><WebhookModal onClose={onClose} /></Wrap>);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(<Wrap><WebhookModal onClose={onClose} /></Wrap>);
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('WebhookModal — edit mode', () => {
  const WEBHOOK = {
    id: 'wh-1',
    workspace_id: 'ws-1',
    name: 'My Hook',
    url: 'https://example.com/hook',
    events: ['agent.created' as const],
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  it('renders edit title with pre-filled values', () => {
    render(<Wrap><WebhookModal webhook={WEBHOOK} onClose={vi.fn()} /></Wrap>);
    expect(screen.getByText('Edit Webhook')).toBeTruthy();
    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('My Hook');
    expect((screen.getByLabelText(/endpoint url/i) as HTMLInputElement).value).toBe('https://example.com/hook');
  });
});
