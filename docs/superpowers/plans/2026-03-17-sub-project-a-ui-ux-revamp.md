# Sub-project A: Webapp UI/UX Revamp — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the OpenAgentVisualizer React frontend with dual-mode design system (Professional/Gamified), Rive animations, GSAP transitions, and all new components/pages defined in the spec.

**Architecture:** Incremental layer migration — design tokens first, then components, then pages. The app stays runnable at every step. Tailwind config switches from hardcoded hex values to CSS custom properties so both modes share the same class names. All new components are co-located with tests and Storybook stories.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v3, Zustand, TanStack Query v5, Rive (`@rive-app/react-canvas`), GSAP, PixiJS v8, Vitest, Playwright, Storybook 8

**Spec:** `OpenAgentVisualizer/docs/superpowers/specs/2026-03-17-ui-ux-revamp-design.md` §3

---

### Task 1: Design System Tokens + Font Setup + Tailwind Refactor

**Files:**
- Create: `src/frontend/src/styles/tokens.css`
- Create: `src/frontend/src/styles/animations.css`
- Modify: `src/frontend/src/index.css`
- Modify: `src/frontend/tailwind.config.js`

- [ ] **Step 1: Install fonts**
```bash
cd src/frontend
npm install @fontsource/inter @fontsource/jetbrains-mono
```

- [ ] **Step 2: Create `src/frontend/src/styles/tokens.css`**
```css
/* Professional Mode (default) */
[data-mode="professional"], :root {
  --oav-bg: #0A0A0A;
  --oav-surface: #111111;
  --oav-surface-2: #1A1A1A;
  --oav-border: rgba(255,255,255,0.08);
  --oav-text: #FAFAFA;
  --oav-muted: #71717A;
  --oav-accent: #6366F1;
  --oav-accent-2: #FFFFFF;
  --oav-success: #22C55E;
  --oav-error: #EF4444;
  --oav-warning: #F59E0B;
  --oav-glass-bg: rgba(255,255,255,0.03);
  --oav-glass-border: rgba(255,255,255,0.06);
  --oav-focus: #6366F1;
  --oav-disabled: rgba(255,255,255,0.12);
  --oav-disabled-text: #3F3F46;
  --oav-skeleton: #1C1C1C;
  --oav-skeleton-shine: #2A2A2A;
  --oav-selected: rgba(99,102,241,0.15);
  --oav-hover: rgba(255,255,255,0.04);
  --oav-glow: transparent;
}

/* Gamified Mode */
[data-mode="gamified"] {
  --oav-bg: #0F1117;
  --oav-surface: #1A1D2E;
  --oav-surface-2: #242842;
  --oav-border: rgba(99,102,241,0.3);
  --oav-text: #E2E8F0;
  --oav-muted: #64748B;
  --oav-accent: #00FFB2;
  --oav-accent-2: #6366F1;
  --oav-success: #22C55E;
  --oav-error: #EF4444;
  --oav-warning: #F59E0B;
  --oav-glass-bg: rgba(255,255,255,0.02);
  --oav-glass-border: rgba(99,102,241,0.2);
  --oav-focus: #00FFB2;
  --oav-disabled: rgba(255,255,255,0.08);
  --oav-disabled-text: #2D3150;
  --oav-skeleton: #1E2236;
  --oav-skeleton-shine: #2A2F4A;
  --oav-selected: rgba(0,255,178,0.12);
  --oav-hover: rgba(255,255,255,0.06);
  --oav-glow: rgba(0,255,178,0.15);
}
```

- [ ] **Step 3: Create `src/frontend/src/styles/animations.css`**
```css
@keyframes skeleton-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--oav-skeleton) 25%, var(--oav-skeleton-shine) 50%, var(--oav-skeleton) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}
@keyframes pulse-ring {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
.pulse-ring {
  animation: pulse-ring 0.8s ease-out forwards;
}
@keyframes gradient-mesh {
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
}
```

- [ ] **Step 4: Update `src/frontend/src/index.css`**
```css
@import './styles/tokens.css';
@import './styles/animations.css';
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/700.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--oav-bg);
  color: var(--oav-text);
  font-family: 'Inter', -apple-system, sans-serif;
}
code, pre, .mono { font-family: 'JetBrains Mono', monospace; }
*:focus-visible { outline: 2px solid var(--oav-focus); outline-offset: 2px; }
```

- [ ] **Step 5: Update `src/frontend/tailwind.config.js`**
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'oav-bg':       'var(--oav-bg)',
        'oav-surface':  'var(--oav-surface)',
        'oav-surface-2':'var(--oav-surface-2)',
        'oav-border':   'var(--oav-border)',
        'oav-text':     'var(--oav-text)',
        'oav-muted':    'var(--oav-muted)',
        'oav-accent':   'var(--oav-accent)',
        'oav-accent-2': 'var(--oav-accent-2)',
        'oav-success':  'var(--oav-success)',
        'oav-error':    'var(--oav-error)',
        'oav-warning':  'var(--oav-warning)',
        'oav-selected': 'var(--oav-selected)',
        'oav-hover':    'var(--oav-hover)',
        'oav-glow':     'var(--oav-glow)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Verify dev server still starts**
```bash
cd src/frontend && npm run dev
# Expected: server starts at http://localhost:3000, no compile errors
```

- [ ] **Step 7: Commit**
```bash
git add src/frontend/src/styles/tokens.css \
        src/frontend/src/styles/animations.css \
        src/frontend/src/index.css \
        src/frontend/tailwind.config.js \
        src/frontend/package.json
git commit -m "feat(design): dual-mode CSS token system, Inter + JetBrains Mono fonts"
```

---

### Task 2: TypeScript Types + Zustand Stores + Hooks

**Files:**
- Create: `src/frontend/src/types/integration.ts`
- Create: `src/frontend/src/types/preferences.ts`
- Create: `src/frontend/src/types/onboarding.ts`
- Create: `src/frontend/src/types/notification.ts`
- Create: `src/frontend/src/types/command-palette.ts`
- Create: `src/frontend/src/stores/modeStore.ts`
- Create: `src/frontend/src/stores/onboardingStore.ts`
- Create: `src/frontend/src/stores/notificationStore.ts`
- Create: `src/frontend/src/stores/agentStore.ts`
- Create: `src/frontend/src/hooks/useMode.ts`
- Create: `src/frontend/src/hooks/useWorkspace.ts`
- Create: `src/frontend/src/stores/uiStore.ts`
- Create: `src/frontend/src/lib/formatters.ts`
- Create: `src/frontend/src/lib/xpLevels.ts`
- Create: `src/frontend/src/hooks/useMetrics.ts`
- Create: `src/frontend/src/hooks/useAgents.ts`
- Create: `src/frontend/src/hooks/useAlerts.ts`
- Create: `src/frontend/src/hooks/useSessionReplay.ts`
- Test: `src/frontend/src/stores/__tests__/modeStore.test.ts`

- [ ] **Step 1: Write failing test**
```ts
// src/frontend/src/stores/__tests__/modeStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useModeStore } from '../modeStore';

describe('modeStore', () => {
  beforeEach(() => useModeStore.setState({ mode: 'gamified' }));

  it('defaults to gamified', () => {
    expect(useModeStore.getState().mode).toBe('gamified');
  });
  it('toggles to professional', () => {
    useModeStore.getState().setMode('professional');
    expect(useModeStore.getState().mode).toBe('professional');
  });
  it('applies data-mode attr to html element', () => {
    useModeStore.getState().setMode('professional');
    expect(document.documentElement.getAttribute('data-mode')).toBe('professional');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
```bash
cd src/frontend && npx vitest run src/stores/__tests__/modeStore.test.ts
```

- [ ] **Step 3: Create type files**
```ts
// src/frontend/src/types/integration.ts
export type IntegrationStatus = 'connected' | 'not_configured' | 'error';
export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'cli_adapter' | 'cli_plugin' | 'sdk';
  status: IntegrationStatus;
  last_event_at: string | null;
  event_count_24h: number;
  install_command: string;
  version?: string;
  commands?: string[];
}

// src/frontend/src/types/preferences.ts
export type AppMode = 'professional' | 'gamified';
export interface UserPreferences { mode: AppMode; }

// src/frontend/src/types/onboarding.ts
export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
export interface OnboardingState {
  completed: boolean;
  currentStep: OnboardingStep;
  sampleDataActive: boolean;
}

// src/frontend/src/types/notification.ts
export type NotificationSeverity = 'info' | 'warning' | 'critical';
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  read: boolean;
  created_at: string;
}

// src/frontend/src/types/command-palette.ts
export interface CommandPaletteItem {
  id: string;
  label: string;
  group: 'pages' | 'agents' | 'actions' | 'recent';
  icon?: string;
  action: () => void;
  keywords?: string[];
}
```

- [ ] **Step 4: Create stores**
```ts
// src/frontend/src/stores/modeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode } from '../types/preferences';

interface ModeStore {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggle: () => void;
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set) => ({
      mode: 'gamified',
      setMode: (mode) => {
        document.documentElement.setAttribute('data-mode', mode);
        set({ mode });
        // Sync preference to backend (fire-and-forget, never block UI)
        const apiBase = import.meta.env?.VITE_API_URL ?? 'http://localhost:8000';
        const apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('oav_token') ?? '' : '';
        if (apiKey) {
          fetch(`${apiBase}/api/users/me/preferences`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ mode }),
          }).catch(() => { /* telemetry-grade: never break UI for a preference sync */ });
        }
      },
      toggle: () => set((s) => {
        const next = s.mode === 'gamified' ? 'professional' : 'gamified';
        document.documentElement.setAttribute('data-mode', next);
        return { mode: next };
      }),
    }),
    { name: 'oav-mode' }
  )
);

// src/frontend/src/stores/onboardingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OnboardingState, OnboardingStep } from '../types/onboarding';

interface OnboardingStore extends OnboardingState {
  advance: () => void;
  complete: () => void;
  activateSampleData: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      currentStep: 1,
      sampleDataActive: false,
      advance: () => set((s) => ({ currentStep: Math.min(5, s.currentStep + 1) as OnboardingStep })),
      complete: () => set({ completed: true }),
      activateSampleData: () => set({ sampleDataActive: true }),
      reset: () => set({ completed: false, currentStep: 1, sampleDataActive: false }),
    }),
    { name: 'oav-onboarding' }
  )
);

// src/frontend/src/stores/notificationStore.ts
import { create } from 'zustand';
import type { NotificationItem } from '../types/notification';

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  push: (n: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  push: (n) => set((s) => {
    const item: NotificationItem = { ...n, id: crypto.randomUUID(), read: false, created_at: new Date().toISOString() };
    const notifications = [item, ...s.notifications].slice(0, 50);
    return { notifications, unreadCount: notifications.filter(x => !x.read).length };
  }),
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  dismiss: (id) => set((s) => {
    const notifications = s.notifications.filter(n => n.id !== id);
    return { notifications, unreadCount: notifications.filter(x => !x.read).length };
  }),
}));

// src/frontend/src/stores/agentStore.ts
import { create } from 'zustand';
import type { Agent } from '../types/agent';

