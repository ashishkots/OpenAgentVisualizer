import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Bot } from 'lucide-react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    icon: Bot,
    title: 'No agents yet',
    description: 'Connect your first agent.',
    actionLabel: 'Connect now',
    onAction: vi.fn(),
  };

  it('renders title, description, and action label', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('No agents yet')).toBeTruthy();
    expect(screen.getByText('Connect your first agent.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connect now' })).toBeTruthy();
  });

  it('calls onAction when button is clicked', () => {
    const onAction = vi.fn();
    render(<EmptyState {...defaultProps} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect now' }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
