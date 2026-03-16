# OpenAgentVisualizer -- Frontend Implementation Plan

**Stage:** 5.1 -- Frontend Expert
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** Frontend Expert Agent
**Depends On:** System Architecture (4.1), Design System Spec (3.3), UI Design System (3.1), UX Design Spec (2.1), Visualization Spec (2.2), Animation Spec (2.3)
**Feeds Into:** Code Reviewer (5.3), QA Engineer (5.4), DevOps (Convergence)

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [State Management Architecture](#3-state-management-architecture)
4. [PixiJS Virtual World Implementation](#4-pixijs-virtual-world-implementation)
5. [Rive Animation Integration](#5-rive-animation-integration)
6. [Component Implementation Plan](#6-component-implementation-plan)
7. [Routing & Navigation](#7-routing--navigation)
8. [Real-Time Data Layer](#8-real-time-data-layer)
9. [Chart & Dashboard Implementation](#9-chart--dashboard-implementation)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. Project Setup

### 1.1 Vite + React 18 + TypeScript Configuration

Initialize the project with Vite using the React TypeScript template:

```bash
npm create vite@latest openagentvisualizer-frontend -- --template react-ts
cd openagentvisualizer-frontend
```

#### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@types': path.resolve(__dirname, './src/types'),
      '@machines': path.resolve(__dirname, './src/machines'),
      '@canvas': path.resolve(__dirname, './src/canvas'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8001',
        ws: true,
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand', 'xstate', '@xstate/react', '@tanstack/react-query'],
          'vendor-pixi': ['pixi.js', '@pixi/react'],
          'vendor-rive': ['@rive-app/react-canvas'],
          'vendor-charts': ['recharts'],
          'vendor-echarts': ['echarts', 'echarts-for-react'],
          'vendor-gsap': ['gsap'],
          'vendor-reactflow': ['@xyflow/react'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ['pixi.js', '@pixi/react', '@rive-app/react-canvas'],
  },
});
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@stores/*": ["./src/stores/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@lib/*": ["./src/lib/*"],
      "@assets/*": ["./src/assets/*"],
      "@types/*": ["./src/types/*"],
      "@machines/*": ["./src/machines/*"],
      "@canvas/*": ["./src/canvas/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 1.2 Package Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "zustand": "^4.5.2",
    "xstate": "^5.13.0",
    "@xstate/react": "^4.1.1",
    "@tanstack/react-query": "^5.45.0",
    "pixi.js": "^8.1.0",
    "@pixi/react": "^8.0.0",
    "@rive-app/react-canvas": "^4.9.0",
    "recharts": "^2.12.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "@xyflow/react": "^12.0.0",
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.0",
    "tailwindcss": "^3.4.4",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.6.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.395.0",
    "react-hot-toast": "^2.4.1",
    "react-error-boundary": "^4.0.13",
    "@floating-ui/react": "^0.26.16",
    "framer-motion": "^11.2.10",
    "immer": "^10.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.7.0",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vitest": "^1.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^24.1.0",
    "msw": "^2.3.1",
    "eslint": "^9.5.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.7",
    "@typescript-eslint/eslint-plugin": "^7.13.0",
    "@typescript-eslint/parser": "^7.13.0",
    "prettier": "^3.3.2",
    "prettier-plugin-tailwindcss": "^0.6.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "@storybook/react-vite": "^8.1.10",
    "@storybook/addon-essentials": "^8.1.10",
    "@storybook/blocks": "^8.1.10"
  }
}
```

### 1.3 ESLint Configuration

#### `eslint.config.js`

```javascript
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
```

### 1.4 Prettier Configuration

#### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 1.5 Tailwind Configuration

#### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC',
          400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA',
          800: '#3730A3', 900: '#312E81',
        },
        secondary: {
          50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4',
          400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E',
        },
        accent: {
          50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74',
          400: '#FB923C', 500: '#F97316', 600: '#EA580C', 700: '#C2410C',
        },
        surface: {
          base: '#0F1117',
          raised: '#161B26',
          overlay: '#1C2233',
          sunken: '#0A0D14',
          modal: '#1F2740',
          tooltip: '#252D3F',
        },
        border: {
          default: '#2A3246',
          subtle: '#1E2536',
          strong: '#3D4760',
        },
        oav: {
          'text-primary': '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-tertiary': '#64748B',
          'text-inverse': '#0F172A',
          'xp-gold': '#FFD700',
          'xp-gold-dim': '#B8960F',
          'level-purple': '#A855F7',
          'streak-flame': '#FF6B35',
          'quest-teal': '#2DD4BF',
        },
        state: {
          idle: '#6B7280',
          initializing: '#60A5FA',
          thinking: '#818CF8',
          executing: '#34D399',
          communicating: '#60A5FA',
          waiting: '#FBBF24',
          error: '#EF4444',
          recovering: '#F59E0B',
          complete: '#22C55E',
          terminated: '#374151',
          sleeping: '#4B5563',
          overloaded: '#FB923C',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '3rem' }],
      },
      borderRadius: {
        sharp: '2px',
        DEFAULT: '6px',
        rounded: '12px',
        pill: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 12px rgba(99, 102, 241, 0.4)',
        'glow-success': '0 0 12px rgba(34, 197, 94, 0.4)',
        'glow-error': '0 0 12px rgba(239, 68, 68, 0.5)',
        'glow-warning': '0 0 12px rgba(245, 158, 11, 0.4)',
        'glow-xp': '0 0 16px rgba(255, 215, 0, 0.5)',
        'glow-achievement': '0 0 20px rgba(168, 85, 247, 0.5)',
      },
      zIndex: {
        base: '0',
        raised: '10',
        dropdown: '100',
        sticky: '200',
        modal: '300',
        toast: '400',
        tooltip: '500',
        celebration: '600',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        'sidebar-collapsed': '64px',
        'sidebar-expanded': '240px',
        'header': '56px',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
```

### 1.6 PostCSS Configuration

#### `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 1.7 Global CSS Base

#### `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --oav-duration-instant: 0ms;
    --oav-duration-fast: 100ms;
    --oav-duration-normal: 200ms;
    --oav-duration-moderate: 300ms;
    --oav-duration-slow: 500ms;
    --oav-duration-slower: 800ms;
    --oav-duration-slowest: 1500ms;
  }

  * {
    @apply border-border-default;
  }

  body {
    @apply bg-surface-base text-oav-text-primary font-sans antialiased;
    font-variant-numeric: tabular-nums;
  }

  /* Scrollbar styling for dark theme */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }
  ::-webkit-scrollbar-track {
    @apply bg-surface-base;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-border-strong rounded-pill;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-oav-text-tertiary;
  }
}

@layer components {
  .skeleton {
    @apply bg-gradient-to-r from-surface-overlay via-surface-modal to-surface-overlay bg-[length:200%_100%] animate-shimmer rounded;
  }
}

@layer utilities {
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
  .glow-primary {
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
  }
  .glow-success {
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
  }
  .glow-error {
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
  }
}
```

---

## 2. Folder Structure

```
src/
├── main.tsx                          # React root mount, providers setup
├── App.tsx                           # Root component with providers
├── index.css                         # Global styles, Tailwind imports, CSS tokens
├── vite-env.d.ts                     # Vite type declarations
│
├── assets/
│   ├── rive/
│   │   ├── agents/
│   │   │   ├── agent_starter.riv     # Tier 1 avatar (levels 1-5)
│   │   │   ├── agent_standard.riv    # Tier 2 avatar (levels 6-14)
│   │   │   ├── agent_advanced.riv    # Tier 3 avatar (levels 15-24)
│   │   │   ├── agent_elite.riv       # Tier 4 avatar (levels 25-34)
│   │   │   ├── agent_master.riv      # Tier 5 avatar (levels 35-44)
│   │   │   └── agent_legendary.riv   # Tier 6 avatar (levels 45-50)
│   │   ├── effects/
│   │   │   ├── celebration_confetti.riv
│   │   │   ├── celebration_firework.riv
│   │   │   ├── celebration_shockwave.riv
│   │   │   ├── levelup_glow.riv
│   │   │   ├── xp_float.riv
│   │   │   ├── badge_unlock.riv
│   │   │   └── error_crack.riv
│   │   ├── ui/
│   │   │   ├── loading_spinner.riv
│   │   │   ├── status_ring.riv
│   │   │   └── progress_ring.riv
│   │   └── shared/
│   │       ├── thought_bubble.riv
│   │       ├── speech_bubble.riv
│   │       ├── zzz_bubble.riv
│   │       └── tool_icons.riv
│   ├── icons/                        # Custom SVG icons not in lucide
│   └── images/                       # Static images (logo, empty states)
│
├── types/
│   ├── api.ts                        # API request/response types
│   ├── agent.ts                      # Agent model types, state enums
│   ├── task.ts                       # Task model types, priority enums
│   ├── workspace.ts                  # Workspace model types
│   ├── auth.ts                       # Auth tokens, user model
│   ├── gamification.ts               # XP, achievements, leaderboard types
│   ├── events.ts                     # WebSocket event payload types
│   ├── metrics.ts                    # Metric data types, chart data shapes
│   ├── canvas.ts                     # Canvas-specific types (zones, positions)
│   └── index.ts                      # Re-exports all types
│
├── lib/
│   ├── api-client.ts                 # Axios/fetch wrapper with auth interceptor
│   ├── ws-client.ts                  # WebSocket client with reconnect logic
│   ├── sse-client.ts                 # SSE client for metric streams
│   ├── cn.ts                         # clsx + tailwind-merge utility
│   ├── format.ts                     # Number, date, currency formatters
│   ├── constants.ts                  # App-wide constants (API URLs, limits)
│   ├── zone-logic.ts                 # Agent zone assignment logic
│   ├── xp-calculator.ts             # XP level thresholds and tier logic
│   └── validators.ts                 # Zod schemas for API responses
│
├── services/
│   ├── auth.service.ts               # Login, register, refresh, OAuth
│   ├── agents.service.ts             # Agent CRUD, state, heartbeat
│   ├── tasks.service.ts              # Task CRUD, assignment, results
│   ├── workspaces.service.ts         # Workspace CRUD, members, settings
│   ├── metrics.service.ts            # Metrics query, aggregates
│   ├── sessions.service.ts           # Session list, replay data
│   ├── alerts.service.ts             # Alert rules CRUD, alert history
│   ├── gamification.service.ts       # Leaderboard, achievements, quests
│   ├── notifications.service.ts      # Notification read/dismiss
│   └── topology.service.ts           # Agent topology graph data
│
├── stores/
│   ├── auth.store.ts                 # User, tokens, login state
│   ├── workspace.store.ts            # Active workspace, members, settings
│   ├── agents.store.ts               # Agent registry, real-time state map
│   ├── ui.store.ts                   # Sidebar, modals, theme, command palette
│   ├── gamification.store.ts         # Leaderboard, quests, professional mode
│   ├── notifications.store.ts        # Toast queue, notification list, unread count
│   ├── canvas.store.ts               # Viewport, zoom, selected agent, camera
│   └── replay.store.ts              # Replay state, playback controls, timeline
│
├── machines/
│   ├── agent.machine.ts              # XState agent lifecycle FSM
│   ├── canvas-interaction.machine.ts # Canvas pan/zoom/select state machine
│   ├── onboarding.machine.ts         # Onboarding flow state machine
│   ├── replay.machine.ts             # Replay playback state machine
│   └── websocket.machine.ts          # WS connection lifecycle machine
│
├── hooks/
│   ├── useAuth.ts                    # Auth state + actions
│   ├── useAgents.ts                  # TanStack Query hooks for agents API
│   ├── useTasks.ts                   # TanStack Query hooks for tasks API
│   ├── useMetrics.ts                 # TanStack Query hooks for metrics API
│   ├── useSessions.ts               # TanStack Query hooks for sessions API
│   ├── useAlerts.ts                  # TanStack Query hooks for alerts API
│   ├── useGamification.ts           # TanStack Query hooks for XP, leaderboard
│   ├── useWebSocket.ts              # WebSocket connection hook
│   ├── useSSE.ts                    # SSE metric stream hook
│   ├── useAgentActor.ts             # XState actor hook for single agent
│   ├── useCanvas.ts                 # Canvas viewport state hook
│   ├── useKeyboardShortcuts.ts      # Global keyboard shortcut registration
│   ├── useCommandPalette.ts         # Command palette search and actions
│   ├── useTheme.ts                  # Dark/light/professional mode
│   ├── useMediaQuery.ts             # Responsive breakpoint detection
│   ├── useDebounce.ts               # Input debounce utility
│   ├── useIntersection.ts           # Intersection observer for infinite scroll
│   └── useLocalStorage.ts           # Typed localStorage wrapper
│
├── canvas/
│   ├── PixiApp.tsx                   # Root PixiJS application component
│   ├── WorldViewport.tsx             # Viewport with pan/zoom/culling
│   ├── AgentSprite.tsx               # Single agent composite sprite
│   ├── AgentRiveAvatar.tsx           # Rive avatar wrapper for PixiJS
│   ├── StatusRing.tsx                # Animated status ring around agent
│   ├── LevelBadge.tsx               # Level number badge overlay
│   ├── XPBarSprite.tsx               # XP progress bar sprite
│   ├── NameLabel.tsx                 # Agent name text label
│   ├── ActivityBubble.tsx            # Thought/speech/tool bubble
│   ├── ConnectionLine.tsx            # Animated line between agents
│   ├── ParticleEffects.tsx           # XP gain, confetti, error shockwave
│   ├── ZoneRenderer.tsx              # Zone backgrounds, labels, borders
│   ├── Minimap.tsx                   # Minimap overlay component
│   ├── WeatherSystem.tsx             # Rain, clouds, lightning particles
│   ├── DayNightCycle.tsx             # Ambient lighting color filter
│   ├── SelectionOverlay.tsx          # Selected agent highlight ring
│   ├── TaskDropTarget.tsx            # Drag-drop task assignment targets
│   ├── FloatingNotification.tsx      # +XP, level-up floating text
│   ├── systems/
│   │   ├── CullingSystem.ts          # Viewport culling logic
│   │   ├── LODSystem.ts              # Level-of-detail manager
│   │   ├── ObjectPool.ts             # Sprite/particle object pool
│   │   ├── ForceLayout.ts            # Per-zone force-directed positioning
│   │   └── CameraController.ts       # Pan, zoom, focus, momentum
│   └── constants.ts                  # World dimensions, zone coords, zoom levels
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Root layout: sidebar + header + content
│   │   ├── Sidebar.tsx               # Left navigation rail
│   │   ├── Header.tsx                # Top bar with cost ticker, search, user
│   │   ├── PageContainer.tsx         # Padded content wrapper
│   │   └── MobileNav.tsx             # Bottom tab bar for mobile
│   │
│   ├── navigation/
│   │   ├── NavItem.tsx               # Sidebar navigation item
│   │   ├── Breadcrumb.tsx            # Path breadcrumb
│   │   ├── TabBar.tsx                # Horizontal tab bar
│   │   ├── CommandPalette.tsx        # Cmd+K search overlay
│   │   └── WorkspaceSwitcher.tsx     # Workspace dropdown selector
│   │
│   ├── common/
│   │   ├── Button.tsx                # Primary/Secondary/Ghost/Danger variants
│   │   ├── Input.tsx                 # Text input with label, error, helper
│   │   ├── Select.tsx                # Dropdown select
│   │   ├── Checkbox.tsx              # Checkbox with label
│   │   ├── Toggle.tsx                # Toggle switch
│   │   ├── Slider.tsx                # Range slider
│   │   ├── SearchInput.tsx           # Search with icon and clear
│   │   ├── DateRangePicker.tsx       # Date range with presets
│   │   ├── Modal.tsx                 # Modal dialog
│   │   ├── ConfirmDialog.tsx         # Confirmation modal
│   │   ├── Tooltip.tsx               # Hover tooltip
│   │   ├── Popover.tsx               # Click popover
│   │   ├── Toast.tsx                 # Toast notification
│   │   ├── Badge.tsx                 # Status/count badge
│   │   ├── Divider.tsx               # Horizontal/vertical divider
│   │   ├── Skeleton.tsx              # Loading skeleton variants
│   │   ├── EmptyState.tsx            # Empty state with icon and CTA
│   │   ├── ErrorBoundary.tsx         # Error boundary with fallback UI
│   │   ├── ProgressBar.tsx           # Slim/default/thick progress
│   │   ├── AvatarStack.tsx           # Overlapping avatar group
│   │   ├── CopyButton.tsx            # Copy-to-clipboard with feedback
│   │   └── Icon.tsx                  # Lucide icon wrapper
│   │
│   ├── data-display/
│   │   ├── MetricCard.tsx            # Summary metric with sparkline
│   │   ├── AgentCard.tsx             # Agent overview card
│   │   ├── DataTable.tsx             # Sortable, filterable data table
│   │   ├── Sparkline.tsx             # Mini line chart
│   │   ├── StatusBadge.tsx           # Agent status indicator
│   │   ├── ActivityFeed.tsx          # Real-time event list
│   │   ├── ActivityFeedItem.tsx      # Single event row
│   │   ├── TraceTimeline.tsx         # Waterfall span visualization
│   │   ├── TraceSpan.tsx             # Individual span bar
│   │   ├── JSONViewer.tsx            # Collapsible JSON tree
│   │   └── CodeBlock.tsx             # Syntax-highlighted code
│   │
│   ├── gamification/
│   │   ├── XPBar.tsx                 # XP progress bar (compact + full)
│   │   ├── LevelBadge.tsx            # Circular level indicator
│   │   ├── AchievementPopup.tsx      # Achievement unlock overlay
│   │   ├── AchievementCard.tsx       # Badge grid card
│   │   ├── LeaderboardRow.tsx        # Ranked agent row
│   │   ├── QuestCard.tsx             # Active quest with progress
│   │   ├── StreakIndicator.tsx        # Flame streak counter
│   │   └── CelebrationOverlay.tsx    # Full-screen legendary celebration
│   │
│   ├── agents/
│   │   ├── AgentDetailPanel.tsx      # Slide-in agent detail panel
│   │   ├── AgentMetricsGrid.tsx      # 2x3 metric cards for agent
│   │   ├── AgentActivityTimeline.tsx # Recent events timeline
│   │   ├── AgentCustomizer.tsx       # Avatar customization form
│   │   ├── AgentCompareDrawer.tsx    # Side-by-side comparison
│   │   └── AgentTooltip.tsx          # Canvas hover tooltip
│   │
│   ├── tasks/
│   │   ├── TaskQueue.tsx             # Task list with tabs
│   │   ├── TaskCard.tsx              # Draggable task card
│   │   ├── TaskCreateForm.tsx        # Inline task creation form
│   │   └── TaskFilterBar.tsx         # Task list filters
│   │
│   ├── charts/
│   │   ├── ChartContainer.tsx        # Chart wrapper with title, controls, loading
│   │   ├── LineChart.tsx             # Recharts line chart
│   │   ├── BarChart.tsx              # Recharts bar chart
│   │   ├── AreaChart.tsx             # Recharts area chart
│   │   ├── PieChart.tsx              # Recharts pie/donut chart
│   │   ├── Heatmap.tsx               # ECharts heatmap
│   │   ├── Treemap.tsx               # ECharts treemap (cost breakdown)
│   │   ├── TimeSeriesChart.tsx       # ECharts high-density time-series
│   │   ├── CostWaterfall.tsx         # Cost attribution waterfall
│   │   └── ChartTooltip.tsx          # Shared chart tooltip
│   │
│   ├── alerts/
│   │   ├── AlertBanner.tsx           # Canvas top alert banner
│   │   ├── AlertRuleForm.tsx         # Alert rule CRUD form
│   │   ├── AlertHistoryTable.tsx     # Alert history data table
│   │   └── AlertRuleCard.tsx         # Alert rule summary card
│   │
│   ├── replay/
│   │   ├── ReplayControls.tsx        # Play/pause/speed/scrub bar
│   │   ├── ReplayTimeline.tsx        # Timeline with event markers
│   │   ├── ReplayBanner.tsx          # "Replay Mode" indicator
│   │   └── SessionList.tsx           # Session picker table
│   │
│   ├── onboarding/
│   │   ├── WelcomeScreen.tsx         # Two-path welcome choice
│   │   ├── SDKSetupPanel.tsx         # Copy-paste integration code
│   │   ├── SampleDataBanner.tsx      # Sample mode indicator
│   │   └── GuidedTour.tsx            # Tooltip-based tour overlay
│   │
│   ├── settings/
│   │   ├── SettingsNav.tsx           # Settings sidebar navigation
│   │   ├── WorkspaceSettings.tsx     # Workspace name, tier, budget
│   │   ├── TeamSettings.tsx          # Member list, invitations
│   │   ├── IntegrationSettings.tsx   # API keys, webhooks
│   │   ├── GamificationSettings.tsx  # Mode toggle, thresholds
│   │   ├── NotificationSettings.tsx  # Notification preferences
│   │   └── AppearanceSettings.tsx    # Theme, density, reduced motion
│   │
│   └── providers/
│       ├── AuthProvider.tsx          # JWT context, refresh rotation
│       ├── WebSocketProvider.tsx     # WS connection lifecycle
│       ├── QueryProvider.tsx         # TanStack Query client
│       ├── ThemeProvider.tsx         # Dark/light/professional mode
│       └── ActorSystemProvider.tsx   # XState actor system context
│
├── pages/
│   ├── WorldPage.tsx                 # Virtual world canvas view
│   ├── DashboardPage.tsx             # Workspace overview dashboard
│   ├── AgentDashboardPage.tsx        # Single agent deep-dive
│   ├── AgentsListPage.tsx            # Agent grid/list view
│   ├── TasksPage.tsx                 # Task queue with drag-drop
│   ├── SessionsPage.tsx              # Session history list
│   ├── ReplayPage.tsx                # Session replay viewer
│   ├── LeaderboardPage.tsx           # Ranking table
│   ├── CostsPage.tsx                 # Cost attribution dashboard
│   ├── AlertsPage.tsx                # Alert rules + history
│   ├── TopologyPage.tsx              # React Flow agent graph
│   ├── SettingsPage.tsx              # Settings layout wrapper
│   ├── LoginPage.tsx                 # Login form
│   ├── RegisterPage.tsx              # Registration form
│   ├── OnboardingPage.tsx            # Welcome + SDK setup
│   ├── NotFoundPage.tsx              # 404 page
│   └── OAuthCallbackPage.tsx         # OAuth redirect handler
│
└── routes.tsx                        # Route definitions with lazy loading
```

**Total: ~150 files across 25 directories.** Each file has a single responsibility. Canvas components live under `canvas/` to separate WebGL concerns from DOM-based React components.

---

## 3. State Management Architecture

### 3.1 Architecture Overview

State is divided into four categories, each managed by a different tool:

| Category | Tool | Scope | Examples |
|----------|------|-------|---------|
| **Server state** | TanStack Query | API data with caching | Agent list, task list, metrics, leaderboard |
| **Global UI state** | Zustand | App-wide UI concerns | Sidebar open, theme, active workspace, modals |
| **Per-entity state machines** | XState v5 | Agent lifecycle FSMs | Agent state (idle/working/error), onboarding flow |
| **Real-time event state** | Zustand + WebSocket | Live pushed data | Agent positions, real-time metrics, activity feed |

### 3.2 Zustand Stores

#### Auth Store (`stores/auth.store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@/types/auth';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      login: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true, isLoading: false }),
      logout: () =>
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false }),
      updateAccessToken: (accessToken) =>
        set((state) => ({
          tokens: state.tokens ? { ...state.tokens, access_token: accessToken } : null,
        })),
    }),
    {
      name: 'oav-auth',
      partialize: (state) => ({ tokens: state.tokens }),
    },
  ),
);
```

#### Workspace Store (`stores/workspace.store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, WorkspaceMember } from '@/types/workspace';

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  isProfessionalMode: boolean;
  isGamificationEnabled: boolean;

  setActiveWorkspace: (ws: Workspace) => void;
  setWorkspaces: (list: Workspace[]) => void;
  setMembers: (members: WorkspaceMember[]) => void;
  toggleProfessionalMode: () => void;
  toggleGamification: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspace: null,
      workspaces: [],
      members: [],
      isProfessionalMode: false,
      isGamificationEnabled: true,

      setActiveWorkspace: (ws) =>
        set({
          activeWorkspace: ws,
          isProfessionalMode: ws.professional_mode,
          isGamificationEnabled: ws.gamification_enabled,
        }),
      setWorkspaces: (list) => set({ workspaces: list }),
      setMembers: (members) => set({ members }),
      toggleProfessionalMode: () =>
        set((s) => ({ isProfessionalMode: !s.isProfessionalMode })),
      toggleGamification: () =>
        set((s) => ({ isGamificationEnabled: !s.isGamificationEnabled })),
    }),
    {
      name: 'oav-workspace',
      partialize: (state) => ({
        activeWorkspace: state.activeWorkspace ? { id: state.activeWorkspace.id } : null,
      }),
    },
  ),
);
```

#### Agents Store (`stores/agents.store.ts`)

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Agent, AgentState as AgentStateEnum } from '@/types/agent';

interface AgentPosition {
  x: number;
  y: number;
  zone: string;
  targetX?: number;
  targetY?: number;
}

interface AgentsState {
  /** Map of agent ID to current agent data (real-time updated via WS) */
  agentMap: Record<string, Agent>;
  /** Map of agent ID to canvas position */
  positions: Record<string, AgentPosition>;
  /** IDs of agents currently visible in viewport */
  visibleAgentIds: Set<string>;
  /** Total count across all states */
  totalCount: number;
  /** Count by state */
  stateCounts: Record<AgentStateEnum, number>;

  upsertAgent: (agent: Agent) => void;
  updateAgentState: (agentId: string, newState: AgentStateEnum) => void;
  updatePosition: (agentId: string, pos: AgentPosition) => void;
  setVisibleAgents: (ids: string[]) => void;
  removeAgent: (agentId: string) => void;
  bulkUpsert: (agents: Agent[]) => void;
  recalcStateCounts: () => void;
}

export const useAgentsStore = create<AgentsState>()(
  immer((set, get) => ({
    agentMap: {},
    positions: {},
    visibleAgentIds: new Set(),
    totalCount: 0,
    stateCounts: {} as Record<AgentStateEnum, number>,

    upsertAgent: (agent) =>
      set((state) => {
        state.agentMap[agent.id] = agent;
        state.totalCount = Object.keys(state.agentMap).length;
      }),

    updateAgentState: (agentId, newState) =>
      set((state) => {
        if (state.agentMap[agentId]) {
          state.agentMap[agentId].current_state = newState;
        }
      }),

    updatePosition: (agentId, pos) =>
      set((state) => {
        state.positions[agentId] = pos;
      }),

    setVisibleAgents: (ids) =>
      set((state) => {
        state.visibleAgentIds = new Set(ids);
      }),

    removeAgent: (agentId) =>
      set((state) => {
        delete state.agentMap[agentId];
        delete state.positions[agentId];
        state.visibleAgentIds.delete(agentId);
        state.totalCount = Object.keys(state.agentMap).length;
      }),

    bulkUpsert: (agents) =>
      set((state) => {
        agents.forEach((a) => {
          state.agentMap[a.id] = a;
        });
        state.totalCount = Object.keys(state.agentMap).length;
      }),

    recalcStateCounts: () => {
      const agents = Object.values(get().agentMap);
      const counts: Record<string, number> = {};
      agents.forEach((a) => {
        counts[a.current_state] = (counts[a.current_state] || 0) + 1;
      });
      set({ stateCounts: counts as Record<AgentStateEnum, number> });
    },
  })),
);
```

