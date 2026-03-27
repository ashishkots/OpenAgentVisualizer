import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPBar } from '../XPBar';

describe('XPBar', () => {
  it('renders progress bar', () => {
    render(<XPBar xpTotal={500} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
  });

  it('shows 0% progress at level 1 with 0 XP', () => {
    render(<XPBar xpTotal={0} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows labels when showLabels=true', () => {
    render(<XPBar xpTotal={500} showLabels />);
    // Should show current XP
    expect(screen.getByText(/XP/)).toBeInTheDocument();
  });

  it('shows MAX label at level 10', () => {
    render(<XPBar xpTotal={29237} showLabels />);
    expect(screen.getByText('MAX')).toBeInTheDocument();
  });

  it('has aria-label', () => {
    render(<XPBar xpTotal={1000} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-label');
  });

  it('shows "Maximum level reached" for max level', () => {
    render(<XPBar xpTotal={99999} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-label', 'Maximum level reached');
  });
});
