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
} as const;

export type ColorToken = keyof typeof COLOR_TOKENS;
