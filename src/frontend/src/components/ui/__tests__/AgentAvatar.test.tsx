import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentAvatar } from '../AgentAvatar';

describe('AgentAvatar', () => {
  it('renders initials from single-word name', () => {
    render(<AgentAvatar name="AlphaBot" level={1} />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders initials from two-word name', () => {
    render(<AgentAvatar name="Alpha Bot" level={1} />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('has accessible aria-label', () => {
    render(<AgentAvatar name="TestAgent" level={5} />);
    expect(screen.getByLabelText('Agent TestAgent, Level 5')).toBeInTheDocument();
  });

  it('renders status dot when status provided', () => {
    const { container } = render(
      <AgentAvatar name="TestAgent" level={1} status="active" />
    );
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('does not render status dot when status not provided', () => {
    const { container } = render(<AgentAvatar name="TestAgent" level={1} />);
    const absoluteSpans = container.querySelectorAll('.absolute');
    expect(absoluteSpans.length).toBe(0);
  });
});