#### UI Store (`stores/ui.store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type SidebarState = 'collapsed' | 'expanded' | 'hidden';

interface UIState {
  theme: Theme;
  sidebarState: SidebarState;
  isCommandPaletteOpen: boolean;
  isMobileNavOpen: boolean;
  reducedMotion: boolean;
  activeModal: string | null;
  modalProps: Record<string, unknown>;

  setTheme: (theme: Theme) => void;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openModal: (id: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  setReducedMotion: (val: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarState: 'collapsed',
      isCommandPaletteOpen: false,
      isMobileNavOpen: false,
      reducedMotion: false,
      activeModal: null,
      modalProps: {},

      setTheme: (theme) => set({ theme }),
      setSidebarState: (sidebarState) => set({ sidebarState }),
      toggleSidebar: () =>
        set((s) => ({
          sidebarState: s.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
        })),
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      openModal: (id, props = {}) => set({ activeModal: id, modalProps: props }),
      closeModal: () => set({ activeModal: null, modalProps: {} }),
      setReducedMotion: (val) => set({ reducedMotion: val }),
    }),
    {
      name: 'oav-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarState: state.sidebarState,
        reducedMotion: state.reducedMotion,
      }),
    },
  ),
);
```

#### Canvas Store (`stores/canvas.store.ts`)

```typescript
import { create } from 'zustand';

interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedAgentId: string | null;
  hoveredAgentId: string | null;
  isReplayMode: boolean;
  viewportBounds: { x: number; y: number; width: number; height: number };

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  selectAgent: (id: string | null) => void;
  setHoveredAgent: (id: string | null) => void;
  setReplayMode: (enabled: boolean) => void;
  setViewportBounds: (bounds: CanvasState['viewportBounds']) => void;
  resetView: () => void;
  focusAgent: (agentId: string, x: number, y: number) => void;
}

const DEFAULT_ZOOM = 1;
const DEFAULT_PAN = { x: 0, y: 0 };

export const useCanvasStore = create<CanvasState>()((set) => ({
  zoom: DEFAULT_ZOOM,
  panX: DEFAULT_PAN.x,
  panY: DEFAULT_PAN.y,
  selectedAgentId: null,
  hoveredAgentId: null,
  isReplayMode: false,
  viewportBounds: { x: 0, y: 0, width: 0, height: 0 },

  setZoom: (zoom) => set({ zoom: Math.min(10, Math.max(1, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  selectAgent: (selectedAgentId) => set({ selectedAgentId }),
  setHoveredAgent: (hoveredAgentId) => set({ hoveredAgentId }),
  setReplayMode: (isReplayMode) => set({ isReplayMode }),
  setViewportBounds: (viewportBounds) => set({ viewportBounds }),
  resetView: () => set({ zoom: DEFAULT_ZOOM, panX: DEFAULT_PAN.x, panY: DEFAULT_PAN.y }),
  focusAgent: (_agentId, x, y) => set({ panX: -x, panY: -y, zoom: 5 }),
}));
```

#### Notifications Store (`stores/notifications.store.ts`)

```typescript
import { create } from 'zustand';
import type { Notification } from '@/types/events';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  toastQueue: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'achievement';
    title: string;
    description?: string;
    duration?: number;
  }>;

  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addToast: (toast: NotificationsState['toastQueue'][0]) => void;
  removeToast: (id: string) => void;
  setNotifications: (items: Notification[]) => void;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  toastQueue: [],

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 100),
      unreadCount: s.unreadCount + (n.is_read ? 0 : 1),
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  addToast: (toast) =>
    set((s) => ({
      toastQueue: [...s.toastQueue, toast].slice(-3),
    })),

  removeToast: (id) =>
    set((s) => ({
      toastQueue: s.toastQueue.filter((t) => t.id !== id),
    })),

  setNotifications: (items) =>
    set({
      notifications: items,
      unreadCount: items.filter((n) => !n.is_read).length,
    }),
}));
```

### 3.3 XState Machines

#### Agent Lifecycle Machine (`machines/agent.machine.ts`)

```typescript
import { setup, assign, fromCallback } from 'xstate';

export type AgentEvent =
  | { type: 'TASK_ASSIGNED'; taskId: string }
  | { type: 'CONTEXT_LOADED' }
  | { type: 'TOOL_CALLED'; toolName: string }
  | { type: 'TOOL_RESULT'; result: unknown }
  | { type: 'TOOL_ERROR'; error: string; severity: number }
  | { type: 'MESSAGE_SENT'; targetAgentId: string }
  | { type: 'RESPONSE_RECEIVED'; fromAgentId: string }
  | { type: 'AWAITING_RESPONSE' }
  | { type: 'UNBLOCKED' }
  | { type: 'ALL_TASKS_DONE' }
  | { type: 'CAN_RECOVER' }
  | { type: 'RECOVERED' }
  | { type: 'FATAL' }
  | { type: 'RECOVERY_EXHAUSTED' }
  | { type: 'TIMEOUT' }
  | { type: 'NEW_SESSION' }
  | { type: 'QUEUE_DEPTH_EXCEEDED' }
  | { type: 'QUEUE_NORMALIZED' }
  | { type: 'IDLE_TIMEOUT' }
  | { type: 'WAKE_EVENT' }
  | { type: 'LEVEL_UP'; newLevel: number }
  | { type: 'ACHIEVEMENT_EARNED'; achievementId: string }
  | { type: 'SHUTDOWN' }
  | { type: 'HEARTBEAT'; metrics: Record<string, number> };

interface AgentContext {
  agentId: string;
  agentName: string;
  currentTool: string | null;
  targetAgentId: string | null;
  errorSeverity: number;
  level: number;
  xp: number;
  energy: number;
  mood: number;
  retryCount: number;
  maxRetries: number;
}

export const agentMachine = setup({
  types: {
    context: {} as AgentContext,
    events: {} as AgentEvent,
  },
  actions: {
    setTool: assign({
      currentTool: ({ event }) =>
        event.type === 'TOOL_CALLED' ? event.toolName : null,
    }),
    clearTool: assign({ currentTool: null }),
    setTarget: assign({
      targetAgentId: ({ event }) =>
        event.type === 'MESSAGE_SENT' ? event.targetAgentId : null,
    }),
    clearTarget: assign({ targetAgentId: null }),
    setErrorSeverity: assign({
      errorSeverity: ({ event }) =>
        event.type === 'TOOL_ERROR' ? event.severity : 0,
    }),
    incrementRetry: assign({
      retryCount: ({ context }) => context.retryCount + 1,
    }),
    resetRetry: assign({ retryCount: 0 }),
    updateLevel: assign({
      level: ({ event }) =>
        event.type === 'LEVEL_UP' ? event.newLevel : 0,
    }),
    decayEnergy: assign({
      energy: ({ context }) => Math.max(0, context.energy - 0.001),
    }),
    restoreEnergy: assign({
      energy: ({ context }) => Math.min(1, context.energy + 0.1),
    }),
  },
  guards: {
    canRetry: ({ context }) => context.retryCount < context.maxRetries,
    isFatal: ({ event }) =>
      event.type === 'TOOL_ERROR' && event.severity > 0.7,
  },
}).createMachine({
  id: 'agent',
  initial: 'idle',
  context: {
    agentId: '',
    agentName: '',
    currentTool: null,
    targetAgentId: null,
    errorSeverity: 0,
    level: 1,
    xp: 0,
    energy: 1,
    mood: 0.7,
    retryCount: 0,
    maxRetries: 3,
  },
  states: {
    idle: {
      on: {
        TASK_ASSIGNED: { target: 'initializing', actions: 'restoreEnergy' },
        IDLE_TIMEOUT: 'sleeping',
        SHUTDOWN: 'terminated',
      },
    },
    initializing: {
      on: {
        CONTEXT_LOADED: 'thinking',
        TOOL_ERROR: { target: 'error', actions: 'setErrorSeverity' },
        SHUTDOWN: 'terminated',
      },
    },
    thinking: {
      on: {
        TOOL_CALLED: { target: 'executing', actions: 'setTool' },
        MESSAGE_SENT: { target: 'communicating', actions: 'setTarget' },
        ALL_TASKS_DONE: { target: 'complete', actions: ['clearTool', 'resetRetry'] },
        TOOL_ERROR: { target: 'error', actions: 'setErrorSeverity' },
        QUEUE_DEPTH_EXCEEDED: 'overloaded',
        SHUTDOWN: 'terminated',
      },
    },
    executing: {
      on: {
        TOOL_RESULT: { target: 'thinking', actions: ['clearTool', 'resetRetry'] },
        TOOL_ERROR: { target: 'error', actions: ['setErrorSeverity', 'clearTool'] },
        SHUTDOWN: 'terminated',
      },
    },
    communicating: {
      on: {
        AWAITING_RESPONSE: 'waiting',
        RESPONSE_RECEIVED: { target: 'thinking', actions: 'clearTarget' },
        SHUTDOWN: 'terminated',
      },
    },
    waiting: {
      on: {
        UNBLOCKED: 'thinking',
        TIMEOUT: 'terminated',
        SHUTDOWN: 'terminated',
      },
    },
    error: {
      on: {
        CAN_RECOVER: { target: 'recovering', actions: 'incrementRetry' },
        FATAL: 'terminated',
        SHUTDOWN: 'terminated',
      },
    },
    recovering: {
      on: {
        RECOVERED: { target: 'thinking', actions: 'restoreEnergy' },
        RECOVERY_EXHAUSTED: 'terminated',
        SHUTDOWN: 'terminated',
      },
    },
    complete: {
      on: {
        NEW_SESSION: 'idle',
        ACHIEVEMENT_EARNED: 'celebrating',
        SHUTDOWN: 'terminated',
      },
    },
    celebrating: {
      after: {
        2000: 'complete',
      },
    },
    overloaded: {
      on: {
        QUEUE_NORMALIZED: 'thinking',
        TOOL_ERROR: { target: 'error', actions: 'setErrorSeverity' },
        SHUTDOWN: 'terminated',
      },
    },
    sleeping: {
      on: {
        WAKE_EVENT: 'idle',
        TASK_ASSIGNED: 'initializing',
        SHUTDOWN: 'terminated',
      },
    },
    terminated: {
      type: 'final',
    },
  },
  on: {
    LEVEL_UP: {
      actions: 'updateLevel',
    },
    HEARTBEAT: {
      actions: 'decayEnergy',
    },
  },
});
```

#### Canvas Interaction Machine (`machines/canvas-interaction.machine.ts`)

```typescript
import { setup, assign } from 'xstate';

interface CanvasContext {
  startX: number;
  startY: number;
  isPanning: boolean;
  momentumVx: number;
  momentumVy: number;
}

type CanvasEvent =
  | { type: 'POINTER_DOWN'; x: number; y: number; button: number }
  | { type: 'POINTER_MOVE'; x: number; y: number }
  | { type: 'POINTER_UP' }
  | { type: 'WHEEL'; deltaY: number; clientX: number; clientY: number }
  | { type: 'CLICK_AGENT'; agentId: string }
  | { type: 'CLICK_EMPTY' }
  | { type: 'DOUBLE_CLICK_AGENT'; agentId: string; x: number; y: number }
  | { type: 'HOVER_AGENT'; agentId: string }
  | { type: 'HOVER_EMPTY' }
  | { type: 'KEY_ESCAPE' }
  | { type: 'KEY_FIT_ALL' }
  | { type: 'KEY_RESET_ZOOM' };

export const canvasInteractionMachine = setup({
  types: {
    context: {} as CanvasContext,
    events: {} as CanvasEvent,
  },
}).createMachine({
  id: 'canvasInteraction',
  initial: 'idle',
  context: {
    startX: 0,
    startY: 0,
    isPanning: false,
    momentumVx: 0,
    momentumVy: 0,
  },
  states: {
    idle: {
      on: {
        POINTER_DOWN: {
          target: 'panning',
          actions: assign({
            startX: ({ event }) => event.x,
            startY: ({ event }) => event.y,
            isPanning: true,
          }),
        },
        CLICK_AGENT: 'agentSelected',
        DOUBLE_CLICK_AGENT: 'agentFocused',
        HOVER_AGENT: 'hovering',
        WHEEL: {
          actions: 'applyZoom',
        },
      },
    },
    panning: {
      on: {
        POINTER_MOVE: { actions: 'applyPan' },
        POINTER_UP: {
          target: 'momentum',
          actions: assign({ isPanning: false }),
        },
      },
    },
    momentum: {
      after: {
        300: 'idle',
      },
      on: {
        POINTER_DOWN: 'panning',
      },
    },
    hovering: {
      on: {
        HOVER_EMPTY: 'idle',
        HOVER_AGENT: {
          actions: 'updateHoveredAgent',
        },
        CLICK_AGENT: 'agentSelected',
        POINTER_DOWN: 'panning',
      },
    },
    agentSelected: {
      on: {
        KEY_ESCAPE: 'idle',
        CLICK_EMPTY: 'idle',
        CLICK_AGENT: {
          target: 'agentSelected',
          actions: 'selectAgent',
        },
        DOUBLE_CLICK_AGENT: 'agentFocused',
        POINTER_DOWN: 'panning',
      },
    },
    agentFocused: {
      entry: 'animateFocusAgent',
      on: {
        KEY_ESCAPE: 'agentSelected',
        CLICK_EMPTY: 'idle',
        CLICK_AGENT: 'agentSelected',
      },
    },
  },
});
```

### 3.4 TanStack Query Patterns

#### Query Key Factory (`hooks/query-keys.ts`)

```typescript
export const queryKeys = {
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    list: (filters: Record<string, string>) =>
      [...queryKeys.agents.lists(), filters] as const,
    details: () => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agents.details(), id] as const,
    metrics: (id: string, range: string) =>
      [...queryKeys.agents.detail(id), 'metrics', range] as const,
    achievements: (id: string) =>
      [...queryKeys.agents.detail(id), 'achievements'] as const,
    sessions: (id: string) =>
      [...queryKeys.agents.detail(id), 'sessions'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, string>) =>
      [...queryKeys.tasks.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
  },
  metrics: {
    all: ['metrics'] as const,
    workspace: (range: string) =>
      [...queryKeys.metrics.all, 'workspace', range] as const,
    agent: (agentId: string, metricName: string, range: string) =>
      [...queryKeys.metrics.all, 'agent', agentId, metricName, range] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    list: (filters: Record<string, string>) =>
      [...queryKeys.sessions.all, 'list', filters] as const,
    detail: (id: string) =>
      [...queryKeys.sessions.all, 'detail', id] as const,
    replay: (id: string) =>
      [...queryKeys.sessions.all, 'replay', id] as const,
  },
  alerts: {
    rules: ['alerts', 'rules'] as const,
    history: (filters: Record<string, string>) =>
      ['alerts', 'history', filters] as const,
  },
  leaderboard: {
    all: ['leaderboard'] as const,
    window: (timeWindow: string) =>
      [...queryKeys.leaderboard.all, timeWindow] as const,
  },
  topology: {
    graph: ['topology', 'graph'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
  },
} as const;
```

#### Agent Hooks (`hooks/useAgents.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import * as agentsService from '@/services/agents.service';
import type { Agent } from '@/types/agent';

