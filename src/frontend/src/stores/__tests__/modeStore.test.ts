import { describe, it, expect, beforeEach } from 'vitest';
import { useModeStore } from '../modeStore';

describe('modeStore', () => {
  beforeEach(() => useModeStore.setState({ mode: 'gamified' }));

  it('defaults to gamified', () => {
    expect(useModeStore.getState().mode).toBe('gamified');
  });
  it('toggles to professional', () => {
    useModeStore.getState().setMode('professional');
    expect(useModeStore.getState().mode).toBe('professional');
  });
  it('applies data-mode attr to html element', () => {
    useModeStore.getState().setMode('professional');
    expect(document.documentElement.getAttribute('data-mode')).toBe('professional');
  });
});
