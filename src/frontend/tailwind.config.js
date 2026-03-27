export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core tokens (Sprint 2)
        'oav-bg': '#0f1117',
        'oav-surface': '#1e2433',
        'oav-border': '#2d3748',
        'oav-text': '#e2e8f0',
        'oav-muted': '#94a3b8',
        'oav-accent': '#3b82f6',
        'oav-success': '#22c55e',
        'oav-warning': '#f59e0b',
        'oav-error': '#ef4444',
        'oav-purple': '#a855f7',
        // Sprint 2 new tokens
        'oav-gold': '#eab308',
        'oav-xp': '#06b6d4',
        'oav-surface-hover': '#283040',
        'oav-surface-active': '#2a3650',
        // Sprint 3 new tokens
        'oav-trace': '#f472b6',
        'oav-mesh': '#34d399',
        'oav-knowledge': '#60a5fa',
        'oav-shield': '#fb923c',
        'oav-3d': '#818cf8',
        'oav-surface-elevated': '#232d3f',
      },
      keyframes: {
        // Sprint 2 keyframes
        'xp-gain': {
          '0%':   { opacity: '1', transform: 'translateY(0px) scale(1)' },
          '60%':  { opacity: '1', transform: 'translateY(-20px) scale(1.1)' },
          '100%': { opacity: '0', transform: 'translateY(-40px) scale(0.9)' },
        },
        'level-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.08)' },
        },
        'badge-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 transparent' },
          '50%':      { boxShadow: '0 0 12px 4px rgba(234, 179, 8, 0.25)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'alert-prepend': {
          from: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          to:   { backgroundColor: 'transparent' },
        },
        'edge-fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'status-ping': {
          '0%':   { transform: 'scale(1)', opacity: '1' },
          '70%':  { transform: 'scale(2)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.92)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'confetti-fall': {
          from: { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          to:   { transform: 'translateY(60px) rotate(180deg)', opacity: '0' },
        },
        'rank-highlight': {
          from: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          to:   { backgroundColor: 'transparent' },
        },
        'xp-flash': {
          '0%':   { opacity: '1', transform: 'translateY(0px)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        'badge-slide-in': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'screen-flash': {
          '0%':   { opacity: '0.3' },
          '100%': { opacity: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // Sprint 3 keyframes
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(100%)' },
        },
        'mesh-pulse': {
          '0%':   { boxShadow: '0 0 0 0 rgba(52, 211, 153, 0.4)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(52, 211, 153, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(52, 211, 153, 0)' },
        },
        'gauge-fill': {
          from: { strokeDashoffset: '251.3' },
          to:   { strokeDashoffset: 'var(--gauge-offset)' },
        },
        'grade-pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'ue5-progress': {
          from: { width: '0%' },
          to:   { width: '100%' },
        },
        'waterfall-expand': {
          from: { opacity: '0', transform: 'scaleY(0)', transformOrigin: 'top' },
          to:   { opacity: '1', transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        'knowledge-highlight': {
          '0%':   { filter: 'brightness(1)' },
          '50%':  { filter: 'brightness(1.3)' },
          '100%': { filter: 'brightness(1.15)' },
        },
      },
      animation: {
        // Sprint 2 animations
        'xp-gain':       'xp-gain 1.5s ease-out forwards',
        'level-pulse':   'level-pulse 1.5s ease-in-out infinite',
        'badge-glow':    'badge-glow 500ms ease-in-out',
        shimmer:         'shimmer 2s linear infinite',
        'alert-prepend': 'alert-prepend 2s ease-out forwards',
        'edge-fade-in':  'edge-fade-in 300ms ease-out',
        'status-ping':   'status-ping 1.2s ease-out infinite',
        'toast-in':      'toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'confetti-fall': 'confetti-fall 2s ease-in forwards',
        'rank-highlight':'rank-highlight 1500ms ease-out forwards',
        'xp-flash':      'xp-flash 1.5s ease-out forwards',
        'badge-slide-in':'badge-slide-in 0.4s ease-out forwards',
        'screen-flash':  'screen-flash 500ms ease-out forwards',
        'fade-in-up':    'fade-in-up 0.3s ease-out forwards',
        // Sprint 3 animations
        'slide-in-right': 'slide-in-right 300ms ease-out forwards',
        'slide-out-right':'slide-out-right 300ms ease-in forwards',
        'mesh-pulse':     'mesh-pulse 600ms ease-out',
        'gauge-fill':     'gauge-fill 1.2s ease-out forwards',
        'grade-pop':      'grade-pop 400ms ease-in-out',
        'waterfall-expand':'waterfall-expand 200ms ease-out forwards',
        'knowledge-highlight':'knowledge-highlight 500ms ease-in-out forwards',
      },
      zIndex: {
        '44': '44',
        '45': '45',
        '60': '60',
        '70': '70',
        '80': '80',
      },
      boxShadow: {
        'glow-gold-sm':  '0 0 12px rgba(234, 179, 8, 0.376)',
        'glow-gold-md':  '0 0 16px rgba(234, 179, 8, 0.502)',
        'glow-gold-lg':  '0 0 24px rgba(234, 179, 8, 0.627)',
        'glow-accent':   '0 0 12px rgba(59, 130, 246, 0.4)',
        'glow-error':    '0 0 12px rgba(239, 68, 68, 0.4)',
        'glow-mesh':     '0 0 12px rgba(52, 211, 153, 0.4)',
        'glow-3d':       '0 0 12px rgba(129, 140, 248, 0.4)',
      },
      transitionDuration: {
        '700': '700ms',
        '1500': '1500ms',
      },
    },
  },
  plugins: [],
};
