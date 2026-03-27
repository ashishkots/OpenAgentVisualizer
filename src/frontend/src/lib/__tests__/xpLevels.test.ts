import { describe, it, expect } from 'vitest';
import { levelFromXP, xpProgress, getLevelName, isGoldLevel, XP_THRESHOLDS } from '../xpLevels';

// Sprint 2: 10-level system per PRD section 3.2 table.
// Thresholds must match backend: [0, 500, 1500, 3500, 7000, 12000, 20000, 35000, 60000, 100000]
describe('xpLevels (Sprint 2 — 10 levels)', () => {
  describe('levelFromXP', () => {
    it('returns level 1 at 0 XP', () => expect(levelFromXP(0)).toBe(1));
    it('returns level 1 at 499 XP', () => expect(levelFromXP(499)).toBe(1));
    it('returns level 2 at 500 XP', () => expect(levelFromXP(500)).toBe(2));
    it('returns level 2 at 1499 XP', () => expect(levelFromXP(1499)).toBe(2));
    it('returns level 3 at 1500 XP', () => expect(levelFromXP(1500)).toBe(3));
    it('returns level 5 at 7000 XP', () => expect(levelFromXP(7000)).toBe(5));
    it('returns level 10 at 100000 XP', () => expect(levelFromXP(100000)).toBe(10));
    it('caps at level 10 for very high XP', () => expect(levelFromXP(999999)).toBe(10));
  });

  describe('xpProgress', () => {
    it('returns correct name for level 1', () => expect(xpProgress(0).name).toBe('Novice'));
    it('returns correct name for level 2', () => expect(xpProgress(500).name).toBe('Apprentice'));
    it('returns correct name for level 5', () => expect(xpProgress(7000).name).toBe('Expert'));
    it('returns correct name for level 10', () => expect(xpProgress(100000).name).toBe('Transcendent'));
    it('progress is between 0 and 1', () => {
      const { progress } = xpProgress(750);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });
    it('progress is 1 at max level', () => {
      expect(xpProgress(100000).isMaxLevel).toBe(true);
      expect(xpProgress(100000).progress).toBe(1);
    });
    it('gold color for level 5+', () => {
      expect(xpProgress(7000).color).toBe('#eab308');
    });
    it('blue color for level 2', () => {
      expect(xpProgress(500).color).toBe('#3b82f6');
    });
  });

  describe('getLevelName', () => {
    it('returns Novice for level 1', () => expect(getLevelName(1)).toBe('Novice'));
    it('returns Grandmaster for level 7', () => expect(getLevelName(7)).toBe('Grandmaster'));
    it('clamps to level 10 for out-of-range', () => expect(getLevelName(99)).toBe('Transcendent'));
  });

  describe('isGoldLevel', () => {
    it('false for levels 1-4', () => {
      expect(isGoldLevel(1)).toBe(false);
      expect(isGoldLevel(4)).toBe(false);
    });
    it('true for levels 5+', () => {
      expect(isGoldLevel(5)).toBe(true);
      expect(isGoldLevel(10)).toBe(true);
    });
  });

  describe('XP_THRESHOLDS array', () => {
    it('has 10 entries', () => expect(XP_THRESHOLDS).toHaveLength(10));
    it('starts at 0', () => expect(XP_THRESHOLDS[0]).toBe(0));
    it('is strictly ascending', () => {
      for (let i = 1; i < XP_THRESHOLDS.length; i++) {
        expect(XP_THRESHOLDS[i]).toBeGreaterThan(XP_THRESHOLDS[i - 1]);
      }
    });
  });
});
