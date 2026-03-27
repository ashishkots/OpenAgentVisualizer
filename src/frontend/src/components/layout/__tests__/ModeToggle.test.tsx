import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ModeToggle } from '../ModeToggle';
import { useModeStore } from '../../../stores/modeStore';

describe('ModeToggle', () => {
  it('toggles mode on click', () => {
    useModeStore.setState({ mode: 'gamified' });
    const { getByRole } = render(<ModeToggle />);
    fireEvent.click(getByRole('button'));
    expect(useModeStore.getState().mode).toBe('professional');
  });
});