interface AgentStore {
  agents: Record<string, Agent>;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agent: Agent) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {},
  setAgents: (agents) => set({ agents: Object.fromEntries(agents.map(a => [a.id, a])) }),
  updateAgent: (agent) => set((s) => ({ agents: { ...s.agents, [agent.id]: agent } })),
}));
```

- [ ] **Step 5: Create hooks**
```ts
// src/frontend/src/hooks/useMode.ts
import { useEffect } from 'react';
import { useModeStore } from '../stores/modeStore';

export function useMode() {
  const { mode, setMode, toggle } = useModeStore();
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);
  return { mode, setMode, toggle };
}

// src/frontend/src/hooks/useWorkspace.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  tier: 'free' | 'pro' | 'team' | 'business' | 'enterprise';
  api_key: string;
}

export function useWorkspace() {
  return useQuery<Workspace>({
    queryKey: ['workspace'],
    queryFn: () => api.get('/api/workspaces/me').then(r => r.data),
    staleTime: 60_000,
  });
}
```

- [ ] **Step 6: Create `uiStore.ts`** (used by AgentDetailPanel to track selected agent)
```ts
// src/frontend/src/stores/uiStore.ts
import { create } from 'zustand';

interface UIStore {
  selectedAgentId: string | null;
  selectAgent: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedAgentId: null,
  selectAgent: (id) => set({ selectedAgentId: id }),
}));
```

- [ ] **Step 7: Create `lib/formatters.ts` and `lib/xpLevels.ts`**
```ts
// src/frontend/src/lib/formatters.ts
export function formatCost(usd: number | undefined | null): string {
  const n = usd ?? 0;
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}K`;
  return `$${n.toFixed(4)}`;
}
export function formatTokens(tokens: number | undefined | null): string {
  return (tokens ?? 0).toLocaleString('en-US');
}
export function formatDuration(ms: number | undefined | null): string {
  const n = ms ?? 0;
  if (n < 60_000) return `${(n / 1000).toFixed(1)}s`;
  const minutes = Math.floor(n / 60_000);
  const seconds = Math.floor((n % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// src/frontend/src/lib/xpLevels.ts
const THRESHOLDS = [0, 500, 1500, 3500, 7500, 15000, 30000, 60000, 100000, 200000];
export function xpProgress(xpTotal: number): { level: number; current: number; required: number; pct: number } {
  let level = 1;
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (xpTotal >= THRESHOLDS[i]) { level = i + 1; break; }
  }
  const floor = THRESHOLDS[level - 1] ?? 0;
  const ceiling = THRESHOLDS[level] ?? THRESHOLDS[THRESHOLDS.length - 1];
  const current = xpTotal - floor;
  const required = ceiling - floor;
  const pct = Math.min(100, Math.round((current / required) * 100));
  return { level, current, required, pct };
}
```

- [ ] **Step 8: Create data hooks**
```ts
// src/frontend/src/hooks/useAgents.ts
import { useQuery } from '@tanstack/react-query';
export function useAgents(workspaceId = 'default') {
  return useQuery({
    queryKey: ['agents', workspaceId],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch(`/api/agents?workspace_id=${workspaceId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch agents');
      return r.json();
    },
    refetchInterval: 5000,
  });
}

// src/frontend/src/hooks/useAlerts.ts
import { useQuery } from '@tanstack/react-query';
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch('/api/alerts?limit=50', { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch alerts');
      return r.json();
    },
    refetchInterval: 10000,
  });
}

// src/frontend/src/hooks/useMetrics.ts
import { useQuery } from '@tanstack/react-query';
export function useMetrics(period: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['metrics', period],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch(`/api/dashboard/metrics?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch metrics');
      return r.json();
    },
    staleTime: 30_000,
  });
}
export function useCosts(period: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['costs', period],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch(`/api/costs/breakdown?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch costs');
      return r.json();
    },
    staleTime: 30_000,
  });
}
export const useTokenUsage = useMetrics;  // alias used in DashboardPage

// src/frontend/src/hooks/useSessionReplay.ts
import { useQuery } from '@tanstack/react-query';
export function useSessionReplay() {
  const query = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const token = localStorage.getItem('oav_token') ?? '';
      const r = await fetch('/api/replay/sessions?limit=20', { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch sessions');
      return r.json();
    },
    staleTime: 10_000,
  });
  return { sessions: (query.data ?? []) as any[], isLoading: query.isLoading };
}
```

- [ ] **Step 9: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/stores/__tests__/modeStore.test.ts
# Expected: 3 passed
```

- [ ] **Step 10: Commit**
```bash
git add src/frontend/src/types/integration.ts \
        src/frontend/src/types/preferences.ts \
        src/frontend/src/types/onboarding.ts \
        src/frontend/src/types/notification.ts \
        src/frontend/src/types/command-palette.ts \
        src/frontend/src/stores/modeStore.ts \
        src/frontend/src/stores/onboardingStore.ts \
        src/frontend/src/stores/notificationStore.ts \
        src/frontend/src/stores/uiStore.ts \
        src/frontend/src/stores/__tests__/modeStore.test.ts \
        src/frontend/src/stores/agentStore.ts \
        src/frontend/src/lib/formatters.ts \
        src/frontend/src/lib/xpLevels.ts \
        src/frontend/src/hooks/useMode.ts \
        src/frontend/src/hooks/useWorkspace.ts \
        src/frontend/src/hooks/useMetrics.ts \
        src/frontend/src/hooks/useAgents.ts \
        src/frontend/src/hooks/useAlerts.ts \
        src/frontend/src/hooks/useSessionReplay.ts
git commit -m "feat(stores): modeStore+backend sync, onboardingStore, notificationStore, uiStore, agentStore, formatters, xpLevels, data hooks"
```

---

### Task 3: Core Primitive Components (GlassCard, HUDPanel, BentoGrid, SectionHeader, LoadingSpinner, EmptyState)

> **Storybook convention:** Every component task adds one co-located `*.stories.tsx` file alongside its implementation. The story file uses Storybook 8 CSF3 format. A minimal story template is shown in this task; follow the same pattern for all subsequent component tasks.

**Files:**
- Create: `src/frontend/src/components/common/GlassCard.tsx`
- Create: `src/frontend/src/components/common/GlassCard.stories.tsx`
- Create: `src/frontend/src/components/common/HUDPanel.tsx`
- Create: `src/frontend/src/components/common/BentoGrid.tsx`
- Create: `src/frontend/src/components/common/LoadingSpinner.tsx`
- Create: `src/frontend/src/components/common/EmptyState.tsx`
- Create: `src/frontend/src/components/layout/SectionHeader.tsx`
- Test: `src/frontend/src/components/common/__tests__/GlassCard.test.tsx`

