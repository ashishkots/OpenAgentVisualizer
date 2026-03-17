export const XP_THRESHOLDS = [0, 1000, 3000, 7500, 15000];
export const LEVEL_NAMES = ['Rookie', 'Pro', 'Expert', 'Master', 'Legend'];
export const LEVEL_COLORS = ['#94a3b8', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];

export function levelFromXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function xpProgress(xp: number): {
  level: number;
  name: string;
  color: string;
  progress: number;
} {
  const level = levelFromXP(xp);
  const idx = level - 1;
  const currentThreshold = XP_THRESHOLDS[idx] ?? 0;
  const nextThreshold = XP_THRESHOLDS[idx + 1] ?? Infinity;
  const progress =
    nextThreshold === Infinity ? 1 : (xp - currentThreshold) / (nextThreshold - currentThreshold);
  return {
    level,
    name: LEVEL_NAMES[idx] ?? 'Legend',
    color: LEVEL_COLORS[idx] ?? '#ef4444',
    progress,
  };
}
