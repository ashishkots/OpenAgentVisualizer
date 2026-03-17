import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassCard } from '../GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>hello</GlassCard>);
    expect(screen.getByText('hello')).toBeTruthy();
  });
  it('accepts className override', () => {
    const { container } = render(<GlassCard className="p-8">x</GlassCard>);
    expect(container.firstChild).toHaveClass('p-8');
  });
});