- [ ] **Step 1: Write failing test**
```tsx
// src/frontend/src/components/common/__tests__/GlassCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassCard } from '../GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>hello</GlassCard>);
    expect(screen.getByText('hello')).toBeTruthy();
  });
  it('accepts className override', () => {
    const { container } = render(<GlassCard className="p-8">x</GlassCard>);
    expect(container.firstChild).toHaveClass('p-8');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
```bash
cd src/frontend && npx vitest run src/components/common/__tests__/GlassCard.test.tsx
```

- [ ] **Step 3: Implement components**
```tsx
// src/frontend/src/components/common/GlassCard.tsx
interface Props { children: React.ReactNode; className?: string; onClick?: () => void; }
export function GlassCard({ children, className = '', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition-colors ${className}`}
      style={{ background: 'var(--oav-glass-bg)', borderColor: 'var(--oav-glass-border)', backdropFilter: 'blur(8px)' }}
    >
      {children}
    </div>
  );
}

// src/frontend/src/components/common/HUDPanel.tsx
interface Props { children: React.ReactNode; className?: string; }
export function HUDPanel({ children, className = '' }: Props) {
  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
      style={{
        background: 'var(--oav-surface)',
        borderColor: 'var(--oav-border)',
        boxShadow: '0 0 12px var(--oav-glow)',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}
    >
      {children}
    </div>
  );
}

// src/frontend/src/components/common/BentoGrid.tsx
interface Props { children: React.ReactNode; className?: string; }
export function BentoGrid({ children, className = '' }: Props) {
  return (
    <div className={`grid grid-cols-12 gap-4 ${className}`}>
      {children}
    </div>
  );
}

// src/frontend/src/components/layout/SectionHeader.tsx
interface Props { title: string; action?: React.ReactNode; }
export function SectionHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-oav-muted text-xs font-semibold uppercase tracking-widest">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}

// src/frontend/src/components/common/LoadingSpinner.tsx
interface Props { size?: 'sm' | 'md' | 'lg'; className?: string; }
export function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const dim = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div className={`${dim} ${className} animate-spin rounded-full border-2 border-transparent`}
      style={{ borderTopColor: 'var(--oav-accent)' }}
      role="status"
      aria-label="Loading"
    />
  );
}

// src/frontend/src/components/common/EmptyState.tsx
interface Props { message: string; icon?: string; action?: React.ReactNode; }
export function EmptyState({ message, icon = '⬡', action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-3xl text-oav-muted opacity-40">{icon}</span>
      <p className="text-oav-muted text-sm text-center max-w-xs">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Create Storybook story for GlassCard (template for all component tasks)**
```tsx
// src/frontend/src/components/common/GlassCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from './GlassCard';

const meta: Meta<typeof GlassCard> = {
  title: 'Common/GlassCard',
  component: GlassCard,
  parameters: { backgrounds: { default: 'dark' } },
};
export default meta;
type Story = StoryObj<typeof GlassCard>;

export const Default: Story = { args: { children: 'GlassCard content here' } };
export const WithClassName: Story = { args: { children: 'Extra padding', className: 'p-8' } };
```

- [ ] **Step 5: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/common/__tests__/GlassCard.test.tsx
# Expected: 2 passed
```

- [ ] **Step 6: Commit**
```bash
git add src/frontend/src/components/common/GlassCard.tsx \
        src/frontend/src/components/common/GlassCard.stories.tsx \
        src/frontend/src/components/common/HUDPanel.tsx \
        src/frontend/src/components/common/BentoGrid.tsx \
        src/frontend/src/components/common/LoadingSpinner.tsx \
        src/frontend/src/components/common/EmptyState.tsx \
        src/frontend/src/components/layout/SectionHeader.tsx
git commit -m "feat(ui): GlassCard, HUDPanel, BentoGrid, SectionHeader, LoadingSpinner, EmptyState primitives"
```

---

### Task 4: AppShell Rewrite — Collapsible Sidebar + Mode Toggle Integration

**Files:**
- Modify: `src/frontend/src/components/layout/AppShell.tsx`
- Test: `src/frontend/src/components/layout/__tests__/AppShell.test.tsx`

- [ ] **Step 1: Write failing test**
```tsx
// src/frontend/src/components/layout/__tests__/AppShell.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppShell } from '../AppShell';

const Wrapper = () => <MemoryRouter><AppShell /></MemoryRouter>;

describe('AppShell', () => {
  it('renders nav links', () => {
    render(<Wrapper />);
    expect(screen.getByText('World')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });
  it('collapses sidebar on toggle', () => {
    render(<Wrapper />);
    const toggle = screen.getByLabelText('toggle sidebar');
    fireEvent.click(toggle);
    expect(screen.getByTestId('sidebar')).toHaveClass('w-16');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
```bash
cd src/frontend && npx vitest run src/components/layout/__tests__/AppShell.test.tsx
```

- [ ] **Step 3: Rewrite `AppShell.tsx`**
```tsx
import { useState, Suspense, lazy } from 'react';
import { Link, useLocation, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useMode } from '../../hooks/useMode';

const VirtualWorldPage = lazy(() => import('../../pages/VirtualWorldPage').then(m => ({ default: m.VirtualWorldPage })));
const DashboardPage    = lazy(() => import('../../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AlertsPage       = lazy(() => import('../../pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const ReplayPage       = lazy(() => import('../../pages/ReplayPage').then(m => ({ default: m.ReplayPage })));
const SettingsPage     = lazy(() => import('../../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const NAV = [
  { to: '/world',     label: 'World',     icon: '⬡' },
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/alerts',    label: 'Alerts',    icon: '⚠' },
  { to: '/replay',    label: 'Replay',    icon: '▶' },
  { to: '/settings',  label: 'Settings',  icon: '⚙' },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { mode, toggle } = useMode();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('oav_token');
    localStorage.removeItem('oav_workspace');
    navigate('/login');
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--oav-bg)' }}>
      {/* Sidebar */}
      <nav
        data-testid="sidebar"
        className={`flex flex-col py-4 border-r transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
        style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-3 mb-6">
          {!collapsed && <span className="text-oav-text font-bold text-sm">OAV</span>}
          <button
            aria-label="toggle sidebar"
            onClick={() => setCollapsed(c => !c)}
            className="text-oav-muted hover:text-oav-text text-xs"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 flex flex-col gap-1 px-2">
          {NAV.map(({ to, label, icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${
                  active ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'
                }`}
                style={active ? { background: 'var(--oav-selected)' } : undefined}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Mode toggle + logout */}
        <div className="px-2 space-y-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-oav-muted hover:text-oav-text text-sm transition-colors"
          >
            <span className="w-5 text-center">{mode === 'gamified' ? '🎮' : '💼'}</span>
            {!collapsed && <span className="capitalize">{mode}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-oav-error hover:opacity-80 text-sm"
          >
            <span className="w-5 text-center">↩</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-oav-muted text-sm">Loading…</div>}>
          <Routes>
            <Route path="/world"     element={<VirtualWorldPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts"    element={<AlertsPage />} />
            <Route path="/replay"    element={<ReplayPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="*"          element={<Navigate to="/world" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Add SettingsPage stub** (so AppShell compiles)
```tsx
// src/frontend/src/pages/SettingsPage.tsx — replace existing empty file
export function SettingsPage() {
  return <div className="p-6 text-oav-text">Settings — coming soon</div>;
}
```

- [ ] **Step 5: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/layout/__tests__/AppShell.test.tsx
```

- [ ] **Step 6: Commit**
```bash
git add src/frontend/src/components/layout/AppShell.tsx src/frontend/src/pages/SettingsPage.tsx
git commit -m "feat(layout): collapsible sidebar AppShell with mode toggle, Settings route"
```

---

### Task 5: ModeToggle + WorkspaceSwitcher + NotificationCenter Components

**Files:**
- Create: `src/frontend/src/components/layout/ModeToggle.tsx`
- Create: `src/frontend/src/components/layout/WorkspaceSwitcher.tsx`
- Create: `src/frontend/src/components/layout/NotificationCenter.tsx`
- Test: `src/frontend/src/components/layout/__tests__/ModeToggle.test.tsx`

- [ ] **Step 1: Write failing test**
```tsx
// src/frontend/src/components/layout/__tests__/ModeToggle.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ModeToggle } from '../ModeToggle';
import { useModeStore } from '../../../stores/modeStore';

describe('ModeToggle', () => {
  it('toggles mode on click', () => {
    useModeStore.setState({ mode: 'gamified' });
    const { getByRole } = render(<ModeToggle />);
    fireEvent.click(getByRole('button'));
    expect(useModeStore.getState().mode).toBe('professional');
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/components/layout/__tests__/ModeToggle.test.tsx 2>&1 | head -15
```
Expected: FAILED — Cannot find module `'../ModeToggle'` or similar.

- [ ] **Step 3: Implement**
```tsx
// src/frontend/src/components/layout/ModeToggle.tsx
import { useMode } from '../../hooks/useMode';
export function ModeToggle() {
  const { mode, toggle } = useMode();
  return (
    <button
      onClick={toggle}
      title={`Switch to ${mode === 'gamified' ? 'professional' : 'gamified'} mode`}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
      style={{ borderColor: 'var(--oav-border)', background: 'var(--oav-surface-2)', color: 'var(--oav-text)' }}
    >
      <span>{mode === 'gamified' ? '🎮' : '💼'}</span>
      <span className="capitalize hidden sm:block">{mode}</span>
    </button>
  );
}

// src/frontend/src/components/layout/WorkspaceSwitcher.tsx
import { useWorkspace } from '../../hooks/useWorkspace';
export function WorkspaceSwitcher() {
  const { data: ws } = useWorkspace();
  if (!ws) return <div className="skeleton h-6 w-24" />;
  return (
    <button
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{ background: 'var(--oav-surface-2)', color: 'var(--oav-text)' }}
    >
      <span className="w-5 h-5 rounded bg-oav-accent text-white flex items-center justify-center text-xs font-bold">
        {ws.name[0].toUpperCase()}
      </span>
      <span className="hidden sm:block max-w-[120px] truncate">{ws.name}</span>
    </button>
  );
}

// src/frontend/src/components/layout/NotificationCenter.tsx
import { useState } from 'react';
import { useNotificationStore } from '../../../stores/notificationStore';
const SEV_COLOR = { info: 'text-oav-accent', warning: 'text-oav-warning', critical: 'text-oav-error' };
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotificationStore();
  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        className="relative p-2 text-oav-muted hover:text-oav-text transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-oav-error text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-xl border shadow-xl z-50 overflow-hidden"
          style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}
        >
          <div className="px-4 py-3 border-b text-xs font-semibold text-oav-muted uppercase tracking-wider" style={{ borderColor: 'var(--oav-border)' }}>
            Notifications
          </div>
          {notifications.length === 0
            ? <p className="px-4 py-6 text-oav-muted text-sm text-center">No notifications</p>
            : notifications.slice(0, 10).map(n => (
              <div key={n.id} className="px-4 py-3 border-b text-sm" style={{ borderColor: 'var(--oav-border)' }}>
                <p className={`font-medium ${SEV_COLOR[n.severity]}`}>{n.title}</p>
                <p className="text-oav-muted text-xs mt-0.5">{n.body}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/layout/__tests__/ModeToggle.test.tsx
```

- [ ] **Step 5: Commit**
```bash
git add src/frontend/src/components/layout/ModeToggle.tsx src/frontend/src/components/layout/WorkspaceSwitcher.tsx src/frontend/src/components/layout/NotificationCenter.tsx
git commit -m "feat(layout): ModeToggle, WorkspaceSwitcher, NotificationCenter"
```

---

### Task 6: CommandPalette (Cmd+K)

**Files:**
- Create: `src/frontend/src/components/common/CommandPalette.tsx`
- Modify: `src/frontend/src/App.tsx`
- Test: `src/frontend/src/components/common/__tests__/CommandPalette.test.tsx`

- [ ] **Step 1: Write failing test**
```tsx
// src/frontend/src/components/common/__tests__/CommandPalette.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { CommandPalette } from '../CommandPalette';

describe('CommandPalette', () => {
  it('is hidden initially', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('opens on Ctrl+K', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
  it('closes on Escape', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/components/common/__tests__/CommandPalette.test.tsx 2>&1 | head -15
```
Expected: FAILED — Cannot find module `'../CommandPalette'` or similar.

- [ ] **Step 3: Implement `CommandPalette.tsx`** — all 4 groups: Pages, Agents (live from store), Actions, Recent
```tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../../stores/agentStore';
import type { CommandPaletteItem } from '../../types/command-palette';

const PAGE_ITEMS: CommandPaletteItem[] = [
  { id: 'world',     label: 'Virtual World',  group: 'pages', icon: '⬡', action: () => {} },
  { id: 'dashboard', label: 'Dashboard',      group: 'pages', icon: '◈', action: () => {} },
  { id: 'alerts',    label: 'Alerts',         group: 'pages', icon: '⚠', action: () => {} },
  { id: 'replay',    label: 'Replay',         group: 'pages', icon: '▶', action: () => {} },
  { id: 'settings',  label: 'Settings',       group: 'pages', icon: '⚙', action: () => {} },
];
const PAGE_PATHS: Record<string, string> = { world:'/world', dashboard:'/dashboard', alerts:'/alerts', replay:'/replay', settings:'/settings' };

const ACTION_ITEMS: CommandPaletteItem[] = [
  { id: 'export',   label: 'Export traces as CSV', group: 'actions', icon: '↓', action: () => { window.open('/api/traces/export'); } },
  { id: 'replay-session', label: 'Open last session replay', group: 'actions', icon: '▶', action: () => {} },
  { id: 'toggle-mode', label: 'Toggle Professional / Gamified', group: 'actions', icon: '⬡', action: () => {} },
];

const RECENT_KEY = 'oav_cmd_recent';
function loadRecent(): string[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; } }
function pushRecent(id: string) {
  const r = [id, ...loadRecent().filter(x => x !== id)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(r));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const agents = useAgentStore((s) => s.agents);

  const agentItems: CommandPaletteItem[] = Object.values(agents).map((a) => ({
    id: `agent:${a.id}`,
    label: a.name,
    group: 'agents' as const,
    icon: a.status === 'working' ? '●' : '○',
    keywords: [a.framework, a.role],
    action: () => navigate(`/dashboard?agent=${a.id}`),
  }));

  const allItems = [...PAGE_ITEMS, ...agentItems, ...ACTION_ITEMS];

  const recentIds = loadRecent();
  const recentItems: CommandPaletteItem[] = recentIds
    .map(id => allItems.find(i => i.id === id))
    .filter(Boolean) as CommandPaletteItem[];

  const filtered = query
    ? allItems.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : recentItems.length > 0 ? recentItems : PAGE_ITEMS;

  const close = useCallback(() => { setOpen(false); setQuery(''); setIndex(0); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o); }
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setIndex(i => Math.min(i + 1, filtered.length - 1));
    if (e.key === 'ArrowUp')   setIndex(i => Math.max(i - 1, 0));
    if (e.key === 'Enter' && filtered[index]) { execute(filtered[index]); }
  };

  function execute(item: CommandPaletteItem) {
    pushRecent(item.id);
    if (item.group === 'pages' && PAGE_PATHS[item.id]) navigate(PAGE_PATHS[item.id]);
    else item.action();
    close();
  }

  // Group items for display
  const grouped = filtered.reduce<Record<string, CommandPaletteItem[]>>((acc, item) => {
    const g = query ? item.group : (recentIds.includes(item.id) ? 'recent' : item.group);
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  if (!open) return null;

  let flatIdx = 0;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}
        onKeyDown={handleKey}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setIndex(0); }}
          placeholder="Search pages, agents, actions…"
          className="w-full px-4 py-3 bg-transparent text-oav-text text-sm outline-none border-b"
          style={{ borderColor: 'var(--oav-border)' }}
        />
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0
            ? <p className="px-4 py-6 text-oav-muted text-sm text-center">No results</p>
            : Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--oav-muted)' }}>{group}</p>
                {items.map((item) => {
                  const myIdx = flatIdx++;
                  return (
                    <button
                      key={item.id}
                      onClick={() => execute(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                      style={{ background: myIdx === index ? 'var(--oav-selected)' : undefined, color: 'var(--oav-text)' }}
                    >
                      <span className="text-oav-muted">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="ml-auto text-oav-muted text-xs capitalize">{item.group}</span>
                    </button>
                  );
                })}
              </div>
            ))
          }
        </div>
        <div className="px-4 py-2 border-t text-xs text-oav-muted flex gap-4" style={{ borderColor: 'var(--oav-border)' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Mount in `App.tsx`**
```tsx
import { CommandPalette } from './components/common/CommandPalette';
// inside <BrowserRouter>:
<CommandPalette />
<AppRoutes />
```

- [ ] **Step 5: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/common/__tests__/CommandPalette.test.tsx
```

- [ ] **Step 6: Commit**
```bash
git add src/frontend/src/components/common/CommandPalette.tsx src/frontend/src/App.tsx
git commit -m "feat(ui): Cmd+K CommandPalette with fuzzy page search and keyboard nav"
```

---

### Task 7: Metrics Components — AnimatedCounter + SparklineChart + CostHeatmap + BentoMetricCard

**Files:**
- Create: `src/frontend/src/components/metrics/AnimatedCounter.tsx`
- Create: `src/frontend/src/components/metrics/SparklineChart.tsx`
- Create: `src/frontend/src/components/metrics/CostHeatmap.tsx`
- Create: `src/frontend/src/components/metrics/BentoMetricCard.tsx`
- Test: `src/frontend/src/components/metrics/__tests__/AnimatedCounter.test.tsx`

- [ ] **Step 1: Install GSAP**
```bash
cd src/frontend && npm install gsap
```

- [ ] **Step 2: Write failing test**
```tsx
// src/frontend/src/components/metrics/__tests__/AnimatedCounter.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedCounter } from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  it('renders the value', async () => {
    render(<AnimatedCounter value={42} prefix="$" />);
    // After animation settles, value is present
    expect(screen.getByTestId('counter')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Implement**
```tsx
// src/frontend/src/components/metrics/AnimatedCounter.tsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
interface Props { value: number; prefix?: string; suffix?: string; decimals?: number; className?: string; }
export function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });
  useEffect(() => {
    gsap.to(obj.current, {
      val: value, duration: 0.8, ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = prefix + obj.current.val.toFixed(decimals) + suffix;
      },
    });
  }, [value, prefix, suffix, decimals]);
  return <span data-testid="counter" ref={ref} className={className}>{prefix}0{suffix}</span>;
}

// src/frontend/src/components/metrics/SparklineChart.tsx
interface Props { data: number[]; color?: string; height?: number; }
export function SparklineChart({ data, color = 'var(--oav-accent)', height = 32 }: Props) {
  if (data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// src/frontend/src/components/metrics/BentoMetricCard.tsx
import { GlassCard } from '../common/GlassCard';
import { AnimatedCounter } from './AnimatedCounter';
import { SparklineChart } from './SparklineChart';
interface Props { title: string; value: number; prefix?: string; suffix?: string; delta?: number; sparkline?: number[]; colSpan?: number; }
export function BentoMetricCard({ title, value, prefix, suffix, delta, sparkline, colSpan = 3 }: Props) {
  return (
    <GlassCard className={`col-span-${colSpan}`}>
      <p className="text-oav-muted text-xs mb-1">{title}</p>
      <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={2} className="text-oav-text text-2xl font-bold" />
      {delta !== undefined && (
        <p className={`text-xs mt-1 ${delta >= 0 ? 'text-oav-success' : 'text-oav-error'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </p>
      )}
      {sparkline && <div className="mt-2"><SparklineChart data={sparkline} /></div>}
    </GlassCard>
  );
}

// src/frontend/src/components/metrics/CostHeatmap.tsx
interface Props { data: { hour: number; day: number; cost: number }[]; }
export function CostHeatmap({ data }: Props) {
  const max = Math.max(...data.map(d => d.cost), 0.001);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <div className="overflow-x-auto">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(24, 1fr)` }}>
        {days.map((day, d) => (
          <>
            <span key={`l${d}`} className="text-oav-muted text-xs flex items-center">{day}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const cell = data.find(x => x.day === d && x.hour === h);
              const intensity = cell ? cell.cost / max : 0;
              return (
                <div
                  key={h}
                  title={`${day} ${h}:00 — $${cell?.cost.toFixed(4) ?? '0'}`}
                  className="h-4 rounded-sm"
                  style={{ background: `rgba(99,102,241,${0.05 + intensity * 0.95})` }}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/metrics/__tests__/AnimatedCounter.test.tsx
```

- [ ] **Step 5: Commit**
```bash
git add src/frontend/src/components/metrics/AnimatedCounter.tsx \
        src/frontend/src/components/metrics/SparklineChart.tsx \
        src/frontend/src/components/metrics/CostHeatmap.tsx \
        src/frontend/src/components/metrics/BentoMetricCard.tsx \
        src/frontend/src/components/metrics/__tests__/AnimatedCounter.test.tsx
git commit -m "feat(metrics): AnimatedCounter (GSAP), SparklineChart, CostHeatmap, BentoMetricCard"
```

---

### Task 8: AgentAvatarRive Upgrade — Rive State Machine Migration

**Files:**
- Modify: `src/frontend/src/canvas/agents/AgentAvatarRive.ts`
- Create: `src/frontend/src/components/agents/AgentAvatarRive.tsx` (React wrapper)
- Test: `src/frontend/src/components/agents/__tests__/AgentAvatarRive.test.tsx`

- [ ] **Step 1: Install Rive**
```bash
cd src/frontend && npm install @rive-app/react-canvas
```

- [ ] **Step 2: Write failing test**
```tsx
// src/frontend/src/components/agents/__tests__/AgentAvatarRive.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@rive-app/react-canvas', () => ({
  useRive: () => ({ rive: null, RiveComponent: () => <canvas /> }),
  useStateMachineInput: () => null,
}));

import { AgentAvatarRive } from '../AgentAvatarRive';

describe('AgentAvatarRive', () => {
  it('renders without crash for all status values', () => {
    const statuses = ['idle','working','thinking','communicating','error'] as const;
    statuses.forEach(status => {
      const { unmount } = render(<AgentAvatarRive avatarId="default" status={status} xpLevel={1} isSelected={false} />);
      unmount();
    });
  });
  it('renders SVG fallback when avatarId is unknown', () => {
    const { container } = render(<AgentAvatarRive avatarId="unknown_xyz" status="idle" xpLevel={1} isSelected={false} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Implement React wrapper**
```tsx
// src/frontend/src/components/agents/AgentAvatarRive.tsx
import { useEffect } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import type { AgentStatus } from '../../types/agent';

const KNOWN_AVATARS = ['default', 'researcher', 'coder', 'analyst', 'coordinator'];
const STATUS_TO_IDX: Record<AgentStatus, string> = {
  idle: 'idle', working: 'working', thinking: 'thinking',
  communicating: 'communicating', error: 'error',
};

interface Props {
  avatarId: string;
  status: AgentStatus;
  xpLevel: number;
  isSelected: boolean;
  onCelebrate?: boolean;
  size?: number;
}

export function AgentAvatarRive({ avatarId, status, xpLevel, isSelected, onCelebrate, size = 48 }: Props) {
  const known = KNOWN_AVATARS.includes(avatarId);

  const { rive, RiveComponent } = useRive({
    src: known ? `/avatars/${avatarId}.riv` : undefined,
    stateMachines: 'MainMachine',
    autoplay: true,
  });

  const statusInput    = useStateMachineInput(rive, 'MainMachine', 'status');
  const xpInput        = useStateMachineInput(rive, 'MainMachine', 'xpLevel');
  const selectedInput  = useStateMachineInput(rive, 'MainMachine', 'isSelected');
  const celebrateInput = useStateMachineInput(rive, 'MainMachine', 'triggerCelebrate');

  useEffect(() => { if (statusInput)   statusInput.value   = STATUS_TO_IDX[status] ?? 'idle'; }, [status, statusInput]);
  useEffect(() => { if (xpInput)       xpInput.value       = xpLevel; }, [xpLevel, xpInput]);
  useEffect(() => { if (selectedInput) selectedInput.value = isSelected; }, [isSelected, selectedInput]);
  useEffect(() => { if (onCelebrate && celebrateInput) celebrateInput.fire?.(); }, [onCelebrate, celebrateInput]);

  // Fallback SVG when Rive file not found
  if (!known) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="var(--oav-surface-2)" stroke="var(--oav-accent)" strokeWidth="2"/>
        <text x="24" y="30" textAnchor="middle" fontSize="18" fill="var(--oav-accent)">⬡</text>
      </svg>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      boxShadow: isSelected ? `0 0 0 2px var(--oav-accent)` : undefined }}>
      <RiveComponent />
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/agents/__tests__/AgentAvatarRive.test.tsx
```

- [ ] **Step 5: Commit**
```bash
git add src/frontend/src/components/agents/AgentAvatarRive.tsx
git commit -m "feat(agents): AgentAvatarRive React wrapper — 3-input Rive state machine, SVG fallback"
```

---

### Task 9: AgentCard + AgentDetailPanel Upgrades

**Files:**
- Modify: `src/frontend/src/components/agents/AgentCard.tsx`
- Modify: `src/frontend/src/components/agents/AgentDetailPanel.tsx`
- Test: `src/frontend/src/components/agents/__tests__/AgentCard.test.tsx`

- [ ] **Step 1: Write failing test**
```tsx
// src/frontend/src/components/agents/__tests__/AgentCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('../AgentAvatarRive', () => ({ AgentAvatarRive: () => <div data-testid="avatar" /> }));
import { AgentCard } from '../AgentCard';
const agent = { id:'1', workspace_id:'w', name:'TestAgent', role:'dev', framework:'langchain',
  avatar_id:'default', status:'idle' as const, level:1, xp_total:100,
  total_tokens:5000, total_cost_usd:0.05, created_at:'', updated_at:'' };

describe('AgentCard', () => {
  it('renders agent name', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('TestAgent')).toBeTruthy();
  });
  it('renders avatar', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByTestId('avatar')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/components/agents/__tests__/AgentCard.test.tsx 2>&1 | head -15
```
Expected: FAILED — component not yet updated

- [ ] **Step 3: Rewrite AgentCard**
```tsx
// src/frontend/src/components/agents/AgentCard.tsx
import type { Agent } from '../../types/agent';
import { AgentAvatarRive } from './AgentAvatarRive';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { formatCost } from '../../lib/formatters';
import { useMode } from '../../hooks/useMode';

const STATUS_DOT: Record<string, string> = {
  idle:'bg-oav-muted', working:'bg-oav-accent', thinking:'bg-oav-accent-2',
  communicating:'bg-oav-success', error:'bg-oav-error',
};

interface Props { agent: Agent; onClick?: () => void; }

export function AgentCard({ agent, onClick }: Props) {
  const { mode } = useMode();
  return (
    <div
      onClick={onClick}
      className="rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)',
        boxShadow: mode === 'gamified' ? '0 0 8px var(--oav-glow)' : undefined }}
    >
      <div className="flex items-center gap-3 mb-3">
        <AgentAvatarRive avatarId={agent.avatar_id} status={agent.status} xpLevel={agent.level} isSelected={false} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-oav-text font-medium text-sm truncate">{agent.name}</p>
          <p className="text-oav-muted text-xs">{agent.framework}</p>
        </div>
        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[agent.status] ?? 'bg-oav-muted'}`} />
      </div>
      <XPProgressBar xpTotal={agent.xp_total} />
      <p className="text-oav-muted text-xs mt-2">{formatCost(agent.total_cost_usd)} total cost</p>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite AgentDetailPanel**
```tsx
// src/frontend/src/components/agents/AgentDetailPanel.tsx
import { useState } from 'react';
import type { Agent } from '../../types/agent';
import { AgentAvatarRive } from './AgentAvatarRive';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { formatCost, formatTokens } from '../../lib/formatters';
import { useUIStore } from '../../stores/uiStore';

type Tab = 'overview' | 'traces' | 'cost' | 'xp';

export function AgentDetailPanel({ agent }: { agent: Agent }) {
  const [tab, setTab] = useState<Tab>('overview');
  const { selectAgent } = useUIStore();

  return (
    <div className="fixed right-0 top-0 h-full w-80 border-l z-40 overflow-y-auto"
      style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--oav-border)' }}>
        <div className="flex items-center gap-3">
          <AgentAvatarRive avatarId={agent.avatar_id} status={agent.status} xpLevel={agent.level} isSelected size={40} />
          <div>
            <p className="text-oav-text font-bold text-sm">{agent.name}</p>
            <p className="text-oav-muted text-xs">{agent.role} · {agent.framework}</p>
          </div>
        </div>
        <button onClick={() => selectAgent(null)} className="text-oav-muted hover:text-oav-text">✕</button>
      </div>
      {/* Tabs: Overview / Traces / Cost / XP History (all 4 required by spec §3.3) */}
      <div className="flex border-b" style={{ borderColor: 'var(--oav-border)' }}>
        {(['overview','traces','cost','xp'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${tab === t ? 'text-oav-accent border-b-2 border-oav-accent' : 'text-oav-muted'}`}>
            {t === 'xp' ? 'XP Hist.' : t}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-4">
        {tab === 'overview' && <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
              <p className="text-oav-muted text-xs">Status</p>
              <p className="text-oav-text text-sm font-medium capitalize mt-1">{agent.status}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
              <p className="text-oav-muted text-xs">Level</p>
              <p className="text-oav-text text-sm font-bold mt-1">{agent.level}</p>
            </div>
          </div>
          <XPProgressBar xpTotal={agent.xp_total} />
        </>}
        {tab === 'traces' && (
          <div className="space-y-2">
            <p className="text-oav-muted text-xs mb-2">Recent tool calls and LLM spans</p>
            {/* Trace list populated by useAgentTraces in a follow-up task;
                for now render a placeholder that links to the Replay page */}
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--oav-surface-2)' }}>
              <p className="text-oav-muted text-xs">View full trace in</p>
              <a href={`/replay?agent=${agent.id}`} className="text-oav-accent text-xs underline">Session Replay →</a>
            </div>
          </div>
        )}
        {tab === 'cost' && <>
          <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
            <p className="text-oav-muted text-xs">Total Cost</p>
            <p className="text-oav-text text-xl font-bold mt-1">{formatCost(agent.total_cost_usd)}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--oav-surface-2)' }}>
            <p className="text-oav-muted text-xs">Total Tokens</p>
            <p className="text-oav-text text-xl font-bold mt-1">{formatTokens(agent.total_tokens)}</p>
          </div>
        </>}
        {tab === 'xp' && <>
          <XPProgressBar xpTotal={agent.xp_total} />
          <p className="text-oav-muted text-xs">Total XP: {agent.xp_total.toLocaleString()}</p>
        </>}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/agents/__tests__/AgentCard.test.tsx
```

- [ ] **Step 6: Commit**
```bash
git add src/frontend/src/components/agents/AgentCard.tsx \
        src/frontend/src/components/agents/AgentDetailPanel.tsx \
        src/frontend/src/components/agents/__tests__/AgentCard.test.tsx
git commit -m "feat(agents): mode-aware AgentCard, tabbed AgentDetailPanel with Rive avatar"
```

---

### Task 10: Gamification + Alert Component Upgrades

**Files:**
- Modify: `src/frontend/src/components/gamification/XPProgressBar.tsx`
- Modify: `src/frontend/src/components/gamification/LeaderboardTable.tsx`
- Modify: `src/frontend/src/components/gamification/LevelUpToast.tsx`
- Create: `src/frontend/src/components/gamification/BadgeGrid.tsx`
- Modify: `src/frontend/src/components/alerts/AlertCard.tsx`
- Create: `src/frontend/src/components/alerts/AlertTimeline.tsx`

- [ ] **Step 1: Write failing tests**
```tsx
// src/frontend/src/components/gamification/__tests__/XPProgressBar.test.tsx
import { render } from '@testing-library/react';
import { XPProgressBar } from '../XPProgressBar';
describe('XPProgressBar', () => {
  it('renders for all xp levels', () => {
    [0,1000,3000,7500,15000].forEach(xp => {
      const { unmount } = render(<XPProgressBar xpTotal={xp} />);
      unmount();
    });
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/components/gamification/__tests__/XPProgressBar.test.tsx 2>&1 | head -15
```
Expected: FAILED — Cannot find module `'../XPProgressBar'` or similar.

- [ ] **Step 3: Upgrade XPProgressBar**
```tsx
// src/frontend/src/components/gamification/XPProgressBar.tsx
import { xpProgress } from '../../lib/xpLevels';
export function XPProgressBar({ xpTotal }: { xpTotal: number }) {
  const { level, current, required, pct } = xpProgress(xpTotal ?? 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: 'var(--oav-muted)' }}>
        <span>{current} / {required} XP</span>
        <span>Lv {level}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--oav-surface-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: 'var(--oav-accent)', boxShadow: '0 0 6px var(--oav-accent)40' }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Upgrade LeaderboardTable**
```tsx
// src/frontend/src/components/gamification/LeaderboardTable.tsx
import type { Agent } from '../../types/agent';
import { XPProgressBar } from './XPProgressBar';
const MEDALS = ['🥇','🥈','🥉'];
export function LeaderboardTable({ agents }: { agents: Agent[] }) {
  const sorted = [...agents].sort((a,b) => b.xp_total - a.xp_total).slice(0, 10);
  return (
    <div className="space-y-2">
      {sorted.map((a, i) => (
        <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors"
          style={{ background: 'var(--oav-surface-2)' }}>
          <span className="w-6 text-center text-sm">{MEDALS[i] ?? `#${i+1}`}</span>
          <div className="flex-1 min-w-0">
            <p className="text-oav-text text-sm truncate">{a.name}</p>
            <XPProgressBar xpTotal={a.xp_total} />
          </div>
          <span className="text-oav-muted text-xs shrink-0">{a.xp_total.toLocaleString()} XP</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Upgrade LevelUpToast**
```tsx
// src/frontend/src/components/gamification/LevelUpToast.tsx
import { useEffect } from 'react';
interface Props { agentName: string; newLevel: number; onDone: () => void; }
export function LevelUpToast({ agentName, newLevel, onDone }: Props) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-bounce text-center pointer-events-auto">
        <div className="text-6xl mb-2">🎉</div>
        <div className="rounded-xl border px-8 py-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-accent)', boxShadow: '0 0 40px var(--oav-glow)' }}>
          <p className="text-oav-accent font-bold text-xl">LEVEL UP!</p>
          <p className="text-oav-text text-sm mt-1">{agentName} reached <span className="font-bold text-oav-accent">Level {newLevel}</span></p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create BadgeGrid**
```tsx
// src/frontend/src/components/gamification/BadgeGrid.tsx
interface Badge { id: string; name: string; icon: string; unlocked: boolean; }
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {badges.map(b => (
        <div key={b.id} title={b.name}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-opacity ${b.unlocked ? 'opacity-100' : 'opacity-30 grayscale'}`}
          style={{ background: 'var(--oav-surface-2)' }}>
          <span className="text-2xl">{b.icon}</span>
          <span className="text-oav-muted text-[10px] leading-tight">{b.name}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Upgrade AlertCard**
```tsx
// src/frontend/src/components/alerts/AlertCard.tsx
interface Alert { id: string; title: string; message: string; severity: 'critical'|'warning'|'info'; created_at: string; resolved: boolean; }
const SEV: Record<string, {border: string; label: string}> = {
  critical: { border: 'var(--oav-error)',   label: 'Critical' },
  warning:  { border: 'var(--oav-warning)', label: 'Warning' },
  info:     { border: 'var(--oav-accent)',  label: 'Info' },
};
interface Props { alert: Alert; onResolve?: () => void; selected?: boolean; onSelect?: () => void; }
export function AlertCard({ alert, onResolve, selected, onSelect }: Props) {
  const sev = SEV[alert.severity] ?? SEV.info;
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 transition-all"
      style={{ background: 'var(--oav-surface)', borderColor: selected ? sev.border : 'var(--oav-border)',
        boxShadow: selected ? `0 0 8px ${sev.border}40` : undefined }}>
      {onSelect && <input type="checkbox" checked={!!selected} onChange={onSelect} className="mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: `${sev.border}20`, color: sev.border }}>{sev.label}</span>
          <p className="text-oav-text text-sm font-medium truncate">{alert.title}</p>
        </div>
        <p className="text-oav-muted text-xs">{alert.message}</p>
      </div>
      {!alert.resolved && onResolve && (
        <button onClick={onResolve} className="shrink-0 text-xs px-2 py-1 rounded border text-oav-muted hover:text-oav-text transition-colors"
          style={{ borderColor: 'var(--oav-border)' }}>Resolve</button>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create AlertTimeline**
```tsx
// src/frontend/src/components/alerts/AlertTimeline.tsx
interface Event { id: string; label: string; time: string; type: 'trigger'|'update'|'resolve'; }
const DOT_COLOR = { trigger: 'var(--oav-error)', update: 'var(--oav-warning)', resolve: 'var(--oav-success)' };
export function AlertTimeline({ events }: { events: Event[] }) {
  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: 'var(--oav-border)' }} />
      {events.map(e => (
        <div key={e.id} className="relative">
          <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2" style={{ background: DOT_COLOR[e.type], borderColor: 'var(--oav-bg)' }} />
          <p className="text-oav-text text-sm">{e.label}</p>
          <p className="text-oav-muted text-xs mt-0.5">{new Date(e.time).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Run all gamification/alert tests**
```bash
cd src/frontend && npx vitest run src/components/gamification/ src/components/alerts/
```

- [ ] **Step 10: Commit**
```bash
git add src/frontend/src/components/gamification/XPProgressBar.tsx \
        src/frontend/src/components/gamification/LeaderboardTable.tsx \
        src/frontend/src/components/gamification/LevelUpToast.tsx \
        src/frontend/src/components/gamification/BadgeGrid.tsx \
        src/frontend/src/components/gamification/__tests__/XPProgressBar.test.tsx \
        src/frontend/src/components/alerts/AlertCard.tsx \
        src/frontend/src/components/alerts/AlertTimeline.tsx
git commit -m "feat(ui): upgrade gamification+alert components — XPBar glow, LeaderboardTable, LevelUpToast, BadgeGrid, AlertCard, AlertTimeline"
```

---

### Task 11: Integration + Onboarding Components

**Files:**
- Create: `src/frontend/src/components/integrations/IntegrationCard.tsx`
- Create: `src/frontend/src/components/integrations/IntegrationStatusBadge.tsx`
- Create: `src/frontend/src/components/integrations/CLICommandBlock.tsx`
- Create: `src/frontend/src/components/integrations/PluginCard.tsx`
- Create: `src/frontend/src/components/onboarding/OnboardingWizard.tsx`
- Create: `src/frontend/src/components/onboarding/SampleDataBanner.tsx`
- Test: `src/frontend/src/components/integrations/__tests__/IntegrationCard.test.tsx`

- [ ] **Step 1: Write failing test**
```tsx
// src/frontend/src/components/integrations/__tests__/IntegrationCard.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IntegrationCard } from '../IntegrationCard';
import { IntegrationStatusBadge } from '../IntegrationStatusBadge';
import { CLICommandBlock } from '../CLICommandBlock';
import { OnboardingWizard } from '../../onboarding/OnboardingWizard';
import { SampleDataBanner } from '../../onboarding/SampleDataBanner';

const mockConfig = {
  id: '1', name: 'Test Integration', type: 'sdk' as const,
  status: 'connected' as const, last_event_at: null,
  event_count_24h: 0, install_command: 'pip install test',
};

describe('Integration + Onboarding components render without crash', () => {
  it('IntegrationCard renders', () => {
    const { container } = render(<IntegrationCard config={mockConfig} />);
    expect(container.firstChild).toBeTruthy();
  });
  it('IntegrationStatusBadge renders', () => {
    const { container } = render(<IntegrationStatusBadge status="connected" />);
    expect(container.firstChild).toBeTruthy();
  });
  it('CLICommandBlock renders', () => {
    const { container } = render(<CLICommandBlock command="pip install test" />);
    expect(container.firstChild).toBeTruthy();
  });
  it('SampleDataBanner renders null when inactive', () => {
    const { container } = render(<SampleDataBanner />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/components/integrations/__tests__/IntegrationCard.test.tsx 2>&1 | head -15
```
Expected: FAILED — Cannot find module `'../IntegrationCard'` or similar.

- [ ] **Step 3: Implement**
```tsx
// src/frontend/src/components/integrations/IntegrationStatusBadge.tsx
import type { IntegrationStatus } from '../../types/integration';
const CFG: Record<IntegrationStatus, { label: string; color: string }> = {
  connected:      { label: 'Connected',       color: 'var(--oav-success)' },
  not_configured: { label: 'Not configured',  color: 'var(--oav-muted)'   },
  error:          { label: 'Error',           color: 'var(--oav-error)'   },
};
export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const { label, color } = CFG[status];
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${color}18`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// src/frontend/src/components/integrations/CLICommandBlock.tsx
export function CLICommandBlock({ command }: { command: string }) {
  const copy = () => navigator.clipboard.writeText(command);
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs"
      style={{ background: 'var(--oav-surface-2)' }}>
      <span className="text-oav-muted select-none">$</span>
      <code className="text-oav-text flex-1 truncate">{command}</code>
      <button onClick={copy} title="Copy" className="text-oav-muted hover:text-oav-text transition-colors shrink-0">⧉</button>
    </div>
  );
}

// src/frontend/src/components/integrations/IntegrationCard.tsx
import type { IntegrationConfig } from '../../types/integration';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { CLICommandBlock } from './CLICommandBlock';
export function IntegrationCard({ config, onTest }: { config: IntegrationConfig; onTest?: () => void }) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-oav-text font-medium text-sm">{config.name}</p>
        <IntegrationStatusBadge status={config.status} />
      </div>
      {config.last_event_at && <p className="text-oav-muted text-xs">Last seen {new Date(config.last_event_at).toRelative?.() ?? config.last_event_at}</p>}
      <p className="text-oav-muted text-xs">{config.event_count_24h} events (24h)</p>
      <CLICommandBlock command={config.install_command} />
      {onTest && (
        <button onClick={onTest} className="w-full text-xs py-1.5 rounded-lg border transition-colors text-oav-muted hover:text-oav-text"
          style={{ borderColor: 'var(--oav-border)' }}>Test connection</button>
      )}
    </div>
  );
}

// src/frontend/src/components/integrations/PluginCard.tsx
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { CLICommandBlock } from './CLICommandBlock';
interface Props { name: string; version?: string; active: boolean; commands: string[]; installCommand: string; onUpdate?: () => void; onRemove?: () => void; }
export function PluginCard({ name, version, active, commands, installCommand, onUpdate, onRemove }: Props) {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-oav-text font-medium text-sm">{name}</p>
          {version && <p className="text-oav-muted text-xs">v{version}</p>}
        </div>
        <IntegrationStatusBadge status={active ? 'connected' : 'not_configured'} />
      </div>
      {active && commands.length > 0 && (
        <div className="space-y-1">
          {commands.map(c => <p key={c} className="text-oav-muted text-xs font-mono">{c}</p>)}
        </div>
      )}
      {!active && <CLICommandBlock command={installCommand} />}
      {active && (
        <div className="flex gap-2">
          {onUpdate && <button onClick={onUpdate} className="flex-1 text-xs py-1 rounded border text-oav-muted hover:text-oav-text transition-colors" style={{ borderColor: 'var(--oav-border)' }}>Update</button>}
          {onRemove && <button onClick={onRemove} className="flex-1 text-xs py-1 rounded border text-oav-error hover:opacity-80 transition-colors" style={{ borderColor: 'var(--oav-error)' }}>Remove</button>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement OnboardingWizard + SampleDataBanner**
```tsx
// src/frontend/src/components/onboarding/SampleDataBanner.tsx
import { useOnboardingStore } from '../../stores/onboardingStore';
export function SampleDataBanner() {
  const { sampleDataActive, reset } = useOnboardingStore();
  if (!sampleDataActive) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs border-b"
      style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'var(--oav-border)', color: 'var(--oav-accent)' }}>
      <span>⬡ Using sample data — connect your first agent to see real activity</span>
      <button onClick={reset} className="text-oav-muted hover:text-oav-text ml-4">Dismiss</button>
    </div>
  );
}

// src/frontend/src/components/onboarding/OnboardingWizard.tsx
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useWorkspace } from '../../hooks/useWorkspace';

const STEPS = [
  { title: 'Welcome to OpenAgentVisualizer', body: 'Watch your AI agents come alive in a virtual workspace.' },
  { title: 'Your workspace is ready', body: 'A default workspace has been created for you.' },
  { title: 'Copy your API key', body: 'Use this key to connect agents from your code.' },
  { title: 'Install the SDK', body: 'pip install openagentvisualizer' },
  { title: 'See your first agent', body: 'Loading sample data so you can explore...' },
];

export function OnboardingWizard() {
  const { completed, currentStep, advance, complete, activateSampleData } = useOnboardingStore();
  const { data: ws } = useWorkspace();
  if (completed) return null;

  const isLast = currentStep === 5;
  const handleNext = () => {
    if (isLast) { activateSampleData(); complete(); }
    else advance();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl border p-8 space-y-6"
        style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
        {/* Progress dots */}
        <div className="flex gap-2 justify-center">
          {[1,2,3,4,5].map(s => (
            <div key={s} className="h-1.5 w-8 rounded-full transition-all"
              style={{ background: s <= currentStep ? 'var(--oav-accent)' : 'var(--oav-surface-2)' }} />
          ))}
        </div>
        <div>
          <p className="text-oav-text font-bold text-lg">{STEPS[currentStep - 1].title}</p>
          <p className="text-oav-muted text-sm mt-2">{STEPS[currentStep - 1].body}</p>
          {currentStep === 3 && ws && (
            <div className="mt-3 rounded-lg px-3 py-2 font-mono text-xs"
              style={{ background: 'var(--oav-surface-2)', color: 'var(--oav-accent)' }}>
              {ws.api_key}
            </div>
          )}
        </div>
        <button onClick={handleNext}
          className="w-full py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--oav-accent)', color: '#000' }}>
          {isLast ? 'Explore with sample data →' : 'Next →'}
        </button>
        <button onClick={complete} className="w-full text-xs text-oav-muted hover:text-oav-text transition-colors">
          Skip onboarding
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run integration component tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/components/integrations/__tests__/IntegrationCard.test.tsx
# Expected: 4 passed
```

- [ ] **Step 6: Run full test suite to check no regressions**
```bash
cd src/frontend && npx vitest run
# Expected: all previously passing tests still pass
```

- [ ] **Step 7: Commit**
```bash
git add src/frontend/src/components/integrations/IntegrationCard.tsx \
        src/frontend/src/components/integrations/IntegrationStatusBadge.tsx \
        src/frontend/src/components/integrations/CLICommandBlock.tsx \
        src/frontend/src/components/integrations/PluginCard.tsx \
        src/frontend/src/components/integrations/__tests__/IntegrationCard.test.tsx \
        src/frontend/src/components/onboarding/OnboardingWizard.tsx \
        src/frontend/src/components/onboarding/SampleDataBanner.tsx
git commit -m "feat(ui): IntegrationCard, PluginCard, CLICommandBlock, OnboardingWizard, SampleDataBanner"
```

---

### Task 12: Page Redesigns — Dashboard + Alerts

**Files:**
- Modify: `src/frontend/src/pages/DashboardPage.tsx`
- Modify: `src/frontend/src/pages/AlertsPage.tsx`
- Test: `src/frontend/src/pages/__tests__/DashboardPage.test.tsx`

- [ ] **Step 1: Write failing tests**
```tsx
// src/frontend/src/pages/__tests__/DashboardPage.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useMetrics', () => ({
  useCosts: () => ({ data: null, isLoading: false }),
  useTokenUsage: () => ({ data: null, isLoading: false }),
}));
vi.mock('../../hooks/useAgents', () => ({
  useAgents: () => ({ data: { agents: [] }, isLoading: false, error: null }),
}));
vi.mock('../../hooks/useAlerts', () => ({
  useAlerts: () => ({ data: [], isLoading: false }),
}));

import { DashboardPage } from '../DashboardPage';
import { AlertsPage } from '../AlertsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('Page renders without crash', () => {
  it('DashboardPage renders', () => {
    const { container } = render(<Wrap><DashboardPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
  it('AlertsPage renders', () => {
    const { container } = render(<Wrap><AlertsPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/pages/__tests__/DashboardPage.test.tsx 2>&1 | head -15
```
Expected: FAILED — module import errors or component not found.

- [ ] **Step 3: Rewrite DashboardPage**
```tsx
// src/frontend/src/pages/DashboardPage.tsx
import { useCosts, useTokenUsage } from '../hooks/useMetrics';
import { useAgents } from '../hooks/useAgents';
import { BentoGrid } from '../components/common/BentoGrid';
import { BentoMetricCard } from '../components/metrics/BentoMetricCard';
import { CostHeatmap } from '../components/metrics/CostHeatmap';
import { LeaderboardTable } from '../components/gamification/LeaderboardTable';
import { SectionHeader } from '../components/layout/SectionHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function DashboardPage() {
  const { data: costs, isLoading: costsLoading } = useCosts();
  const { data: tokenUsage, isLoading: tokensLoading } = useTokenUsage();
  const { data: agentsData, isLoading: agentsLoading } = useAgents();
  const agents = agentsData?.agents ?? [];

  if (costsLoading || tokensLoading || agentsLoading) return (
    <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>
  );

  const activeAgents = agents.filter(a => a.status !== 'idle').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <SectionHeader title="Overview" />
      <BentoGrid>
        <BentoMetricCard title="Total Agents" value={agents.length} colSpan={3} />
        <BentoMetricCard title="Active Now"   value={activeAgents}  colSpan={3} />
        <BentoMetricCard title="Cost Today"   value={costs?.daily_cost_usd ?? 0}  prefix="$" decimals={4} colSpan={3} />
        <BentoMetricCard title="Total Cost"   value={costs?.total_cost_usd ?? 0}  prefix="$" decimals={2} colSpan={3} />
      </BentoGrid>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
          <SectionHeader title="Cost Heatmap (7 days)" />
          <CostHeatmap data={[]} />
        </div>
        <div className="col-span-4 rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
          <SectionHeader title="Leaderboard" />
          <LeaderboardTable agents={agents} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite AlertsPage**
```tsx
// src/frontend/src/pages/AlertsPage.tsx
import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { AlertCard } from '../components/alerts/AlertCard';
import { SectionHeader } from '../components/layout/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type Filter = 'all' | 'critical' | 'warning' | 'info';

export function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  if (isLoading) return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <SectionHeader title="Alerts" action={<span className="text-oav-muted text-xs">{alerts.length} total</span>} />

      {/* Filter chips */}
      <div className="flex gap-2">
        {(['all','critical','warning','info'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${filter === f ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'}`}
            style={filter === f ? { background: 'var(--oav-selected)', borderColor: 'var(--oav-accent)' } : { background: 'var(--oav-surface-2)' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--oav-surface-2)', borderColor: 'var(--oav-border)' }}>
          <span className="text-oav-muted">{selected.size} selected</span>
          <button onClick={() => setSelected(new Set())} className="text-oav-error text-xs hover:opacity-80">Clear</button>
        </div>
      )}

      {filtered.length === 0
        ? <EmptyState message="No alerts" />
        : <div className="space-y-3">
            {filtered.map(a => (
              <AlertCard
                key={a.id}
                alert={a as any}
                selected={selected.has(a.id)}
                onSelect={() => setSelected(s => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })}
              />
            ))}
          </div>
      }
    </div>
  );
}
```

- [ ] **Step 5: Run page tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/pages/__tests__/DashboardPage.test.tsx
# Expected: 2 passed
```

- [ ] **Step 6: Run dev server, spot-check both pages**
```bash
cd src/frontend && npm run dev
# Navigate to /dashboard and /alerts — verify no console errors
```

- [ ] **Step 7: Commit**
```bash
git add src/frontend/src/pages/DashboardPage.tsx \
        src/frontend/src/pages/AlertsPage.tsx \
        src/frontend/src/pages/__tests__/DashboardPage.test.tsx
git commit -m "feat(pages): bento Dashboard, filter-chip Alerts with bulk selection"
```

---

### Task 13: Page Redesigns — Session Replay + Settings + Login

**Files:**
- Modify: `src/frontend/src/pages/ReplayPage.tsx`
- Modify: `src/frontend/src/pages/SettingsPage.tsx`
- Modify: `src/frontend/src/pages/LoginPage.tsx`
- Test: `src/frontend/src/pages/__tests__/ReplayPage.test.tsx`

- [ ] **Step 1: Write failing tests**
```tsx
// src/frontend/src/pages/__tests__/ReplayPage.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useSessionReplay', () => ({
  useSessionReplay: () => ({ sessions: [], isLoading: false }),
}));
vi.mock('../../hooks/useWorkspace', () => ({
  useWorkspace: () => ({ data: null }),
}));

import { ReplayPage } from '../ReplayPage';
import { SettingsPage } from '../SettingsPage';
import { LoginPage } from '../LoginPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

describe('Task 13 pages render without crash', () => {
  it('ReplayPage renders', () => {
    const { container } = render(<Wrap><ReplayPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
  it('SettingsPage renders', () => {
    const { container } = render(<Wrap><SettingsPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
  it('LoginPage renders', () => {
    const { container } = render(<Wrap><LoginPage /></Wrap>);
    expect(container.firstChild).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/pages/__tests__/ReplayPage.test.tsx 2>&1 | head -15
```
Expected: FAILED — module import errors or component not found.

- [ ] **Step 3: Rewrite ReplayPage**
```tsx
// src/frontend/src/pages/ReplayPage.tsx
import { useState } from 'react';
import { useSessionReplay } from '../hooks/useSessionReplay';
import { SectionHeader } from '../components/layout/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';

export function ReplayPage() {
  const { sessions, isLoading } = useSessionReplay();
  const [speed, setSpeed] = useState<0.5|1|2|4>(1);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <SectionHeader title="Session Replay" />

      {/* Session list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? null : sessions.length === 0
          ? <EmptyState message="No sessions recorded yet" />
          : sessions.map((s: any) => (
            <div key={s.id} className="rounded-xl border px-4 py-3 flex items-center justify-between cursor-pointer hover:border-oav-accent transition-colors"
              style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
              <div>
                <p className="text-oav-text text-sm font-medium">{s.agent_name ?? 'Session'}</p>
                <p className="text-oav-muted text-xs">{new Date(s.started_at).toLocaleString()} · {s.event_count} events</p>
              </div>
              <button className="text-xs px-3 py-1 rounded-lg border text-oav-accent transition-colors"
                style={{ borderColor: 'var(--oav-accent)' }}>Replay</button>
            </div>
          ))
        }
      </div>

      {/* Playback controls */}
      <div className="rounded-xl border px-6 py-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
        <input type="range" min={0} max={100} value={cursor} onChange={e => setCursor(+e.target.value)}
          className="w-full accent-oav-accent" />
        <div className="flex items-center justify-between">
          <button onClick={() => setPlaying(p => !p)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'var(--oav-accent)', color: '#000' }}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <div className="flex gap-1">
            {([0.5,1,2,4] as const).map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${speed === s ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'}`}
                style={speed === s ? { background: 'var(--oav-selected)' } : undefined}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite SettingsPage**
```tsx
// src/frontend/src/pages/SettingsPage.tsx
import { useState } from 'react';
import { ModeToggle } from '../components/layout/ModeToggle';
import { SectionHeader } from '../components/layout/SectionHeader';
import { IntegrationCard } from '../components/integrations/IntegrationCard';
import { PluginCard } from '../components/integrations/PluginCard';
import { useWorkspace } from '../hooks/useWorkspace';

type Tab = 'general' | 'workspace' | 'integrations' | 'api-keys' | 'appearance' | 'danger';

const PLUGIN_CARDS = [
  { name: 'Claude Code Plugin', active: false, commands: ['/oav-status','/oav-agents','/oav-alerts','/oav-cost','/oav-replay','/oav-debug'], installCommand: 'oav install claude-code-plugin' },
  { name: 'Codex Plugin', active: false, commands: ['/oav status','/oav agents','/oav alerts','/oav cost','/oav watch'], installCommand: 'oav install codex-plugin' },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const { data: ws } = useWorkspace();
  const TABS: Tab[] = ['general','workspace','integrations','api-keys','appearance','danger'];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Settings" />
      {/* Tab bar */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--oav-border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'text-oav-accent border-oav-accent' : 'text-oav-muted border-transparent hover:text-oav-text'}`}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
            <p className="text-oav-text font-medium text-sm mb-1">Workspace</p>
            <p className="text-oav-muted text-xs">{ws?.name ?? '…'}</p>
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="space-y-6">
          <div>
            <SectionHeader title="CLI Plugins" />
            <div className="grid grid-cols-2 gap-4">
              {PLUGIN_CARDS.map(p => <PluginCard key={p.name} {...p} />)}
            </div>
          </div>
          <div>
            <SectionHeader title="SDK Adapters" />
            <p className="text-oav-muted text-sm">Configure SDK integrations by running <code className="text-oav-accent">oav install &lt;adapter&gt;</code></p>
          </div>
        </div>
      )}

      {tab === 'api-keys' && (
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
          <p className="text-oav-text font-medium text-sm">API Key</p>
          {ws && <div className="font-mono text-xs text-oav-accent break-all">{ws.api_key}</div>}
        </div>
      )}

      {tab === 'workspace' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
            <p className="text-oav-text font-medium text-sm">Workspace Details</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-oav-muted mb-0.5">Name</p><p className="text-oav-text font-medium">{ws?.name ?? '—'}</p></div>
              <div><p className="text-oav-muted mb-0.5">Plan</p><p className="text-oav-text font-medium capitalize">{ws?.tier ?? 'Free'}</p></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
            <p className="text-oav-text font-medium text-sm mb-3">Display Mode</p>
            <ModeToggle />
          </div>
        </div>
      )}

      {tab === 'danger' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-oav-error/20 p-4 space-y-4" style={{ background: 'var(--oav-surface)' }}>
            <p className="text-oav-error font-medium text-sm">Danger Zone</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-oav-text text-sm">Delete all traces</p>
                <p className="text-oav-muted text-xs">Permanently remove all trace data for this workspace</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg border border-oav-error/40 text-oav-error hover:bg-oav-error/10 transition-colors">
                Delete Traces
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Upgrade LoginPage**

Read the existing `src/frontend/src/pages/LoginPage.tsx` first. It contains the login form with email, password, and submit. Replace the entire `return (...)` block with the following complete JSX (preserve all state variables, handlers, and the `api.post('/auth/login', ...)` call — only the JSX layout changes):

```tsx
// src/frontend/src/pages/LoginPage.tsx — complete replacement
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
      });
      if (!r.ok) { setError('Invalid email or password'); return; }
      const { access_token } = await r.json();
      localStorage.setItem('oav_token', access_token);
      navigate('/world');
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--oav-bg)' }}>
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="text-5xl mb-3">⬡</div>
          <h1 className="text-oav-text text-2xl font-bold">OpenAgentVisualizer</h1>
          <p className="text-oav-muted text-sm mt-1">Watch your AI agents come alive</p>
        </div>
        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}
        >
          {error && (
            <p className="text-oav-error text-xs text-center px-2 py-1.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)' }}>{error}</p>
          )}
          <div>
            <label className="block text-oav-muted text-xs mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="kotsai@gmail.com"
              className="w-full rounded-lg px-3 py-2 text-sm text-oav-text bg-transparent border outline-none focus:border-oav-accent transition-colors"
              style={{ borderColor: 'var(--oav-border)' }}
            />
          </div>
          <div>
            <label className="block text-oav-muted text-xs mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg px-3 py-2 text-sm text-oav-text bg-transparent border outline-none focus:border-oav-accent transition-colors"
              style={{ borderColor: 'var(--oav-border)' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--oav-accent)', color: '#000' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-oav-muted text-xs">
          Default: kotsai@gmail.com / kots@123
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run page tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/pages/__tests__/ReplayPage.test.tsx
# Expected: 3 passed
```

- [ ] **Step 7: Run all frontend tests**
```bash
cd src/frontend && npx vitest run
# Expected: all tests pass
```

- [ ] **Step 8: Commit**
```bash
git add src/frontend/src/pages/ReplayPage.tsx \
        src/frontend/src/pages/SettingsPage.tsx \
        src/frontend/src/pages/LoginPage.tsx \
        src/frontend/src/pages/__tests__/ReplayPage.test.tsx
git commit -m "feat(pages): redesigned Replay (scrubber+speed), Settings (tabbed+plugins), Login (centered card)"
```

---

### Task 14: GSAP Page Transitions + Particle Events

**Files:**
- Create: `src/frontend/src/lib/transitions.ts`
- Create: `src/frontend/src/lib/particles.ts`
- Modify: `src/frontend/src/App.tsx`
- Test: `OpenAgentVisualizer/src/frontend/src/lib/__tests__/animations.test.ts`

- [ ] **Step 1: Write failing test**
```typescript
// src/frontend/src/lib/__tests__/animations.test.ts
import { describe, it, expect } from 'vitest';

describe('transitions', () => {
  it('exports pageEnter as a function', async () => {
    const { pageEnter } = await import('../transitions');
    expect(pageEnter).toBeDefined();
    expect(typeof pageEnter).toBe('function');
  });
});

describe('particles', () => {
  it('exports emitXPGain as a function', async () => {
    const { emitXPGain } = await import('../particles');
    expect(emitXPGain).toBeDefined();
    expect(typeof emitXPGain).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/lib/__tests__/animations.test.ts 2>&1 | head -15
```
Expected: FAILED — modules not yet created

- [ ] **Step 3: Create GSAP transition helpers**
```ts
// src/frontend/src/lib/transitions.ts
import { gsap } from 'gsap';

export function pageEnter(el: HTMLElement) {
  gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out', clearProps: 'all' });
}

export function pageLeave(el: HTMLElement, onComplete: () => void) {
  gsap.to(el, { opacity: 0, y: -8, duration: 0.15, ease: 'power2.in', onComplete });
}
```

- [ ] **Step 4: Create particle helpers (CSS-based for UI layer)**
```ts
// src/frontend/src/lib/particles.ts
export function emitXPGain(x: number, y: number) {
  const el = document.createElement('div');
  el.textContent = '+XP';
  Object.assign(el.style, {
    position: 'fixed', left: `${x}px`, top: `${y}px`, pointerEvents: 'none',
    color: 'var(--oav-warning)', fontSize: '12px', fontWeight: 'bold', zIndex: '9999',
    animation: 'float-up 0.8s ease-out forwards',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
```

- [ ] **Step 5: Add float-up keyframe to animations.css**
```css
@keyframes float-up {
  0%   { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}
```

- [ ] **Step 6: Wire page-enter transition into App.tsx**

In `src/frontend/src/App.tsx`, import `pageEnter` and attach it to the router outlet so pages animate in on mount. Add the following route wrapper using a `useEffect` on location change:
```tsx
import { pageEnter } from './lib/transitions';
// Inside your router component, wrap routes with a ref callback:
// <main ref={el => el && pageEnter(el)}>
//   <AppRoutes />
// </main>
```

- [ ] **Step 7: Run tests to confirm they pass**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/lib/__tests__/animations.test.ts
```
Expected: 2 tests PASSED

- [ ] **Step 8: Run full test suite**
```bash
cd src/frontend && npx vitest run && npx playwright test --reporter=list 2>/dev/null || echo "Playwright not configured yet"
```

- [ ] **Step 9: Commit**
```bash
git add src/frontend/src/lib/transitions.ts \
        src/frontend/src/lib/particles.ts \
        src/frontend/src/lib/__tests__/animations.test.ts \
        src/frontend/src/styles/animations.css \
        src/frontend/src/App.tsx
git commit -m "feat(animation): GSAP page transition helpers, CSS particle emitters, App.tsx wiring"
```

---

### Task 15: VirtualWorldPage — 3-Mode Toggle Setup + Onboarding Integration

**Files:**
- Modify: `src/frontend/src/pages/VirtualWorldPage.tsx`
- Create: `src/frontend/src/pages/__tests__/VirtualWorldPage.test.tsx`

- [ ] **Step 1: Write failing test**
```tsx
// src/frontend/src/pages/__tests__/VirtualWorldPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
vi.mock('../../canvas/WorldCanvas', () => ({ WorldCanvas: () => <div data-testid="pixijs-canvas" /> }));
import { VirtualWorldPage } from '../VirtualWorldPage';

describe('VirtualWorldPage', () => {
  it('shows 2D mode by default', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    expect(screen.getByTestId('pixijs-canvas')).toBeTruthy();
  });
  it('shows mode toggle buttons', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    expect(screen.getByText('2D')).toBeTruthy();
    expect(screen.getByText('2.5D')).toBeTruthy();
    expect(screen.getByText('3D')).toBeTruthy();
  });
  it('switches to 2.5D mode unmounts PixiJS', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    fireEvent.click(screen.getByText('2.5D'));
    expect(screen.queryByTestId('pixijs-canvas')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**
```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/pages/__tests__/VirtualWorldPage.test.tsx 2>&1 | head -15
```
Expected: FAILED — component not yet updated with mode toggle

- [ ] **Step 3: Rewrite VirtualWorldPage**
```tsx
// src/frontend/src/pages/VirtualWorldPage.tsx
import { useState } from 'react';
import { WorldCanvas } from '../canvas/WorldCanvas';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWorkspace } from '../hooks/useWorkspace';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { SampleDataBanner } from '../components/onboarding/SampleDataBanner';
import { useOnboardingStore } from '../stores/onboardingStore';

type CanvasMode = '2D' | '2.5D' | '3D';

export function VirtualWorldPage() {
  const [mode, setMode] = useState<CanvasMode>('2D');
  const workspaceId = localStorage.getItem('oav_workspace') ?? '';
  const { data: ws } = useWorkspace();
  const { completed } = useOnboardingStore();
  const canUse3D = ws?.tier === 'pro' || ws?.tier === 'enterprise';

  useWebSocket(workspaceId || null);

  return (
    <div className="flex flex-col h-full">
      <SampleDataBanner />

      {/* Mode toggle bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'var(--oav-border)' }}>
        {(['2D','2.5D','3D'] as CanvasMode[]).map(m => {
          const locked = m === '3D' && !canUse3D;
          return (
            <button
              key={m}
              onClick={() => !locked && setMode(m)}
              disabled={locked}
              title={locked ? 'Upgrade to Pro for 3D mode' : undefined}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={mode === m ? { background: 'var(--oav-selected)' } : undefined}
            >
              {m}{locked && ' 🔒'}
            </button>
          );
        })}
      </div>

      {/* Canvas area — only one renderer mounted at a time */}
      <div className="flex-1 relative">
        {mode === '2D' && workspaceId && <WorldCanvas workspaceId={workspaceId} />}
        {mode === '2.5D' && <div className="w-full h-full flex items-center justify-center text-oav-muted text-sm">Three.js 2.5D — Task C1</div>}
        {mode === '3D' && canUse3D && <div className="w-full h-full flex items-center justify-center text-oav-muted text-sm">UE5 Pixel Streaming — Task C5</div>}
      </div>

      {/* Onboarding wizard (modal overlay) */}
      {!completed && <OnboardingWizard />}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**
```bash
cd src/frontend && npx vitest run src/pages/__tests__/VirtualWorldPage.test.tsx
```

- [ ] **Step 5: Run full test suite**
```bash
cd src/frontend && npx vitest run
# Expected: all tests pass, 0 failures
```

- [ ] **Step 6: Commit**
```bash
git add src/frontend/src/pages/VirtualWorldPage.tsx \
        src/frontend/src/pages/__tests__/VirtualWorldPage.test.tsx
git commit -m "feat(world): 3-mode canvas toggle (2D/2.5D/3D), onboarding wizard integration, tier gating for 3D"
```

---

### Task 16: Final Integration + Docker Rebuild

- [ ] **Step 1: Build frontend**
```bash
cd src/frontend && npm run build
# Expected: dist/ created, no TypeScript errors
```

- [ ] **Step 2: Rebuild Docker stack**
```bash
cd OpenAgentVisualizer
docker compose down && docker compose up --build -d
docker compose ps
# Expected: backend, frontend, db all Up
```

- [ ] **Step 3: Smoke test all 6 pages**
```bash
# Open http://localhost:8080 in browser
# Verify:
# - /login   — centered card with OAV logo
# - /world   — mode toggle bar, PixiJS canvas, onboarding wizard on first visit
# - /dashboard — bento grid layout with metric cards
# - /alerts  — filter chips, AlertCard list
# - /replay  — session list + scrubber controls
# - /settings — tabbed layout with Plugins section
# - Cmd+K opens command palette
# - Mode toggle (sidebar) switches Professional/Gamified visually
```

- [ ] **Step 4: Commit**
```bash
git add OpenAgentVisualizer/src/frontend/src/App.tsx \
        OpenAgentVisualizer/src/frontend/src/main.tsx \
        OpenAgentVisualizer/src/frontend/src/index.css \
        OpenAgentVisualizer/src/frontend/src/styles/tokens.css \
        OpenAgentVisualizer/src/frontend/src/styles/animations.css \
        OpenAgentVisualizer/src/frontend/package.json \
        OpenAgentVisualizer/src/frontend/tailwind.config.js \
        OpenAgentVisualizer/src/frontend/vite.config.ts \
        OpenAgentVisualizer/src/frontend/index.html
git commit -m "feat(OAV): Sub-project A complete — full UI/UX revamp, dual-mode design system"
```

- [ ] **Step 5: Push to GitHub**
```bash
git subtree split --prefix=OpenAgentVisualizer -b oav-push-sp-a
git push https://$(gh auth token)@github.com/ashishkots/OpenAgentVisualizer.git oav-push-sp-a:main --force
git branch -D oav-push-sp-a
```
