export const COLOR_TOKENS = {
  bg: '#0f1117',
  surface: '#1e2433',
  border: '#2d3748',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  purple: '#a855f7',
  // Sprint 2 additions
  gold: '#eab308',
  xp: '#06b6d4',
  surfaceHover: '#283040',
  surfaceActive: '#2a3650',
} as const;

export type ColorToken = keyof typeof COLOR_TOKENS;

// PixiJS integer equivalents
export const PIXI_COLORS = {
  bg: 0x0f1117,
  surface: 0x1e2433,
  border: 0x2d3748,
  text: 0xe2e8f0,
  muted: 0x94a3b8,
  accent: 0x3b82f6,
  success: 0x22c55e,
  warning: 0xf59e0b,
  error: 0xef4444,
  purple: 0xa855f7,
  gold: 0xeab308,
  xp: 0x06b6d4,
} as const;

// FSM state color map
export const FSM_STATE_COLORS: Record<string, string> = {
  idle:     COLOR_TOKENS.muted,
  active:   COLOR_TOKENS.success,
  waiting:  COLOR_TOKENS.warning,
  error:    COLOR_TOKENS.error,
  complete: COLOR_TOKENS.accent,
};

export const FSM_STATE_PIXI_COLORS: Record<string, number> = {
  idle:     PIXI_COLORS.muted,
  active:   PIXI_COLORS.success,
  waiting:  PIXI_COLORS.warning,
  error:    PIXI_COLORS.error,
  complete: PIXI_COLORS.accent,
};

// Level ring colors
export const LEVEL_RING_COLORS: Record<number, string> = {
  1:  COLOR_TOKENS.muted,
  2:  COLOR_TOKENS.accent,
  3:  COLOR_TOKENS.success,
  4:  COLOR_TOKENS.purple,
  5:  COLOR_TOKENS.gold,
  6:  COLOR_TOKENS.gold,
  7:  COLOR_TOKENS.gold,
  8:  COLOR_TOKENS.gold,
  9:  COLOR_TOKENS.gold,
  10: COLOR_TOKENS.gold,
};

export const LEVEL_RING_PIXI_COLORS: Record<number, number> = {
  1:  PIXI_COLORS.muted,
  2:  PIXI_COLORS.accent,
  3:  PIXI_COLORS.success,
  4:  PIXI_COLORS.purple,
  5:  PIXI_COLORS.gold,
  6:  PIXI_COLORS.gold,
  7:  PIXI_COLORS.gold,
  8:  PIXI_COLORS.gold,
  9:  PIXI_COLORS.gold,
  10: PIXI_COLORS.gold,
};

// Avatar fill hue palette (cycled by name hash)
export const AVATAR_HUES: string[] = [
  '#3b82f6', '#a855f7', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#eab308', '#94a3b8',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}
