import { describe, it, expect } from 'vitest';
import { levelFromXP, xpProgress } from '../xpLevels';

describe('xpLevels', () => {
  it('level 1 at 0 XP', () => expect(levelFromXP(0)).toBe(1));
  it('level 2 at 1000 XP', () => expect(levelFromXP(1000)).toBe(2));
  it('level 3 at 3000 XP', () => expect(levelFromXP(3000)).toBe(3));
  it('level 5 at 15000 XP', () => expect(levelFromXP(15000)).toBe(5));
  it('returns level name "Rookie" at 0 XP', () => expect(xpProgress(0).name).toBe('Rookie'));
  it('returns level name "Pro" at 1000 XP', () => expect(xpProgress(1000).name).toBe('Pro'));
  it('progress is 1 at max level', () => expect(xpProgress(15000).progress).toBe(1));
});
