// Sprint 2: 10-level system per PRD
// Formula: required_xp(level) = round(500 * (level - 1) ^ 1.8)
// Level 1 threshold is 0 (starting level)

export const LEVEL_COUNT = 10;

export const LEVEL_NAMES: Record<number, string> = {
  1:  'Novice',
  2:  'Apprentice',
  3:  'Operative',
  4:  'Specialist',
  5:  'Expert',
  6:  'Master',
  7:  'Grandmaster',
  8:  'Legend',
  9:  'Mythic',
  10: 'Transcendent',
};

// Thresholds per PRD section 3.2 table — must match backend LEVEL_THRESHOLDS exactly.
// Backend source: src/backend/app/services/gamification_service.py
export const XP_THRESHOLDS: number[] = [
  0,       // Level 1  — Novice
  500,     // Level 2  — Apprentice
  1_500,   // Level 3  — Operative
  3_500,   // Level 4  — Specialist
  7_000,   // Level 5  — Expert
  12_000,  // Level 6  — Master
  20_000,  // Level 7  — Grandmaster
  35_000,  // Level 8  — Legend
  60_000,  // Level 9  — Mythic
  100_000, // Level 10 — Transcendent
];

export const LEVEL_COLORS: Record<number, string> = {
  1:  '#94a3b8',
  2:  '#3b82f6',
  3:  '#22c55e',
  4:  '#a855f7',
  5:  '#eab308',
  6:  '#eab308',
  7:  '#eab308',
  8:  '#eab308',
  9:  '#eab308',
  10: '#eab308',
};

export function levelFromXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, LEVEL_COUNT);
}

export interface XPProgress {
  level: number;
  name: string;
  color: string;
  progress: number;
  currentXP: number;
  nextLevelXP: number;
  isMaxLevel: boolean;
}

export function xpProgress(xp: number): XPProgress {
  const level = levelFromXP(xp);
  const idx = level - 1;
  const currentThreshold = XP_THRESHOLDS[idx] ?? 0;
  const nextThreshold = XP_THRESHOLDS[idx + 1];
  const isMaxLevel = level >= LEVEL_COUNT;
  const progress = isMaxLevel
    ? 1
    : nextThreshold !== undefined
      ? (xp - currentThreshold) / (nextThreshold - currentThreshold)
      : 1;

  return {
    level,
    name: LEVEL_NAMES[level] ?? 'Transcendent',
    color: LEVEL_COLORS[level] ?? '#eab308',
    progress: Math.min(Math.max(progress, 0), 1),
    currentXP: xp - currentThreshold,
    nextLevelXP: isMaxLevel ? 0 : (nextThreshold ?? 0) - currentThreshold,
    isMaxLevel,
  };
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.max(1, Math.min(level, LEVEL_COUNT))] ?? 'Novice';
}

export function getLevelColor(level: number): string {
  return LEVEL_COLORS[Math.max(1, Math.min(level, LEVEL_COUNT))] ?? '#94a3b8';
}

export function isGoldLevel(level: number): boolean {
  return level >= 5;
}
