import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import type { AgentStatus } from '../../../types/agent';

describe('StatusBadge', () => {
  const statuses: AgentStatus[] = ['idle', 'active', 'waiting', 'error', 'complete'];

  it.each(statuses)('renders badge for status "%s"', (status) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('shows "Active" label for active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows "Idle" label for idle status', () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('shows "Error" label for error status', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows "Complete" label for complete status', () => {
    render(<StatusBadge status="complete" />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('shows pulse dot for active status', () => {
    const { container } = render(<StatusBadge status="active" />);
    // Pulse dot is an aria-hidden span
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('has accessible aria-label', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByLabelText('Status: Active')).toBeInTheDocument();
  });
});
