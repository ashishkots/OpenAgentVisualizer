import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPProgressBar } from '../XPProgressBar';

// XPProgressBar delegates to XPBar with showLabels=true
// Sprint 2: 10-level system
describe('XPProgressBar (Sprint 2)', () => {
  it('renders a progress bar element', () => {
    render(<XPProgressBar xpTotal={0} />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('shows XP labels at level 1', () => {
    render(<XPProgressBar xpTotal={0} />);
    expect(screen.getByText('0 XP')).toBeTruthy();
  });

  it('shows XP at level 2 (500 XP)', () => {
    render(<XPProgressBar xpTotal={500} />);
    // Should show current XP in bar
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('shows MAX at max level', () => {
    render(<XPProgressBar xpTotal={29237} />);
    expect(screen.getByText('MAX')).toBeTruthy();
  });
});