export function useAgentsList(filters: Record<string, string> = {}) {
  return useQuery({
    queryKey: queryKeys.agents.list(filters),
    queryFn: () => agentsService.listAgents(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAgentDetail(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => agentsService.getAgent(agentId),
    staleTime: 10_000,
    enabled: !!agentId,
  });
}

export function useAgentMetrics(agentId: string, range: string) {
  return useQuery({
    queryKey: queryKeys.agents.metrics(agentId, range),
    queryFn: () => agentsService.getAgentMetrics(agentId, range),
    staleTime: 60_000,
    enabled: !!agentId,
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      agentsService.updateAgent(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.agents.detail(id) });
      const previous = queryClient.getQueryData<Agent>(queryKeys.agents.detail(id));
      if (previous) {
        queryClient.setQueryData(queryKeys.agents.detail(id), {
          ...previous,
          ...data,
        });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.agents.detail(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.lists() });
    },
  });
}
```

### 3.5 Real-Time State Sync via WebSocket

The WebSocket connection dispatches events to both Zustand stores and XState actors:

```typescript
// lib/ws-client.ts
import { useAgentsStore } from '@/stores/agents.store';
import { useNotificationsStore } from '@/stores/notifications.store';

type WSEvent =
  | { type: 'agent.state_changed'; agent_id: string; new_state: string; data: unknown }
  | { type: 'agent.heartbeat'; agent_id: string; metrics: Record<string, number> }
  | { type: 'agent.registered'; agent: unknown }
  | { type: 'agent.removed'; agent_id: string }
  | { type: 'task.assigned'; task_id: string; agent_id: string }
  | { type: 'task.completed'; task_id: string; agent_id: string; xp_earned: number }
  | { type: 'task.failed'; task_id: string; agent_id: string; error: string }
  | { type: 'alert.fired'; alert: unknown }
  | { type: 'achievement.unlocked'; agent_id: string; achievement: unknown }
  | { type: 'level_up'; agent_id: string; new_level: number }
  | { type: 'notification'; notification: unknown };

