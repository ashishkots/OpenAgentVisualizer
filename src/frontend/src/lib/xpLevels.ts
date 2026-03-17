export const XP_THRESHOLDS = [0, 500, 1500, 3500, 7500, 15000, 30000, 60000, 100000, 200000];

export const LEVEL_NAMES = [
  'Rookie',
  'Pro',
  'Expert',
  'Master',
  'Legend',
  'Elite',
  'Champion',
  'Grandmaster',
  'Mythic',
  'Transcendent',
];

export const LEVEL_COLORS = [
  '#94a3b8',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#06b6d4',
  '#fbbf24',
];

export function levelFromXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, XP_THRESHOLDS.length);
}

/** Returns level, current xp within this level, xp required for next level, pct progress,
 *  plus name/color/progress aliases for backward compatibility. */
export function xpProgress(xpTotal: number): {
  level: number;
  current: number;
  required: number;
  pct: number;
  /** alias for pct — kept for backward compatibility */
  progress: number;
  name: string;
  color: string;
} {
  const level = levelFromXP(xpTotal);
  const idx = level - 1;
  const currentThreshold = XP_THRESHOLDS[idx] ?? 0;
  const nextThreshold = XP_THRESHOLDS[idx + 1] ?? null;
  const current = xpTotal - currentThreshold;
  const required = nextThreshold !== null ? nextThreshold - currentThreshold : 0;
  const pct = required > 0 ? Math.min(1, current / required) : 1;
  return {
    level,
    current,
    required,
    pct,
    progress: pct,
    name: LEVEL_NAMES[idx] ?? 'Transcendent',
    color: LEVEL_COLORS[idx] ?? '#fbbf24',
  };
}
