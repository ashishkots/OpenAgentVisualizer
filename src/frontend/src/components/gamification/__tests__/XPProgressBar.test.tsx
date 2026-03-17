import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPProgressBar } from '../XPProgressBar';

describe('XPProgressBar', () => {
  it('shows "Rookie" at 0 XP', () => {
    render(<XPProgressBar xpTotal={0} />);
    expect(screen.getByText('Rookie')).toBeTruthy();
  });

  it('shows "Pro" at 500 XP', () => {
    render(<XPProgressBar xpTotal={500} />);
    expect(screen.getByText('Pro')).toBeTruthy();
  });

  it('shows "Elite" at 15000 XP', () => {
    render(<XPProgressBar xpTotal={15000} />);
    expect(screen.getByText('Elite')).toBeTruthy();
  });

  it('shows level number', () => {
    render(<XPProgressBar xpTotal={0} />);
    expect(screen.getByText('Lv 1')).toBeTruthy();
  });
});