export class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private actorRegistry: Map<string, (event: unknown) => void> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(token: string) {
    this.ws = new WebSocket(`${this.url}?token=${token}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WSEvent;
      this.dispatch(data);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.attemptReconnect(token);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private dispatch(event: WSEvent) {
    const agentsStore = useAgentsStore.getState();
    const notifStore = useNotificationsStore.getState();

    switch (event.type) {
      case 'agent.state_changed': {
        agentsStore.updateAgentState(event.agent_id, event.new_state as never);
        // Forward to XState actor
        const sendToActor = this.actorRegistry.get(event.agent_id);
        if (sendToActor) {
          sendToActor(this.mapStateEventToXState(event));
        }
        break;
      }
      case 'agent.registered':
        agentsStore.upsertAgent(event.agent as never);
        break;
      case 'agent.removed':
        agentsStore.removeAgent(event.agent_id);
        break;
      case 'alert.fired':
        notifStore.addToast({
          id: crypto.randomUUID(),
          type: 'error',
          title: 'Alert Fired',
          description: (event.alert as { title: string }).title,
          duration: 8000,
        });
        break;
      case 'level_up':
        notifStore.addToast({
          id: crypto.randomUUID(),
          type: 'achievement',
          title: 'Level Up!',
          description: `Agent leveled up to ${event.new_level}`,
        });
        break;
      case 'notification':
        notifStore.addNotification(event.notification as never);
        break;
    }
  }

  private mapStateEventToXState(event: Extract<WSEvent, { type: 'agent.state_changed' }>) {
    const stateMap: Record<string, string> = {
      idle: 'NEW_SESSION',
      initializing: 'TASK_ASSIGNED',
      thinking: 'CONTEXT_LOADED',
      executing: 'TOOL_CALLED',
      communicating: 'MESSAGE_SENT',
      waiting: 'AWAITING_RESPONSE',
      error: 'TOOL_ERROR',
      recovering: 'CAN_RECOVER',
      complete: 'ALL_TASKS_DONE',
      terminated: 'SHUTDOWN',
    };
    return { type: stateMap[event.new_state] || 'HEARTBEAT' };
  }

  registerActor(agentId: string, send: (event: unknown) => void) {
    this.actorRegistry.set(agentId, send);
  }

  unregisterActor(agentId: string) {
    this.actorRegistry.delete(agentId);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(token), Math.min(delay, 30_000));
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
```

---

## 4. PixiJS Virtual World Implementation

### 4.1 Canvas Setup with pixi-react

#### Root Application (`canvas/PixiApp.tsx`)

```tsx
import { Stage, Container } from '@pixi/react';
import { useRef, useCallback, useMemo } from 'react';
import { Application } from 'pixi.js';
import { WorldViewport } from './WorldViewport';
import { Minimap } from './Minimap';
import { useCanvasStore } from '@/stores/canvas.store';
import { useUIStore } from '@/stores/ui.store';

interface PixiAppProps {
  width: number;
  height: number;
}

export function PixiApp({ width, height }: PixiAppProps) {
  const appRef = useRef<Application | null>(null);
  const reducedMotion = useUIStore((s) => s.reducedMotion);

  const options = useMemo(
    () => ({
      background: 0x0f1117,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      powerPreference: 'high-performance' as const,
    }),
    [],
  );

  const onMount = useCallback((app: Application) => {
    appRef.current = app;
    // Enable WebGL2 features
    app.renderer.background.color = 0x0f1117;
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-base">
      <Stage
        width={width}
        height={height}
        options={options}
        onMount={onMount}
      >
        <WorldViewport
          screenWidth={width}
          screenHeight={height}
          worldWidth={4000}
          worldHeight={3000}
          reducedMotion={reducedMotion}
        />
      </Stage>
      <Minimap
        worldWidth={4000}
        worldHeight={3000}
        screenWidth={width}
        screenHeight={height}
      />
    </div>
  );
}
```

### 4.2 World Rendering

#### WorldViewport (`canvas/WorldViewport.tsx`)

```tsx
import { Container, Graphics, useTick } from '@pixi/react';
import { useCallback, useRef, useState } from 'react';
import { ZoneRenderer } from './ZoneRenderer';
import { AgentSprite } from './AgentSprite';
import { ConnectionLine } from './ConnectionLine';
import { WeatherSystem } from './WeatherSystem';
import { DayNightCycle } from './DayNightCycle';
import { ParticleEffects } from './ParticleEffects';
import { useCanvasStore } from '@/stores/canvas.store';
import { useAgentsStore } from '@/stores/agents.store';
import { CullingSystem } from './systems/CullingSystem';
import { CameraController } from './systems/CameraController';
import { ZONES } from './constants';

interface WorldViewportProps {
  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  reducedMotion: boolean;
}

export function WorldViewport({
  screenWidth,
  screenHeight,
  worldWidth,
  worldHeight,
  reducedMotion,
}: WorldViewportProps) {
  const zoom = useCanvasStore((s) => s.zoom);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const agentMap = useAgentsStore((s) => s.agentMap);
  const positions = useAgentsStore((s) => s.positions);
  const setVisibleAgents = useAgentsStore((s) => s.setVisibleAgents);

  const cullingRef = useRef(
    new CullingSystem(screenWidth, screenHeight, 200),
  );
  const cameraRef = useRef(
    new CameraController(worldWidth, worldHeight),
  );

  const agents = Object.values(agentMap);

  // Run culling each frame to determine visible agents
  useTick((delta) => {
    const viewport = {
      x: -panX / zoom,
      y: -panY / zoom,
      width: screenWidth / zoom,
      height: screenHeight / zoom,
    };

    const visibleIds = cullingRef.current.getVisibleEntities(
      agents.map((a) => ({
        id: a.id,
        x: positions[a.id]?.x ?? 0,
        y: positions[a.id]?.y ?? 0,
        width: 48,
        height: 48,
      })),
      viewport,
    );

    setVisibleAgents(visibleIds);
  });

  const visibleAgents = useAgentsStore((s) => s.visibleAgentIds);

  return (
    <Container x={panX} y={panY} scale={zoom}>
      {/* Background lighting */}
      {!reducedMotion && <DayNightCycle agents={agents} />}

      {/* Zone backgrounds and labels */}
      {ZONES.map((zone) => (
        <ZoneRenderer key={zone.id} zone={zone} zoom={zoom} />
      ))}

      {/* Connection lines between communicating agents */}
      {agents
        .filter(
          (a) =>
            a.current_state === 'communicating' &&
            positions[a.id]?.targetX !== undefined,
        )
        .map((a) => (
          <ConnectionLine
            key={`conn-${a.id}`}
            fromX={positions[a.id]?.x ?? 0}
            fromY={positions[a.id]?.y ?? 0}
            toX={positions[a.id]?.targetX ?? 0}
            toY={positions[a.id]?.targetY ?? 0}
            color={0x3b82f6}
          />
        ))}

      {/* Agent sprites (only visible ones) */}
      {agents
        .filter((a) => visibleAgents.has(a.id))
        .map((a) => (
          <AgentSprite
            key={a.id}
            agent={a}
            position={positions[a.id]}
            zoom={zoom}
            reducedMotion={reducedMotion}
          />
        ))}

      {/* Particle effects layer */}
      {!reducedMotion && <ParticleEffects />}

      {/* Weather effects (topmost) */}
      {!reducedMotion && (
        <WeatherSystem
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />
      )}
    </Container>
  );
}
```

### 4.3 Agent Avatar Rendering

#### AgentSprite (`canvas/AgentSprite.tsx`)

```tsx
import { Container, Text } from '@pixi/react';
import { TextStyle } from 'pixi.js';
import { useMemo } from 'react';
import { StatusRing } from './StatusRing';
import { AgentRiveAvatar } from './AgentRiveAvatar';
import { LevelBadge } from './LevelBadge';
import { XPBarSprite } from './XPBarSprite';
import { NameLabel } from './NameLabel';
import { ActivityBubble } from './ActivityBubble';
import { FloatingNotification } from './FloatingNotification';
import { useCanvasStore } from '@/stores/canvas.store';
import type { Agent } from '@/types/agent';
import type { AgentPosition } from '@/stores/agents.store';
import { STATE_COLORS, getTierForLevel } from './constants';

interface AgentSpriteProps {
  agent: Agent;
  position: AgentPosition | undefined;
  zoom: number;
  reducedMotion: boolean;
}

/**
 * Composite sprite for a single agent on the canvas.
 * Layers (back to front):
 *  0. Shadow ellipse
 *  1. Status ring (colored)
 *  2. Rive avatar body
 *  3. Activity bubble (thought/speech/tool)
 *  4. Level badge (bottom-right)
 *  5. XP bar (below avatar)
 *  6. Name label (below XP bar)
 *  7. Metric sparklines (zoom >= 5)
 *  8. Floating notifications (+XP)
 */
export function AgentSprite({ agent, position, zoom, reducedMotion }: AgentSpriteProps) {
  const selectedAgentId = useCanvasStore((s) => s.selectedAgentId);
  const selectAgent = useCanvasStore((s) => s.selectAgent);
  const setHoveredAgent = useCanvasStore((s) => s.setHoveredAgent);

  const x = position?.x ?? 0;
  const y = position?.y ?? 0;
  const isSelected = selectedAgentId === agent.id;
  const stateColor = STATE_COLORS[agent.current_state] ?? 0x6b7280;
  const tier = getTierForLevel(agent.level);

  // Determine what to render based on semantic zoom level
  const showName = zoom >= 3;
  const showLevelBadge = zoom >= 3;
  const showXPBar = zoom >= 5;
  const showActivityBubble = zoom >= 3;
  const showMetrics = zoom >= 5;

  // Avatar size scales with zoom but has min/max
  const baseSize = 48;

  const handleClick = () => selectAgent(agent.id);
  const handlePointerOver = () => setHoveredAgent(agent.id);
  const handlePointerOut = () => setHoveredAgent(null);

  return (
    <Container
      x={x}
      y={y}
      interactive
      pointerdown={handleClick}
      pointerover={handlePointerOver}
      pointerout={handlePointerOut}
      cursor="pointer"
    >
      {/* Layer 1: Status Ring */}
      <StatusRing
        radius={baseSize / 2 + 4}
        color={stateColor}
        state={agent.current_state}
        isSelected={isSelected}
        reducedMotion={reducedMotion}
      />

      {/* Layer 2: Rive Avatar Body */}
      <AgentRiveAvatar
        tier={tier}
        state={agent.current_state}
        energy={agent.current_state === 'idle' ? 0.7 : 1.0}
        intensity={0.5}
        mood={0.7}
        size={baseSize}
        reducedMotion={reducedMotion}
      />

      {/* Layer 3: Activity Bubble (visible at zoom >= 3) */}
      {showActivityBubble && agent.current_state !== 'idle' && (
        <ActivityBubble
          state={agent.current_state}
          y={-baseSize / 2 - 16}
        />
      )}

      {/* Layer 4: Level Badge */}
      {showLevelBadge && (
        <LevelBadge
          level={agent.level}
          tier={tier}
          x={baseSize / 2 - 6}
          y={baseSize / 2 - 6}
          size={zoom >= 5 ? 24 : 16}
        />
      )}

      {/* Layer 5: XP Bar */}
      {showXPBar && (
        <XPBarSprite
          xpTotal={agent.xp_total}
          level={agent.level}
          width={baseSize * 0.75}
          y={baseSize / 2 + 4}
        />
      )}

      {/* Layer 6: Name Label */}
      {showName && (
        <NameLabel
          name={agent.name}
          y={baseSize / 2 + (showXPBar ? 14 : 4)}
        />
      )}

      {/* Layer 8: Floating Notifications */}
      <FloatingNotification agentId={agent.id} />
    </Container>
  );
}
```

### 4.4 Camera System

#### CameraController (`canvas/systems/CameraController.ts`)

```typescript
export class CameraController {
  private worldWidth: number;
  private worldHeight: number;
  private momentumVx = 0;
  private momentumVy = 0;
  private friction = 0.92;

  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  /**
   * Apply pan delta with momentum tracking.
   * Returns new panX, panY values.
   */
  pan(
    currentPanX: number,
    currentPanY: number,
    deltaX: number,
    deltaY: number,
    zoom: number,
  ): { panX: number; panY: number } {
    this.momentumVx = deltaX;
    this.momentumVy = deltaY;

    const newPanX = this.clampPanX(currentPanX + deltaX, zoom);
    const newPanY = this.clampPanY(currentPanY + deltaY, zoom);

    return { panX: newPanX, panY: newPanY };
  }

  /**
   * Apply focal zoom (zoom toward cursor position).
   * Returns new zoom, panX, panY.
   */
  focalZoom(
    currentZoom: number,
    currentPanX: number,
    currentPanY: number,
    delta: number,
    cursorX: number,
    cursorY: number,
  ): { zoom: number; panX: number; panY: number } {
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(10, Math.max(1, currentZoom * zoomFactor));

    // Adjust pan to keep cursor position fixed
    const scale = newZoom / currentZoom;
    const newPanX = cursorX - (cursorX - currentPanX) * scale;
    const newPanY = cursorY - (cursorY - currentPanY) * scale;

    return {
      zoom: Math.round(newZoom * 2) / 2, // Snap to 0.5 increments
      panX: this.clampPanX(newPanX, newZoom),
      panY: this.clampPanY(newPanY, newZoom),
    };
  }

  /**
   * Calculate momentum frame update.
   * Returns remaining velocity and position delta.
   */
  applyMomentum(): { deltaX: number; deltaY: number; done: boolean } {
    this.momentumVx *= this.friction;
    this.momentumVy *= this.friction;

    const done = Math.abs(this.momentumVx) < 0.5 && Math.abs(this.momentumVy) < 0.5;

    if (done) {
      this.momentumVx = 0;
      this.momentumVy = 0;
    }

    return {
      deltaX: this.momentumVx,
      deltaY: this.momentumVy,
      done,
    };
  }

  /**
   * Calculate the pan/zoom to fit all agents in viewport.
   */
  fitAll(
    agentPositions: Array<{ x: number; y: number }>,
    screenWidth: number,
    screenHeight: number,
    padding: number = 100,
  ): { zoom: number; panX: number; panY: number } {
    if (agentPositions.length === 0) {
      return { zoom: 1, panX: 0, panY: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const pos of agentPositions) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const zoom = Math.min(
      screenWidth / contentWidth,
      screenHeight / contentHeight,
      10,
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      zoom: Math.max(1, zoom),
      panX: screenWidth / 2 - centerX * zoom,
      panY: screenHeight / 2 - centerY * zoom,
    };
  }

  /**
   * Animate focus on a specific position.
   */
  focusPosition(
    targetX: number,
    targetY: number,
    screenWidth: number,
    screenHeight: number,
    targetZoom: number = 5,
  ): { zoom: number; panX: number; panY: number } {
    return {
      zoom: targetZoom,
      panX: screenWidth / 2 - targetX * targetZoom,
      panY: screenHeight / 2 - targetY * targetZoom,
    };
  }

  private clampPanX(panX: number, zoom: number): number {
    const minPan = -(this.worldWidth * zoom);
    const maxPan = this.worldWidth * zoom;
    return Math.max(minPan, Math.min(maxPan, panX));
  }

  private clampPanY(panY: number, zoom: number): number {
    const minPan = -(this.worldHeight * zoom);
    const maxPan = this.worldHeight * zoom;
    return Math.max(minPan, Math.min(maxPan, panY));
  }
}
```

### 4.5 Performance Systems

#### Viewport Culling (`canvas/systems/CullingSystem.ts`)

```typescript
interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class CullingSystem {
  private margin: number;
  private lastVisibleIds: Set<string> = new Set();

  constructor(
    private screenWidth: number,
    private screenHeight: number,
    margin: number = 200,
  ) {
    this.margin = margin;
  }

  getVisibleEntities(entities: Entity[], viewport: Viewport): string[] {
    const expandedViewport = {
      x: viewport.x - this.margin,
      y: viewport.y - this.margin,
      width: viewport.width + this.margin * 2,
      height: viewport.height + this.margin * 2,
    };

    const visible: string[] = [];

    for (const entity of entities) {
      if (
        entity.x + entity.width >= expandedViewport.x &&
        entity.x <= expandedViewport.x + expandedViewport.width &&
        entity.y + entity.height >= expandedViewport.y &&
        entity.y <= expandedViewport.y + expandedViewport.height
      ) {
        visible.push(entity.id);
      }
    }

    this.lastVisibleIds = new Set(visible);
    return visible;
  }

  updateScreenSize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }
}
```

#### LOD System (`canvas/systems/LODSystem.ts`)

```typescript
export enum LODLevel {
  /** Zoom 1-2: Colored dot only */
  MINIMAL = 0,
  /** Zoom 2-3: Dot + color ring */
  LOW = 1,
  /** Zoom 3-5: Avatar + name + status ring */
  MEDIUM = 2,
  /** Zoom 5-7: Full detail + sparklines */
  HIGH = 3,
  /** Zoom 7-10: Maximum fidelity */
  ULTRA = 4,
}

export class LODSystem {
  static getLODLevel(zoom: number): LODLevel {
    if (zoom < 2) return LODLevel.MINIMAL;
    if (zoom < 3) return LODLevel.LOW;
    if (zoom < 5) return LODLevel.MEDIUM;
    if (zoom < 7) return LODLevel.HIGH;
    return LODLevel.ULTRA;
  }

  static shouldRenderComponent(
    component: 'name' | 'levelBadge' | 'xpBar' | 'activityBubble' | 'sparklines' | 'riveAvatar',
    lod: LODLevel,
  ): boolean {
    switch (component) {
      case 'riveAvatar':
        return lod >= LODLevel.MEDIUM;
      case 'name':
        return lod >= LODLevel.MEDIUM;
      case 'levelBadge':
        return lod >= LODLevel.MEDIUM;
      case 'activityBubble':
        return lod >= LODLevel.MEDIUM;
      case 'xpBar':
        return lod >= LODLevel.HIGH;
      case 'sparklines':
        return lod >= LODLevel.HIGH;
      default:
        return true;
    }
  }

  /**
   * Get the max number of agents to render at full fidelity.
   * Beyond this, switch remaining to LODLevel.MINIMAL.
   */
  static getMaxFullFidelityAgents(lod: LODLevel): number {
    switch (lod) {
      case LODLevel.MINIMAL: return 500;
      case LODLevel.LOW: return 300;
      case LODLevel.MEDIUM: return 150;
      case LODLevel.HIGH: return 50;
      case LODLevel.ULTRA: return 20;
    }
  }
}
```

#### Object Pool (`canvas/systems/ObjectPool.ts`)

```typescript
export class ObjectPool<T> {
  private pool: T[] = [];
  private activeCount = 0;
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 50) {
    this.factory = factory;
    this.reset = reset;
    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    this.activeCount++;
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.activeCount--;
    this.reset(obj);
    this.pool.push(obj);
  }

  get active(): number {
    return this.activeCount;
  }

  get available(): number {
    return this.pool.length;
  }
}
```

### 4.6 Zone Constants and Layout

#### Constants (`canvas/constants.ts`)

```typescript
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 3000;
export const GRID_CELL_SIZE = 64;

export interface ZoneDefinition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  labelColor: number;
}

export const ZONES: ZoneDefinition[] = [
  { id: 'lobby', name: 'Lobby', x: 100, y: 100, width: 700, height: 500, color: 0x1c2233, labelColor: 0x94a3b8 },
  { id: 'meeting_rooms', name: 'Meeting Rooms', x: 900, y: 100, width: 700, height: 500, color: 0x1c2233, labelColor: 0x94a3b8 },
  { id: 'library', name: 'Library', x: 100, y: 700, width: 700, height: 600, color: 0x1a1f30, labelColor: 0x94a3b8 },
  { id: 'open_floor', name: 'Open Floor', x: 900, y: 700, width: 900, height: 600, color: 0x1a1f30, labelColor: 0x94a3b8 },
  { id: 'review_room', name: 'Review Room', x: 1900, y: 700, width: 500, height: 600, color: 0x1a1f30, labelColor: 0x94a3b8 },
  { id: 'break_room', name: 'Break Room', x: 100, y: 1400, width: 700, height: 600, color: 0x181d28, labelColor: 0x94a3b8 },
  { id: 'manager_office', name: 'Manager Office', x: 900, y: 1400, width: 700, height: 600, color: 0x181d28, labelColor: 0x94a3b8 },
  { id: 'server_room', name: 'Server Room', x: 1700, y: 1400, width: 500, height: 600, color: 0x151a24, labelColor: 0x64748b },
  { id: 'archive', name: 'Archive / Trophy Room', x: 100, y: 2100, width: 2100, height: 500, color: 0x151a24, labelColor: 0x64748b },
];

export const STATE_COLORS: Record<string, number> = {
  idle: 0x6b7280,
  initializing: 0x60a5fa,
  thinking: 0x818cf8,
  executing: 0x34d399,
  communicating: 0x60a5fa,
  waiting: 0xfbbf24,
  error: 0xef4444,
  recovering: 0xf59e0b,
  complete: 0x22c55e,
  terminated: 0x374151,
  sleeping: 0x4b5563,
  overloaded: 0xfb923c,
};

export function getTierForLevel(level: number): number {
  if (level <= 5) return 1;
  if (level <= 14) return 2;
  if (level <= 24) return 3;
  if (level <= 34) return 4;
  if (level <= 44) return 5;
  return 6;
}

export function getTierRivFile(tier: number): string {
  const files: Record<number, string> = {
    1: '/assets/rive/agents/agent_starter.riv',
    2: '/assets/rive/agents/agent_standard.riv',
    3: '/assets/rive/agents/agent_advanced.riv',
    4: '/assets/rive/agents/agent_elite.riv',
    5: '/assets/rive/agents/agent_master.riv',
    6: '/assets/rive/agents/agent_legendary.riv',
  };
  return files[tier] ?? files[1];
}

/** Zoom level thresholds for semantic zoom */
export const ZOOM_THRESHOLDS = {
  DOTS_ONLY: 2,
  AVATAR_VISIBLE: 3,
  FULL_DETAIL: 5,
  SPARKLINES: 5,
  MAX_DETAIL: 7,
} as const;
```

---

## 5. Rive Animation Integration

### 5.1 Loading and Managing .riv Files

#### Rive Asset Manager (`lib/rive-manager.ts`)

```typescript
import { Rive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

const riveCache = new Map<string, ArrayBuffer>();

/**
 * Pre-load a .riv file and cache the ArrayBuffer.
 * Subsequent loads of the same URL return the cached buffer.
 */
export async function preloadRiveAsset(url: string): Promise<ArrayBuffer> {
  if (riveCache.has(url)) {
    return riveCache.get(url)!;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load Rive asset: ${url} (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  riveCache.set(url, buffer);
  return buffer;
}

/**
 * Pre-load all agent tier assets and common effects.
 * Call this once at app startup.
 */
export async function preloadAllRiveAssets(): Promise<void> {
  const assets = [
    '/assets/rive/agents/agent_starter.riv',
    '/assets/rive/agents/agent_standard.riv',
    '/assets/rive/agents/agent_advanced.riv',
    '/assets/rive/agents/agent_elite.riv',
    '/assets/rive/agents/agent_master.riv',
    '/assets/rive/agents/agent_legendary.riv',
    '/assets/rive/effects/levelup_glow.riv',
    '/assets/rive/effects/xp_float.riv',
    '/assets/rive/effects/celebration_confetti.riv',
    '/assets/rive/shared/thought_bubble.riv',
    '/assets/rive/shared/speech_bubble.riv',
    '/assets/rive/ui/status_ring.riv',
  ];

  await Promise.all(assets.map(preloadRiveAsset));
}

/**
 * Map agent state string to Rive state machine trigger input name.
 */
export function getStateTrigger(state: string): string | null {
  const triggerMap: Record<string, string> = {
    idle: null!,
    initializing: 'task_assigned',
    thinking: 'context_loaded',
    executing: 'tool_called',
    communicating: 'message_sent',
    waiting: 'awaiting_response',
    error: 'tool_error',
    recovering: 'can_recover',
    complete: 'all_tasks_done',
    terminated: 'fatal',
    sleeping: 'idle_timeout_300s',
  };
  return triggerMap[state] ?? null;
}

export const defaultLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});
```

### 5.2 State Machine Inputs and Triggers

#### Rive Input Controller (`lib/rive-inputs.ts`)

```typescript
import type { StateMachineInput, Rive } from '@rive-app/react-canvas';

export interface AgentRiveInputs {
  speed: number;
  intensity: number;
  energy: number;
  mood: number;
  tier: number;
  severity: number;
}

/**
 * Update all numeric inputs on a Rive state machine instance.
 */
export function updateRiveInputs(
  rive: Rive | null,
  stateMachineName: string,
  inputs: Partial<AgentRiveInputs>,
): void {
  if (!rive) return;

  const inputNames = Object.keys(inputs) as (keyof AgentRiveInputs)[];

  for (const name of inputNames) {
    const value = inputs[name];
    if (value === undefined) continue;

    const smInputs = rive.stateMachineInputs(stateMachineName);
    if (!smInputs) continue;

    const input = smInputs.find((i) => i.name === name);
    if (input && 'value' in input) {
      (input as { value: number }).value = value;
    }
  }
}

/**
 * Fire a boolean trigger on a Rive state machine.
 */
export function fireRiveTrigger(
  rive: Rive | null,
  stateMachineName: string,
  triggerName: string,
): void {
  if (!rive) return;

  const smInputs = rive.stateMachineInputs(stateMachineName);
  if (!smInputs) return;

  const trigger = smInputs.find((i) => i.name === triggerName);
  if (trigger && 'fire' in trigger) {
    (trigger as { fire: () => void }).fire();
  }
}

/**
 * Compute Rive inputs from agent runtime data.
 */
export function computeRiveInputs(
  agentState: string,
  idleDurationMs: number,
  recentSuccessRate: number,
  taskPriority: string,
  errorSeverity: number,
  tier: number,
  replaySpeed: number = 1,
): AgentRiveInputs {
  const energy = Math.max(0, Math.min(1, 1 - idleDurationMs / 300_000));

  const intensityMap: Record<string, number> = {
    low: 0.2,
    medium: 0.5,
    high: 0.75,
    critical: 1.0,
  };

  return {
    speed: replaySpeed,
    intensity: intensityMap[taskPriority] ?? 0.5,
    energy,
    mood: recentSuccessRate,
    tier,
    severity: agentState === 'error' ? errorSeverity : 0,
  };
}
```

### 5.3 React Component Wrapper

#### AgentRiveAvatar (`canvas/AgentRiveAvatar.tsx`)

```tsx
import { useEffect, useRef, useCallback } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { getTierRivFile } from './constants';
import {
  updateRiveInputs,
  fireRiveTrigger,
  computeRiveInputs,
} from '@/lib/rive-inputs';
import { getStateTrigger } from '@/lib/rive-manager';

interface AgentRiveAvatarProps {
  tier: number;
  state: string;
  energy: number;
  intensity: number;
  mood: number;
  size: number;
  reducedMotion: boolean;
}

export function AgentRiveAvatar({
  tier,
  state,
  energy,
  intensity,
  mood,
  size,
  reducedMotion,
}: AgentRiveAvatarProps) {
  const prevStateRef = useRef(state);
  const rivFile = getTierRivFile(tier);

  const { rive, RiveComponent } = useRive({
    src: rivFile,
    stateMachines: 'AgentLifecycle',
    autoplay: !reducedMotion,
    layout: {
      fit: 'contain' as never,
      alignment: 'center' as never,
    },
  });

  // Update numeric inputs when props change
  useEffect(() => {
    if (!rive) return;

    updateRiveInputs(rive, 'AgentLifecycle', {
      energy,
      intensity,
      mood,
      tier,
      speed: reducedMotion ? 0 : 1,
    });
  }, [rive, energy, intensity, mood, tier, reducedMotion]);

  // Fire trigger when state changes
  useEffect(() => {
    if (!rive) return;
    if (state === prevStateRef.current) return;

    const trigger = getStateTrigger(state);
    if (trigger) {
      fireRiveTrigger(rive, 'AgentLifecycle', trigger);
    }

    prevStateRef.current = state;
  }, [rive, state]);

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

### 5.4 Performance with Multiple Instances

Managing 50+ Rive instances requires careful resource management:

```typescript
// lib/rive-performance.ts

/**
 * Rive performance manager.
 *
 * Strategy:
 * 1. Only run Rive animations for agents in the viewport.
 * 2. Off-screen agents use static sprite fallbacks.
 * 3. At LOD MINIMAL/LOW, replace Rive with colored circles.
 * 4. Cap total active Rive instances at 50 (configurable).
 * 5. Use a priority queue: selected agent > visible agents sorted by distance to viewport center.
 */
export class RivePerformanceManager {
  private maxInstances: number;
  private activeInstances: Set<string> = new Set();

  constructor(maxInstances: number = 50) {
    this.maxInstances = maxInstances;
  }

  /**
   * Given a list of visible agent IDs sorted by priority,
   * return which should have active Rive instances.
   */
  getAllocations(
    visibleAgentIds: string[],
    selectedAgentId: string | null,
    lod: number,
  ): Set<string> {
    // At LOD < MEDIUM, no Rive instances needed
    if (lod < 2) {
      return new Set();
    }

    const allocated = new Set<string>();

    // Always allocate the selected agent
    if (selectedAgentId && visibleAgentIds.includes(selectedAgentId)) {
      allocated.add(selectedAgentId);
    }

    // Fill remaining slots
    for (const id of visibleAgentIds) {
      if (allocated.size >= this.maxInstances) break;
      allocated.add(id);
    }

    this.activeInstances = allocated;
    return allocated;
  }

  get count(): number {
    return this.activeInstances.size;
  }
}
```

---

## 6. Component Implementation Plan

### 6.1 Component Hierarchy and Dependency Tree

```
App.tsx
├── AuthProvider
│   ├── QueryProvider (TanStack)
│   │   ├── ThemeProvider
│   │   │   ├── WebSocketProvider
│   │   │   │   ├── ActorSystemProvider
│   │   │   │   │   ├── AppShell
│   │   │   │   │   │   ├── Sidebar
│   │   │   │   │   │   │   ├── NavItem[]
│   │   │   │   │   │   │   └── WorkspaceSwitcher
│   │   │   │   │   │   ├── Header
│   │   │   │   │   │   │   ├── CostTicker (custom, uses agents store)
│   │   │   │   │   │   │   ├── CommandPalette
│   │   │   │   │   │   │   ├── NotificationBell
│   │   │   │   │   │   │   └── UserMenu
│   │   │   │   │   │   └── PageContainer
│   │   │   │   │   │       └── <RouterOutlet> (lazy-loaded pages)
│   │   │   │   │   └── ToastContainer
│   │   │   │   └── CelebrationOverlay (z-600, rare)
```

### 6.2 Implementation Order

The build order follows a foundation-first strategy. Each phase depends on the previous.

**Phase 1: Foundation (Week 1)**
- `lib/cn.ts` -- className merge utility
- `lib/api-client.ts` -- fetch wrapper with JWT interceptor
- `lib/format.ts` -- number/date/currency formatters
- `lib/constants.ts` -- API URLs, limits, enum values
- `types/*.ts` -- all TypeScript interfaces and enums
- `stores/auth.store.ts`, `stores/ui.store.ts` -- core stores
- `components/providers/AuthProvider.tsx`, `QueryProvider.tsx`, `ThemeProvider.tsx`

**Phase 2: Layout Shell (Week 1-2)**
- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/Header.tsx`
- `components/layout/PageContainer.tsx`
- `components/navigation/NavItem.tsx`
- `components/navigation/Breadcrumb.tsx`
- `components/navigation/TabBar.tsx`
- `routes.tsx` with lazy-loaded page stubs

**Phase 3: Common Components (Week 2)**
- `components/common/Button.tsx`
- `components/common/Input.tsx`
- `components/common/Select.tsx`
- `components/common/Modal.tsx`
- `components/common/Toast.tsx`
- `components/common/Tooltip.tsx`
- `components/common/Badge.tsx`
- `components/common/Skeleton.tsx`
- `components/common/EmptyState.tsx`
- `components/common/ProgressBar.tsx`
- `components/common/ErrorBoundary.tsx`

**Phase 4: Data Display Components (Week 2-3)**
- `components/data-display/MetricCard.tsx`
- `components/data-display/AgentCard.tsx`
- `components/data-display/StatusBadge.tsx`
- `components/data-display/DataTable.tsx`
- `components/data-display/Sparkline.tsx`
- `components/data-display/ActivityFeed.tsx`
- `components/data-display/JSONViewer.tsx`

**Phase 5: Charts (Week 3)**
- `components/charts/ChartContainer.tsx`
- `components/charts/LineChart.tsx`
- `components/charts/BarChart.tsx`
- `components/charts/AreaChart.tsx`
- `components/charts/PieChart.tsx`
- `components/charts/Heatmap.tsx` (ECharts)
- `components/charts/TimeSeriesChart.tsx` (ECharts)

**Phase 6: Gamification Components (Week 3)**
- `components/gamification/XPBar.tsx`
- `components/gamification/LevelBadge.tsx`
- `components/gamification/AchievementCard.tsx`
- `components/gamification/LeaderboardRow.tsx`
- `components/gamification/QuestCard.tsx`
- `components/gamification/StreakIndicator.tsx`
- `components/gamification/AchievementPopup.tsx`
- `components/gamification/CelebrationOverlay.tsx`

**Phase 7: PixiJS Canvas (Week 3-4)**
- `canvas/constants.ts` -- zones, colors, thresholds
- `canvas/systems/CullingSystem.ts`
- `canvas/systems/LODSystem.ts`
- `canvas/systems/ObjectPool.ts`
- `canvas/systems/CameraController.ts`
- `canvas/systems/ForceLayout.ts`
- `canvas/PixiApp.tsx`
- `canvas/WorldViewport.tsx`
- `canvas/ZoneRenderer.tsx`
- `canvas/AgentSprite.tsx`
- `canvas/StatusRing.tsx`
- `canvas/NameLabel.tsx`
- `canvas/Minimap.tsx`

**Phase 8: Rive Integration (Week 4)**
- `lib/rive-manager.ts`
- `lib/rive-inputs.ts`
- `lib/rive-performance.ts`
- `canvas/AgentRiveAvatar.tsx`
- `canvas/ActivityBubble.tsx`
- `canvas/ConnectionLine.tsx`
- `canvas/ParticleEffects.tsx`
- `canvas/WeatherSystem.tsx`
- `canvas/DayNightCycle.tsx`

**Phase 9: Pages (Week 4-5)**
- `pages/LoginPage.tsx`, `pages/RegisterPage.tsx`
- `pages/WorldPage.tsx`
- `pages/DashboardPage.tsx`
- `pages/AgentDashboardPage.tsx`
- `pages/TasksPage.tsx`
- `pages/AlertsPage.tsx`
- `pages/CostsPage.tsx`
- `pages/LeaderboardPage.tsx`
- `pages/SessionsPage.tsx`
- `pages/ReplayPage.tsx`
- `pages/TopologyPage.tsx`
- `pages/SettingsPage.tsx`
- `pages/OnboardingPage.tsx`

**Phase 10: Real-Time + Polish (Week 5-6)**
- `lib/ws-client.ts`
- `lib/sse-client.ts`
- `components/providers/WebSocketProvider.tsx`
- `components/navigation/CommandPalette.tsx`
- `components/replay/ReplayControls.tsx`
- `components/onboarding/GuidedTour.tsx`
- Keyboard shortcuts registration
- Performance optimization pass

### 6.3 Key Component Specifications

#### Button (`components/common/Button.tsx`)

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm',
  secondary:
    'bg-transparent border border-border-strong text-oav-text-primary hover:bg-surface-overlay',
  ghost:
    'bg-transparent text-oav-text-secondary hover:text-oav-text-primary hover:bg-surface-overlay',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded',
  md: 'h-9 px-4 text-sm rounded',
  lg: 'h-11 px-6 text-base rounded',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200/25',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
```

#### MetricCard (`components/data-display/MetricCard.tsx`)

```tsx
import { cn } from '@/lib/cn';
import { Sparkline } from './Sparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  sparklineData?: number[];
  icon?: React.ReactNode;
  variant?: 'default' | 'alert' | 'success';
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  sparklineData,
  icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  const borderClass = {
    default: '',
    alert: 'border-l-[3px] border-l-red-500',
    success: 'border-l-[3px] border-l-green-500',
  }[variant];

  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
      ? TrendingDown
      : Minus;

  const trendColor = trend?.direction === 'up'
    ? 'text-green-400'
    : trend?.direction === 'down'
      ? 'text-red-400'
      : 'text-oav-text-tertiary';

  return (
    <div
      className={cn(
        'rounded-rounded bg-surface-overlay border border-border-default p-5',
        borderClass,
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-oav-text-secondary">{label}</span>
        {icon && <span className="text-oav-text-tertiary">{icon}</span>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold font-mono tabular-nums text-oav-text-primary">
            {value}
          </p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} width={80} height={32} />
        )}
      </div>
    </div>
  );
}
```

#### StatusBadge (`components/data-display/StatusBadge.tsx`)

```tsx
import { cn } from '@/lib/cn';

const stateConfig: Record<string, { color: string; label: string; pulse: boolean }> = {
  idle: { color: 'bg-state-idle', label: 'Idle', pulse: false },
  initializing: { color: 'bg-state-initializing', label: 'Initializing', pulse: true },
  thinking: { color: 'bg-state-thinking', label: 'Thinking', pulse: true },
  executing: { color: 'bg-state-executing', label: 'Executing', pulse: false },
  communicating: { color: 'bg-state-communicating', label: 'Communicating', pulse: true },
  waiting: { color: 'bg-state-waiting', label: 'Waiting', pulse: false },
  error: { color: 'bg-state-error', label: 'Error', pulse: true },
  recovering: { color: 'bg-state-recovering', label: 'Recovering', pulse: true },
  complete: { color: 'bg-state-complete', label: 'Complete', pulse: false },
  terminated: { color: 'bg-state-terminated', label: 'Terminated', pulse: false },
  sleeping: { color: 'bg-state-sleeping', label: 'Sleeping', pulse: false },
  overloaded: { color: 'bg-state-overloaded', label: 'Overloaded', pulse: true },
};

interface StatusBadgeProps {
  state: string;
  className?: string;
}

export function StatusBadge({ state, className }: StatusBadgeProps) {
  const config = stateConfig[state] ?? stateConfig.idle;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-xs font-medium',
        'bg-surface-overlay text-oav-text-primary',
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.color,
            )}
          />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', config.color)} />
      </span>
      {config.label}
    </span>
  );
}
```

### 6.4 Storybook Setup

#### `.storybook/main.ts`

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Reuse Vite aliases
    return config;
  },
};

export default config;
```

#### `.storybook/preview.ts`

```typescript
import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0F1117' },
        { name: 'surface', value: '#1C2233' },
        { name: 'light', value: '#F9FAFB' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
```

Story files follow the pattern `ComponentName.stories.tsx` co-located with the component:

```
components/common/Button.tsx
components/common/Button.stories.tsx
```

---

## 7. Routing & Navigation

### 7.1 React Router v6 Setup

#### Route Definitions (`routes.tsx`)

```tsx
import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/providers/AuthProvider';
import { PageSkeleton } from '@/components/common/Skeleton';

// Lazy-loaded page components
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const OAuthCallbackPage = lazy(() => import('@/pages/OAuthCallbackPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const WorldPage = lazy(() => import('@/pages/WorldPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AgentDashboardPage = lazy(() => import('@/pages/AgentDashboardPage'));
const AgentsListPage = lazy(() => import('@/pages/AgentsListPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const SessionsPage = lazy(() => import('@/pages/SessionsPage'));
const ReplayPage = lazy(() => import('@/pages/ReplayPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const CostsPage = lazy(() => import('@/pages/CostsPage'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const TopologyPage = lazy(() => import('@/pages/TopologyPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

const authenticatedRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/world" replace /> },
      {
        path: 'world',
        element: (
          <SuspenseWrapper>
            <WorldPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agents',
        element: (
          <SuspenseWrapper>
            <AgentsListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agents/:agentId',
        element: (
          <SuspenseWrapper>
            <AgentDashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'tasks',
        element: (
          <SuspenseWrapper>
            <TasksPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'sessions',
        element: (
          <SuspenseWrapper>
            <SessionsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'sessions/:sessionId/replay',
        element: (
          <SuspenseWrapper>
            <ReplayPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'leaderboard',
        element: (
          <SuspenseWrapper>
            <LeaderboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'costs',
        element: (
          <SuspenseWrapper>
            <CostsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'alerts',
        element: (
          <SuspenseWrapper>
            <AlertsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'topology',
        element: (
          <SuspenseWrapper>
            <TopologyPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings/*',
        element: (
          <SuspenseWrapper>
            <SettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'onboarding',
        element: (
          <SuspenseWrapper>
            <OnboardingPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
];

const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/register',
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/auth/callback/:provider',
    element: (
      <SuspenseWrapper>
        <OAuthCallbackPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
];

export const router = createBrowserRouter([
  ...authenticatedRoutes,
  ...publicRoutes,
]);
```

### 7.2 URL Structure

| URL | Page | Description |
|-----|------|-------------|
| `/` | Redirect | Redirects to `/world` |
| `/world` | WorldPage | Virtual world canvas (default landing) |
| `/dashboard` | DashboardPage | Workspace overview with metric cards |
| `/agents` | AgentsListPage | Agent grid/list view |
| `/agents/:agentId` | AgentDashboardPage | Single agent deep-dive (tabs) |
| `/tasks` | TasksPage | Task queue with drag-drop |
| `/sessions` | SessionsPage | Session history list |
| `/sessions/:id/replay` | ReplayPage | Session replay viewer |
| `/leaderboard` | LeaderboardPage | Agent rankings |
| `/costs` | CostsPage | Cost attribution dashboard |
| `/alerts` | AlertsPage | Alert rules + history |
| `/topology` | TopologyPage | React Flow graph view |
| `/settings` | SettingsPage | Settings layout |
| `/settings/workspace` | nested | Workspace config |
| `/settings/team` | nested | Team members |
| `/settings/integrations` | nested | API keys, webhooks |
| `/settings/gamification` | nested | Mode toggle |
| `/settings/notifications` | nested | Notification prefs |
| `/settings/appearance` | nested | Theme, density |
| `/login` | LoginPage | Email/password login |
| `/register` | RegisterPage | Account creation |
| `/auth/callback/:provider` | OAuthCallbackPage | OAuth redirect handler |
| `/onboarding` | OnboardingPage | First-time setup |

### 7.3 Auth Guard

```tsx
// components/providers/AuthProvider.tsx (AuthGuard excerpt)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-surface-base" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

---

## 8. Real-Time Data Layer

### 8.1 WebSocket Service

The `WSClient` class defined in Section 3.5 handles the core WebSocket connection. The provider wraps it for React:

#### WebSocket Provider (`components/providers/WebSocketProvider.tsx`)

```tsx
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { WSClient } from '@/lib/ws-client';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

interface WSContextValue {
  client: WSClient | null;
  isConnected: boolean;
}

const WSContext = createContext<WSContextValue>({ client: null, isConnected: false });

export function useWSContext() {
  return useContext(WSContext);
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<WSClient | null>(null);
  const tokens = useAuthStore((s) => s.tokens);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  useEffect(() => {
    if (!tokens?.access_token || !activeWorkspace?.id) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${activeWorkspace.id}`;
    const client = new WSClient(wsUrl);
    clientRef.current = client;
    client.connect(tokens.access_token);

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [tokens?.access_token, activeWorkspace?.id]);

  return (
    <WSContext.Provider value={{ client: clientRef.current, isConnected: true }}>
      {children}
    </WSContext.Provider>
  );
}
```

### 8.2 SSE for Metrics Streams

#### SSE Client (`lib/sse-client.ts`)

```typescript
export class SSEClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(url: string, token: string): void {
    const fullUrl = `${url}?token=${token}`;
    this.eventSource = new EventSource(fullUrl);

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch {
        // Ignore parse errors
      }
    };

    this.eventSource.addEventListener('metric', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        this.emit('metric', data);
      } catch {
        // Ignore parse errors
      }
    });

    this.eventSource.addEventListener('heartbeat', () => {
      this.emit('heartbeat', null);
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.attemptReconnect(url, token);
    };
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  private attemptReconnect(url: string, token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = 1000 * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => this.connect(url, token), delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.eventSource?.close();
    this.eventSource = null;
    this.listeners.clear();
  }
}
```

### 8.3 Event Handling and Dispatch to Stores

The WebSocket dispatch logic (shown in `WSClient.dispatch()` in Section 3.5) handles:

1. **Agent state changes** -- Updates `agentsStore.updateAgentState()` and forwards to the XState actor via `actorRegistry`.
2. **Agent registration/removal** -- `agentsStore.upsertAgent()` or `agentsStore.removeAgent()`.
3. **Task events** -- Triggers TanStack Query invalidation:

```typescript
// Inside WSClient.dispatch(), after task events:
import { queryClient } from '@/components/providers/QueryProvider';
import { queryKeys } from '@/hooks/query-keys';

// On task.completed or task.failed:
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(event.agent_id) });
```

4. **Alerts** -- Adds toast notification and invalidates alert queries.
5. **Gamification events** (level_up, achievement.unlocked) -- Adds celebration toast and triggers canvas particle effects via the canvas store.

### 8.4 Optimistic Updates and Conflict Resolution

For task assignment (drag-drop), optimistic updates are implemented:

```typescript
export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, agentId }: { taskId: string; agentId: string }) =>
      tasksService.assignTask(taskId, agentId),

    onMutate: async ({ taskId, agentId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(
        queryKeys.tasks.list({ status: 'pending' }),
      );

      // Optimistically update: move task from pending to assigned
      queryClient.setQueryData(
        queryKeys.tasks.list({ status: 'pending' }),
        (old: { tasks: Array<{ id: string; status: string }> } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.filter((t) => t.id !== taskId),
          };
        },
      );

      return { previousTasks };
    },

    onError: (_err, _vars, context) => {
      // Revert optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.list({ status: 'pending' }),
          context.previousTasks,
        );
      }
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
}
```

**Conflict resolution strategy:** The server is the source of truth. When a WebSocket event arrives that contradicts an optimistic update (e.g., task assignment failed server-side), the TanStack Query invalidation triggered by the WS event automatically fetches the correct state and overwrites the optimistic value.

---

## 9. Chart & Dashboard Implementation

### 9.1 Recharts Components (Simple Charts)

#### Line Chart (`components/charts/LineChart.tsx`)

```tsx
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';

interface DataPoint {
  timestamp: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: DataPoint[];
  lines: Array<{
    dataKey: string;
    color: string;
    name: string;
    strokeDasharray?: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisFormatter?: (value: number) => string;
}

export function LineChart({
  data,
  lines,
  xAxisKey = 'timestamp',
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisFormatter,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLine
        data={data}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--oav-border-subtle, #1E2536)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          stroke="var(--oav-text-tertiary, #64748B)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--oav-text-tertiary, #64748B)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={yAxisFormatter}
        />
        <Tooltip content={<ChartTooltip />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--oav-text-secondary)' }}
          />
        )}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            name={line.name}
            strokeDasharray={line.strokeDasharray}
            animationDuration={800}
            animationEasing="ease-out"
          />
        ))}
      </RechartsLine>
    </ResponsiveContainer>
  );
}
```

### 9.2 ECharts Components (Complex Visualizations)

#### Time-Series Chart (`components/charts/TimeSeriesChart.tsx`)

```tsx
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

interface TimeSeriesProps {
  data: Array<[number, number]>; // [timestamp_ms, value]
  seriesName: string;
  color?: string;
  height?: number;
  areaFill?: boolean;
  yAxisLabel?: string;
}

export function TimeSeriesChart({
  data,
  seriesName,
  color = '#6366F1',
  height = 400,
  areaFill = true,
  yAxisLabel,
}: TimeSeriesProps) {
  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: { left: 60, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'time' as const,
        axisLine: { lineStyle: { color: '#2A3246' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        name: yAxisLabel,
        nameTextStyle: { color: '#94A3B8', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#1E2536' } },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#252D3F',
        borderColor: '#3D4760',
        textStyle: { color: '#F1F5F9', fontSize: 12 },
        axisPointer: {
          lineStyle: { color: '#3D4760' },
        },
      },
      series: [
        {
          name: seriesName,
          type: 'line',
          data,
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { color, width: 2 },
          areaStyle: areaFill
            ? {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: `${color}33` },
                    { offset: 1, color: `${color}05` },
                  ],
                },
              }
            : undefined,
          emphasis: {
            lineStyle: { width: 3 },
          },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          minValueSpan: 60 * 1000, // minimum 1 minute
        },
      ],
      // Enable WebGL renderer for large datasets
      progressive: 5000,
      progressiveThreshold: 10000,
    }),
    [data, seriesName, color, areaFill, yAxisLabel],
  );

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: data.length > 50000 ? 'canvas' : 'svg' }}
      notMerge
      lazyUpdate
    />
  );
}
```

### 9.3 Chart Container Pattern

```tsx
// components/charts/ChartContainer.tsx
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertTriangle } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: Error | null;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
}

export function ChartContainer({
  title,
  subtitle,
  isLoading,
  isEmpty,
  error,
  controls,
  children,
  className,
  minHeight = 240,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        'rounded-rounded bg-surface-overlay border border-border-default p-5',
        className,
      )}
      style={{ minHeight }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-oav-text-primary">{title}</h3>
          {subtitle && (
            <p className="text-xs text-oav-text-tertiary mt-0.5">{subtitle}</p>
          )}
        </div>
        {controls && <div className="flex items-center gap-2">{controls}</div>}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-state-error mb-2" />
          <p className="text-sm text-oav-text-secondary">Failed to load chart data</p>
          <p className="text-xs text-oav-text-tertiary mt-1">{error.message}</p>
        </div>
      )}

      {isEmpty && !isLoading && !error && (
        <EmptyState
          icon={<div className="h-8 w-8 rounded bg-surface-sunken" />}
          title="No data yet"
          description="Data will appear here once agents start reporting metrics."
        />
      )}

      {!isLoading && !error && !isEmpty && children}
    </div>
  );
}
```

### 9.4 Real-Time Chart Updates

For live-updating charts (e.g., cost ticker, active agent count), use a combination of SSE and local buffer:

```typescript
// hooks/useRealtimeMetric.ts
import { useState, useEffect, useRef } from 'react';
import { useSSE } from './useSSE';

interface DataPoint {
  timestamp: number;
  value: number;
}

export function useRealtimeMetric(
  metricName: string,
  maxPoints: number = 120,
  agentId?: string,
) {
  const [data, setData] = useState<DataPoint[]>([]);
  const bufferRef = useRef<DataPoint[]>([]);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { subscribe } = useSSE();

  useEffect(() => {
    const unsubscribe = subscribe('metric', (event: unknown) => {
      const metric = event as {
        metric_name: string;
        agent_id?: string;
        value: number;
        timestamp: number;
      };

      if (metric.metric_name !== metricName) return;
      if (agentId && metric.agent_id !== agentId) return;

      bufferRef.current.push({
        timestamp: metric.timestamp,
        value: metric.value,
      });
    });

    // Flush buffer to state every 1 second to batch renders
    flushIntervalRef.current = setInterval(() => {
      if (bufferRef.current.length === 0) return;

      setData((prev) => {
        const newData = [...prev, ...bufferRef.current].slice(-maxPoints);
        bufferRef.current = [];
        return newData;
      });
    }, 1000);

    return () => {
      unsubscribe();
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    };
  }, [metricName, agentId, maxPoints, subscribe]);

  return data;
}
```

---

## 10. Testing Strategy

### 10.1 Vitest Setup and Configuration

#### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
      '@machines': path.resolve(__dirname, './src/machines'),
      '@canvas': path.resolve(__dirname, './src/canvas'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.d.ts',
        'src/test/**',
        'src/types/**',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 75,
        statements: 75,
      },
    },
    mockReset: true,
  },
});
```

#### Test Setup (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock WebSocket
vi.mock('@/lib/ws-client', () => ({
  WSClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    registerActor: vi.fn(),
    unregisterActor: vi.fn(),
  })),
}));
```

### 10.2 Component Testing with Testing Library

#### Button Test (`components/common/Button.test.tsx`)

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Btn</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary-500');

    rerender(<Button variant="danger">Btn</Button>);
    expect(btn.className).toContain('bg-red-500');
  });

  it('applies size styles', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('h-11');
  });

  it('is not clickable when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

#### Store Test (`stores/agents.store.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentsStore } from './agents.store';
import type { Agent } from '@/types/agent';

const mockAgent: Agent = {
  id: 'agent-1',
  name: 'ResearchAgent',
  current_state: 'idle',
  level: 5,
  xp_total: 1200,
  tier_name: 'Starter',
  framework: 'langchain',
  total_tasks: 42,
  total_cost_usd: 3.50,
  total_tokens: 50000,
  total_errors: 2,
} as Agent;

describe('agents store', () => {
  beforeEach(() => {
    useAgentsStore.setState({
      agentMap: {},
      positions: {},
      visibleAgentIds: new Set(),
      totalCount: 0,
    });
  });

  it('upserts an agent', () => {
    useAgentsStore.getState().upsertAgent(mockAgent);
    expect(useAgentsStore.getState().agentMap['agent-1']).toEqual(mockAgent);
    expect(useAgentsStore.getState().totalCount).toBe(1);
  });

  it('updates agent state', () => {
    useAgentsStore.getState().upsertAgent(mockAgent);
    useAgentsStore.getState().updateAgentState('agent-1', 'working' as never);
    expect(useAgentsStore.getState().agentMap['agent-1'].current_state).toBe('working');
  });

  it('removes an agent', () => {
    useAgentsStore.getState().upsertAgent(mockAgent);
    useAgentsStore.getState().removeAgent('agent-1');
    expect(useAgentsStore.getState().agentMap['agent-1']).toBeUndefined();
    expect(useAgentsStore.getState().totalCount).toBe(0);
  });

  it('bulk upserts agents', () => {
    const agents = [
      { ...mockAgent, id: 'agent-1' },
      { ...mockAgent, id: 'agent-2', name: 'CoderAgent' },
    ];
    useAgentsStore.getState().bulkUpsert(agents);
    expect(useAgentsStore.getState().totalCount).toBe(2);
  });
});
```

### 10.3 Canvas/PixiJS Testing Approach

PixiJS components cannot be tested with jsdom because they require WebGL. The testing strategy uses three layers:

1. **Unit test pure logic** (CullingSystem, LODSystem, ForceLayout, CameraController) -- these are plain TypeScript classes with no PixiJS dependency.

```typescript
// canvas/systems/CullingSystem.test.ts
import { describe, it, expect } from 'vitest';
import { CullingSystem } from './CullingSystem';

describe('CullingSystem', () => {
  const system = new CullingSystem(1000, 800, 100);

  it('returns entities inside viewport', () => {
    const entities = [
      { id: 'a', x: 500, y: 400, width: 48, height: 48 },
      { id: 'b', x: 5000, y: 5000, width: 48, height: 48 },
    ];
    const viewport = { x: 0, y: 0, width: 1000, height: 800 };
    const visible = system.getVisibleEntities(entities, viewport);
    expect(visible).toEqual(['a']);
  });

  it('includes entities within margin', () => {
    const entities = [
      { id: 'a', x: -50, y: 400, width: 48, height: 48 },
    ];
    const viewport = { x: 0, y: 0, width: 1000, height: 800 };
    const visible = system.getVisibleEntities(entities, viewport);
    expect(visible).toEqual(['a']); // Within 100px margin
  });

  it('excludes entities outside margin', () => {
    const entities = [
      { id: 'a', x: -200, y: 400, width: 48, height: 48 },
    ];
    const viewport = { x: 0, y: 0, width: 1000, height: 800 };
    const visible = system.getVisibleEntities(entities, viewport);
    expect(visible).toEqual([]);
  });
});
```

2. **Integration test XState machines** -- test state transitions using `createActor`:

```typescript
// machines/agent.machine.test.ts
import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { agentMachine } from './agent.machine';

describe('Agent Machine', () => {
  it('starts in idle state', () => {
    const actor = createActor(agentMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
    actor.stop();
  });

  it('transitions idle -> initializing on TASK_ASSIGNED', () => {
    const actor = createActor(agentMachine);
    actor.start();
    actor.send({ type: 'TASK_ASSIGNED', taskId: 'task-1' });
    expect(actor.getSnapshot().value).toBe('initializing');
    actor.stop();
  });

  it('follows full happy path: idle -> initializing -> thinking -> executing -> thinking -> complete', () => {
    const actor = createActor(agentMachine);
    actor.start();
    actor.send({ type: 'TASK_ASSIGNED', taskId: 'task-1' });
    actor.send({ type: 'CONTEXT_LOADED' });
    expect(actor.getSnapshot().value).toBe('thinking');

    actor.send({ type: 'TOOL_CALLED', toolName: 'web_search' });
    expect(actor.getSnapshot().value).toBe('executing');
    expect(actor.getSnapshot().context.currentTool).toBe('web_search');

    actor.send({ type: 'TOOL_RESULT', result: {} });
    expect(actor.getSnapshot().value).toBe('thinking');

    actor.send({ type: 'ALL_TASKS_DONE' });
    expect(actor.getSnapshot().value).toBe('complete');
    actor.stop();
  });

  it('transitions to error on TOOL_ERROR', () => {
    const actor = createActor(agentMachine);
    actor.start();
    actor.send({ type: 'TASK_ASSIGNED', taskId: 'task-1' });
    actor.send({ type: 'CONTEXT_LOADED' });
    actor.send({ type: 'TOOL_CALLED', toolName: 'code_exec' });
    actor.send({ type: 'TOOL_ERROR', error: 'timeout', severity: 0.5 });
    expect(actor.getSnapshot().value).toBe('error');
    expect(actor.getSnapshot().context.errorSeverity).toBe(0.5);
    actor.stop();
  });

  it('recovers from error', () => {
    const actor = createActor(agentMachine);
    actor.start();
    actor.send({ type: 'TASK_ASSIGNED', taskId: 'task-1' });
    actor.send({ type: 'CONTEXT_LOADED' });
    actor.send({ type: 'TOOL_CALLED', toolName: 'search' });
    actor.send({ type: 'TOOL_ERROR', error: 'err', severity: 0.3 });
    actor.send({ type: 'CAN_RECOVER' });
    expect(actor.getSnapshot().value).toBe('recovering');
    actor.send({ type: 'RECOVERED' });
    expect(actor.getSnapshot().value).toBe('thinking');
    actor.stop();
  });

  it('terminates on SHUTDOWN from any state', () => {
    const actor = createActor(agentMachine);
    actor.start();
    actor.send({ type: 'TASK_ASSIGNED', taskId: 'task-1' });
    actor.send({ type: 'CONTEXT_LOADED' });
    actor.send({ type: 'SHUTDOWN' });
    expect(actor.getSnapshot().value).toBe('terminated');
    expect(actor.getSnapshot().status).toBe('done');
    actor.stop();
  });
});
```

3. **E2E visual tests** -- deferred to QA phase using Playwright with screenshot comparison.

### 10.4 Integration Tests for Real-Time Flows

Use MSW (Mock Service Worker) to intercept HTTP and WebSocket connections:

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/agents', () => {
    return HttpResponse.json({
      agents: [
        {
          id: 'agent-1',
          name: 'ResearchAgent',
          current_state: 'idle',
          level: 5,
          xp_total: 1200,
          framework: 'langchain',
        },
      ],
      total: 1,
      page: 1,
      page_size: 50,
    });
  }),

  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      user: { id: 'user-1', email: 'test@example.com', display_name: 'Test User' },
      tokens: {
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        expires_in: 900,
      },
    });
  }),

  http.get('/api/v1/agents/:agentId', ({ params }) => {
    return HttpResponse.json({
      id: params.agentId,
      name: 'ResearchAgent',
      current_state: 'idle',
      level: 12,
      xp_total: 4200,
      tier_name: 'Expert',
      total_tasks: 847,
      total_cost_usd: 15.42,
    });
  }),
];
```

### 10.5 Performance Testing (FPS Benchmarks)

Performance tests use a custom PixiJS benchmark harness that runs in a real browser (via Playwright):

```typescript
// test/performance/canvas-benchmark.ts

/**
 * FPS Benchmark targets (from Visualization Spec):
 * - 60fps with 50 agents at full fidelity (LOD HIGH)
 * - 60fps with 150 agents at LOD MEDIUM
 * - 60fps with 500 agents at LOD MINIMAL
 * - 30fps with 200 agents at reduced fidelity
 *
 * Test approach:
 * 1. Spin up a Playwright browser
 * 2. Load the app with mock data containing N agents
 * 3. Measure FPS over 5 seconds using requestAnimationFrame counting
 * 4. Assert FPS meets the threshold
 */

export interface BenchmarkResult {
  agentCount: number;
  lod: string;
  avgFps: number;
  minFps: number;
  p95Fps: number;
  passed: boolean;
}

export const BENCHMARK_TARGETS = [
  { agents: 50, lod: 'HIGH', minFps: 55 },
  { agents: 150, lod: 'MEDIUM', minFps: 55 },
  { agents: 500, lod: 'MINIMAL', minFps: 55 },
  { agents: 200, lod: 'MEDIUM', minFps: 28 },
] as const;

/**
 * FPS counter utility to inject into the page.
 */
export const FPS_COUNTER_SCRIPT = `
  window.__fpsSamples = [];
  let lastTime = performance.now();
  function measureFps() {
    const now = performance.now();
    const fps = 1000 / (now - lastTime);
    lastTime = now;
    window.__fpsSamples.push(fps);
    if (window.__fpsSamples.length < 300) { // 5 seconds at 60fps
      requestAnimationFrame(measureFps);
    }
  }
  requestAnimationFrame(measureFps);
`;
```

**Performance CI integration:** A GitHub Actions workflow (workflow_dispatch) runs the benchmark suite on a GPU-enabled runner and reports results as PR comments. This is not auto-triggered on push per the project build pipeline policy.

---

## Appendix: API Client Implementation

#### `lib/api-client.ts`

```typescript
import { useAuthStore } from '@/stores/auth.store';

const BASE_URL = '/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = useAuthStore.getState().tokens;
  if (!tokens?.refresh_token) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });

    if (!response.ok) {
      useAuthStore.getState().logout();
      return null;
    }

    const data = await response.json();
    useAuthStore.getState().updateAccessToken(data.access_token);
    return data.access_token;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  // Build URL with query params
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Get auth token
  const tokens = useAuthStore.getState().tokens;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (tokens?.access_token) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }

  let response = await fetch(url.toString(), {
    ...fetchOptions,
    headers,
  });

  // Handle 401 with token refresh
  if (response.status === 401 && tokens?.refresh_token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errorData?.detail || `Request failed with status ${response.status}`,
      errorData,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
```

---

## Appendix: Utility Functions

#### `lib/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

#### `lib/format.ts`

```typescript
import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(value: number, decimals: number = 2): string {
  return `$${value.toFixed(decimals)}`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatTokens(value: number): string {
  return formatCompactNumber(value);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatTimestamp(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm:ss');
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
```

#### `lib/xp-calculator.ts`

```typescript
/**
 * XP thresholds per level. Each entry is the cumulative XP required to reach that level.
 * Levels 1-50, exponential curve.
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Exponential curve: each level requires ~15% more XP than the previous
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l <= level; l++) {
    total += xpRequiredForLevel(l);
  }
  return total;
}

export function getLevelFromXp(totalXp: number): {
  level: number;
  xpIntoCurrentLevel: number;
  xpRequiredForNext: number;
  progressPercent: number;
} {
  let level = 1;
  let cumulativeXp = 0;

  while (level < 50) {
    const nextLevelXp = xpRequiredForLevel(level + 1);
    if (cumulativeXp + nextLevelXp > totalXp) break;
    cumulativeXp += nextLevelXp;
    level++;
  }

  const xpIntoCurrentLevel = totalXp - cumulativeXp;
  const xpRequiredForNext = xpRequiredForLevel(level + 1);
  const progressPercent = Math.min(1, xpIntoCurrentLevel / xpRequiredForNext);

  return { level, xpIntoCurrentLevel, xpRequiredForNext, progressPercent };
}

export function getTierName(level: number): string {
  if (level <= 5) return 'Starter';
  if (level <= 14) return 'Standard';
  if (level <= 24) return 'Advanced';
  if (level <= 34) return 'Elite';
  if (level <= 44) return 'Master';
  return 'Legendary';
}
```
```
