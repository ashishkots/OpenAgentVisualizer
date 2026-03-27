import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AgentCard } from '../AgentCard';
import type { Agent } from '../../../types/agent';

const mockAgent: Agent = {
  id: 'agent-1',
  workspace_id: 'ws-1',
  name: 'TestBot',
  role: 'assistant',
  framework: 'langchain',
  avatar_id: 'av1',
  status: 'active',
  level: 3,
  xp_total: 2000,
  total_tokens: 5000,
  total_cost_usd: 0.05,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function renderCard(props: Partial<Parameters<typeof AgentCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <AgentCard agent={mockAgent} {...props} />
    </MemoryRouter>
  );
}

describe('AgentCard', () => {
  it('renders agent name', () => {
    renderCard();
    expect(screen.getByText('TestBot')).toBeInTheDocument();
  });

  it('renders framework', () => {
    renderCard();
    expect(screen.getByText('langchain')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderCard();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders XP progress bar', () => {
    renderCard();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderCard({ onClick });
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is keyboard accessible (Enter key)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderCard({ onClick });
    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has accessible aria-label', () => {
    renderCard();
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label');
  });

  it('shows aria-pressed when selected', () => {
    renderCard({ isSelected: true });
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows error style for error status', () => {
    renderCard({ agent: { ...mockAgent, status: 'error' } });
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
