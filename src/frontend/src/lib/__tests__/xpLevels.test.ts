import { describe, it, expect } from 'vitest';
import { levelFromXP, xpProgress } from '../xpLevels';

describe('xpLevels', () => {
  it('level 1 at 0 XP', () => expect(levelFromXP(0)).toBe(1));
  it('level 2 at 500 XP', () => expect(levelFromXP(500)).toBe(2));
  it('level 3 at 1500 XP', () => expect(levelFromXP(1500)).toBe(3));
  it('level 6 at 15000 XP', () => expect(levelFromXP(15000)).toBe(6));
  it('returns level name "Rookie" at 0 XP', () => expect(xpProgress(0).name).toBe('Rookie'));
  it('returns level name "Pro" at 500 XP', () => expect(xpProgress(500).name).toBe('Pro'));
  it('returns pct 1 at max level (200000 XP)', () => expect(xpProgress(200000).pct).toBe(1));
  it('xpProgress returns current, required, pct fields', () => {
    const result = xpProgress(1000);
    // 1000 xp: level 2 (starts at 500), threshold 1500 next
    expect(result.level).toBe(2);
    expect(result.current).toBe(500);  // 1000 - 500
    expect(result.required).toBe(1000); // 1500 - 500
    expect(result.pct).toBeCloseTo(0.5);
  });
});
