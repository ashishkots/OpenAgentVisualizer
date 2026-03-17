import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedCounter } from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  it('renders the value', async () => {
    render(<AnimatedCounter value={42} prefix="$" />);
    expect(screen.getByTestId('counter')).toBeTruthy();
  });
});
