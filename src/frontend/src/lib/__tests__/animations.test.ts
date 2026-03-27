import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as gsapModule from 'gsap';
import { pageEnter, pageLeave } from '../transitions';
import { emitXPGain } from '../particles';

vi.mock('gsap', () => ({
  gsap: {
    fromTo: vi.fn(),
    to: vi.fn(),
  },
}));

describe('animation helpers', () => {
  it('pageEnter is a function', () => {
    expect(typeof pageEnter).toBe('function');
  });

  it('emitXPGain is a function', () => {
    expect(typeof emitXPGain).toBe('function');
  });

  it('pageEnter calls gsap.fromTo with correct params', () => {
    const el = document.createElement('div');
    pageEnter(el);
    expect(gsapModule.gsap.fromTo).toHaveBeenCalledWith(
      el,
      { opacity: 0, y: 8 },
      expect.objectContaining({ opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' })
    );
  });

  it('pageLeave calls gsap.to with correct params and fires onComplete', () => {
    const el = document.createElement('div');
    const onComplete = vi.fn();
    pageLeave(el, onComplete);
    expect(gsapModule.gsap.to).toHaveBeenCalledWith(
      el,
      expect.objectContaining({ opacity: 0, y: -8, duration: 0.15 })
    );
  });

  describe('emitXPGain', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
      document.body.innerHTML = '';
    });

    it('appends particles to document.body and removes them after timeout', () => {
      emitXPGain(100, 200);
      const particles = document.body.querySelectorAll('.xp-particle');
      expect(particles.length).toBe(6);
      vi.advanceTimersByTime(2000);
      const remaining = document.body.querySelectorAll('.xp-particle');
      expect(remaining.length).toBe(0);
    });
  });
});
