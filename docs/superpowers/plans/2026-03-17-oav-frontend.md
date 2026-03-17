# OpenAgentVisualizer Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React 18 + PixiJS v8 frontend — isometric virtual world with animated agent avatars, XState FSM per agent, Zustand global state, real-time WebSocket integration, Recharts dashboards, and session replay UI.

**Architecture:** PixiJS v8 canvas handles all 2D rendering (isometric office, agent sprites, particle flows). XState v5 manages each agent's state machine (idle → working → thinking → communicating → error). Zustand stores workspace/agent/metrics state. TanStack Query fetches REST data. A single WebSocket hook subscribes to backend push events and dispatches into Zustand + XState. Rive handles avatar body animations within PixiJS via the `@rive-app/canvas` renderer.

**Tech Stack:** React 18, TypeScript, Vite, PixiJS v8, Rive `@rive-app/canvas`, XState v5, Zustand, TanStack Query v5, GSAP 3, Recharts, React Flow, Tailwind CSS, Vitest, React Testing Library

---

## File Structure

```
src/frontend/
├── index.html                         # Vite entry point
├── public/
│   ├── favicon.ico
│   └── assets/                        # static Rive files, images
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── Dockerfile
└── src/
    ├── main.tsx                       # React root, QueryClientProvider, Router
    ├── App.tsx                        # Routes definition
    ├── index.css                      # Tailwind base
    ├── types/
    │   ├── agent.ts                   # Agent, Task, AgentStatus interfaces
    │   ├── event.ts                   # LiveEvent, OTLPSpan interfaces
    │   ├── metrics.ts                 # CostSummary, TokenUsage interfaces
    │   └── gamification.ts            # XPEvent, LevelUp, Alert interfaces
    ├── canvas/
    │   ├── WorldCanvas.tsx            # PixiJS app bootstrap, resize handling
    │   ├── world/
    │   │   ├── IsoGrid.ts             # isometric grid math & tile renderer
    │   │   ├── OfficeZones.ts         # zone definitions (desk, meeting, server room)
    │   │   └── WorldRenderer.ts       # orchestrates grid + agents + effects
    │   ├── agents/
    │   │   ├── AgentSprite.ts         # PixiJS Container for one agent
    │   │   ├── AgentAvatarRive.ts     # Rive animation controller per agent
    │   │   ├── AgentStatusBadge.ts    # floating status indicator above avatar
    │   │   ├── AgentXPBar.ts          # XP bar sprite below name label
    │   │   └── AgentLabel.ts          # name + role text label
    │   ├── effects/
    │   │   ├── ParticleFlow.ts        # agent-to-agent communication particles
    │   │   ├── LevelUpEffect.ts       # celebration particle burst on level-up
    │   │   └── WeatherSystem.ts       # ambient particles tied to system health
    │   └── input/
    │       ├── CameraController.ts    # pan, zoom, semantic-zoom breakpoints
    │       └── SelectionHandler.ts    # click on agent → opens detail panel
    ├── machines/
    │   ├── agentMachine.ts            # XState v5 — 5 states + transitions
    │   └── workspaceMachine.ts        # workspace connection FSM
    ├── stores/
    │   ├── agentStore.ts              # agents map, status updates
    │   ├── metricsStore.ts            # live cost/token counters
    │   ├── uiStore.ts                 # selected agent, panel open, zoom level
    │   └── alertStore.ts              # active alerts list
    ├── hooks/
    │   ├── useWebSocket.ts            # WS connection, reconnect, dispatch to stores
    │   ├── useAgents.ts               # TanStack Query - GET /api/agents
    │   ├── useMetrics.ts              # TanStack Query - GET /api/metrics/costs
    │   ├── useAlerts.ts               # TanStack Query - GET /api/alerts
    │   └── useSessionReplay.ts        # replay playback controller
    ├── services/
    │   ├── api.ts                     # axios instance with auth header injection
    │   ├── agentApi.ts                # typed wrappers for agent endpoints
    │   ├── metricsApi.ts              # typed wrappers for metrics endpoints
    │   └── sessionApi.ts              # typed wrappers for session endpoints
    ├── lib/
    │   ├── isoMath.ts                 # screen ↔ iso coordinate conversion
    │   ├── colorTokens.ts             # design system color constants
    │   ├── formatters.ts              # cost, token, duration formatters
    │   └── xpLevels.ts                # XP thresholds, level names, colors
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx           # sidebar + topbar + canvas layout
    │   │   ├── Sidebar.tsx            # nav links
    │   │   └── Topbar.tsx             # workspace selector, user menu
    │   ├── agents/
    │   │   ├── AgentDetailPanel.tsx   # slide-out panel with agent stats
    │   │   ├── AgentCard.tsx          # compact agent card for list view
    │   │   └── AgentStatusBadge.tsx   # React badge (used outside canvas)
    │   ├── metrics/
    │   │   ├── CostChart.tsx          # Recharts area chart - cost over time
    │   │   ├── TokenUsageBar.tsx      # Recharts bar - tokens per agent
    │   │   └── CostSummaryCard.tsx    # KPI card - daily/weekly cost
    │   ├── gamification/
    │   │   ├── XPProgressBar.tsx      # level + xp progress
    │   │   ├── LeaderboardTable.tsx   # sorted agent table by XP
    │   │   └── LevelUpToast.tsx       # GSAP-animated level-up notification
    │   ├── alerts/
    │   │   ├── AlertBanner.tsx        # top-of-screen critical alert bar
    │   │   └── AlertList.tsx          # alert list with resolve action
    │   └── common/
    │       ├── LoadingSpinner.tsx
    │       ├── ErrorBoundary.tsx
    │       └── EmptyState.tsx
    ├── pages/
    │   ├── LoginPage.tsx              # email/password login form
    │   ├── VirtualWorldPage.tsx       # full-screen PixiJS canvas
    │   ├── DashboardPage.tsx          # cost + token charts, KPI cards
    │   ├── AgentsPage.tsx             # agent list with status
    │   ├── AlertsPage.tsx             # alert management
    │   ├── ReplayPage.tsx             # session replay with timeline scrubber
    │   └── SettingsPage.tsx           # workspace settings, API keys
    └── routes.tsx                     # React Router v6 route definitions
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `src/frontend/package.json`
- Create: `src/frontend/vite.config.ts`
- Create: `src/frontend/tailwind.config.js`
- Create: `src/frontend/tsconfig.json`
- Create: `src/frontend/index.html`
- Create: `src/frontend/Dockerfile`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "openagentvisualizer-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0",
    "@pixi/react": "^7.1.2",
    "pixi.js": "^8.1.5",
    "@rive-app/canvas": "^2.21.6",
    "xstate": "^5.13.0",
    "@xstate/react": "^4.1.1",
    "zustand": "^4.5.2",
    "@tanstack/react-query": "^5.45.0",
    "gsap": "^3.12.5",
    "recharts": "^2.12.7",
    "reactflow": "^11.11.4",
    "axios": "^1.7.2",
    "tailwindcss": "^3.4.4",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.7.0",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vitest": "^1.6.0",
    "@vitest/coverage-v8": "^1.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/user-event": "^14.5.2",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "jsdom": "^24.1.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

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
      '@canvas': path.resolve(__dirname, './src/canvas'),
      '@machines': path.resolve(__dirname, './src/machines'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8001', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: Create `tailwind.config.js`**

```javascript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenAgentVisualizer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `Dockerfile`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM deps AS builder
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 6: Install dependencies**

```bash
cd src/frontend && npm install
```

- [ ] **Step 7: Commit**
```bash
git add src/frontend/
git commit -m "feat(frontend): project scaffold - Vite + React + PixiJS + Tailwind"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/frontend/src/types/agent.ts`
- Create: `src/frontend/src/types/event.ts`
- Create: `src/frontend/src/types/metrics.ts`
- Create: `src/frontend/src/types/gamification.ts`

- [ ] **Step 1: Create `src/types/agent.ts`**

```typescript
export type AgentStatus = 'idle' | 'working' | 'thinking' | 'communicating' | 'error';

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  role: string;
  framework: string;
  avatar_id: string;
  status: AgentStatus;
  level: number;
  xp_total: number;
  total_tokens: number;
  total_cost_usd: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  agent_id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tokens_used: number;
  cost_usd: number;
  xp_awarded: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface AgentPosition {
  agentId: string;
  x: number;
  y: number;
  zone: string;
}
```

- [ ] **Step 2: Create remaining type files** (`event.ts`, `metrics.ts`, `gamification.ts`) with full interfaces

- [ ] **Step 3: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Commit**
```bash
git add src/frontend/src/types/ src/frontend/src/test-setup.ts
git commit -m "feat(frontend): TypeScript type definitions"
```

---

## Task 3: API Service Layer

**Files:**
- Create: `src/frontend/src/services/api.ts`
- Create: `src/frontend/src/services/agentApi.ts`
- Create: `src/frontend/src/services/metricsApi.ts`
- Create: `src/frontend/src/services/sessionApi.ts`

- [ ] **Step 1: Write failing API tests**

```typescript
// src/services/__tests__/agentApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgents, createAgent } from '@services/agentApi';
import { apiClient } from '@services/api';

vi.mock('@services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() }
}));

describe('agentApi', () => {
  it('getAgents calls GET /api/agents', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    const result = await getAgents();
    expect(apiClient.get).toHaveBeenCalledWith('/api/agents');
    expect(result).toEqual([]);
  });

  it('createAgent calls POST /api/agents', async () => {
    const agent = { name: 'Bot', role: 'worker', framework: 'custom' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: '1', ...agent } });
    const result = await createAgent(agent);
    expect(apiClient.post).toHaveBeenCalledWith('/api/agents', agent);
    expect(result.id).toBe('1');
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/services/api.ts`**

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('oav_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oav_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 3: Implement `src/services/agentApi.ts`**

```typescript
import { apiClient } from './api';
import type { Agent, Task } from '@types/agent';

export const getAgents = async (): Promise<Agent[]> => {
  const { data } = await apiClient.get<Agent[]>('/api/agents');
  return data;
};

export const createAgent = async (payload: Pick<Agent, 'name' | 'role' | 'framework'>): Promise<Agent> => {
  const { data } = await apiClient.post<Agent>('/api/agents', payload);
  return data;
};

export const getAgentStats = async (agentId: string): Promise<Agent> => {
  const { data } = await apiClient.get<Agent>(`/api/agents/${agentId}/stats`);
  return data;
};
```

- [ ] **Step 4: Implement remaining API modules** (`metricsApi.ts`, `sessionApi.ts`)

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git commit -m "feat(frontend): API service layer with auth interceptor"
```

---

## Task 4: Zustand Stores

**Files:**
- Create: `src/frontend/src/stores/agentStore.ts`
- Create: `src/frontend/src/stores/metricsStore.ts`
- Create: `src/frontend/src/stores/uiStore.ts`
- Create: `src/frontend/src/stores/alertStore.ts`

- [ ] **Step 1: Write failing store tests**

```typescript
// src/stores/__tests__/agentStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '@stores/agentStore';
import { act } from '@testing-library/react';

describe('agentStore', () => {
  beforeEach(() => useAgentStore.getState().reset());

  it('adds agent to store', () => {
    act(() => {
      useAgentStore.getState().upsertAgent({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    });
    expect(useAgentStore.getState().agents['a1'].name).toBe('Bot');
  });

  it('updates agent status', () => {
    act(() => {
      useAgentStore.getState().upsertAgent({ id: 'a1', name: 'Bot', status: 'idle' } as any);
      useAgentStore.getState().setAgentStatus('a1', 'working');
    });
    expect(useAgentStore.getState().agents['a1'].status).toBe('working');
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/stores/agentStore.ts`**

```typescript
import { create } from 'zustand';
import type { Agent, AgentStatus, AgentPosition } from '@types/agent';

interface AgentStore {
  agents: Record<string, Agent>;
  positions: Record<string, AgentPosition>;
  upsertAgent: (agent: Agent) => void;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  setAgentPosition: (pos: AgentPosition) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {},
  positions: {},
  upsertAgent: (agent) => set((s) => ({ agents: { ...s.agents, [agent.id]: agent } })),
  setAgentStatus: (agentId, status) =>
    set((s) => ({
      agents: s.agents[agentId]
        ? { ...s.agents, [agentId]: { ...s.agents[agentId], status } }
        : s.agents,
    })),
  setAgentPosition: (pos) => set((s) => ({ positions: { ...s.positions, [pos.agentId]: pos } })),
  reset: () => set({ agents: {}, positions: {} }),
}));
```

- [ ] **Step 3: Implement `src/stores/uiStore.ts`**

```typescript
import { create } from 'zustand';

interface UIStore {
  selectedAgentId: string | null;
  isPanelOpen: boolean;
  zoomLevel: number;   // 0 = overview, 1 = normal, 2 = detail
  selectAgent: (id: string | null) => void;
  setZoom: (level: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedAgentId: null,
  isPanelOpen: false,
  zoomLevel: 1,
  selectAgent: (id) => set({ selectedAgentId: id, isPanelOpen: id !== null }),
  setZoom: (level) => set({ zoomLevel: Math.max(0, Math.min(2, level)) }),
}));
```

- [ ] **Step 4: Implement `metricsStore.ts` and `alertStore.ts`**

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git commit -m "feat(frontend): Zustand stores - agents, metrics, UI state, alerts"
```

---

## Task 5: XState Agent FSM

**Files:**
- Create: `src/frontend/src/machines/agentMachine.ts`

- [ ] **Step 1: Write failing machine tests**

```typescript
// src/machines/__tests__/agentMachine.test.ts
import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { agentMachine } from '@machines/agentMachine';

describe('agentMachine', () => {
  it('starts in idle state', () => {
    const actor = createActor(agentMachine).start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('transitions idle → working on TASK_START', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'TASK_START', taskId: 't1' });
    expect(actor.getSnapshot().value).toBe('working');
  });

  it('transitions working → thinking on LLM_CALL', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'TASK_START', taskId: 't1' });
    actor.send({ type: 'LLM_CALL' });
    expect(actor.getSnapshot().value).toBe('thinking');
  });

  it('transitions any state → error on ERROR', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'TASK_START', taskId: 't1' });
    actor.send({ type: 'ERROR', message: 'timeout' });
    expect(actor.getSnapshot().value).toBe('error');
  });

  it('transitions error → idle on RESET', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'ERROR', message: 'fail' });
    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().value).toBe('idle');
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/machines/agentMachine.ts`**

```typescript
import { setup } from 'xstate';

export const agentMachine = setup({
  types: {
    events: {} as
      | { type: 'TASK_START'; taskId: string }
      | { type: 'LLM_CALL' }
      | { type: 'TOOL_CALL'; toolName: string }
      | { type: 'AGENT_HANDOFF'; targetAgentId: string }
      | { type: 'TASK_COMPLETE'; xpAwarded: number }
      | { type: 'ERROR'; message: string }
      | { type: 'RESET' },
    context: {} as {
      currentTaskId: string | null;
      errorMessage: string | null;
    },
  },
}).createMachine({
  id: 'agent',
  initial: 'idle',
  context: { currentTaskId: null, errorMessage: null },
  states: {
    idle: {
      on: {
        TASK_START: {
          target: 'working',
          actions: ({ context, event }) => { context.currentTaskId = event.taskId; },
        },
      },
    },
    working: {
      on: {
        LLM_CALL: 'thinking',
        TOOL_CALL: 'working',
        AGENT_HANDOFF: 'communicating',
        TASK_COMPLETE: {
          target: 'idle',
          actions: ({ context }) => { context.currentTaskId = null; },
        },
        ERROR: {
          target: 'error',
          actions: ({ context, event }) => { context.errorMessage = event.message; },
        },
      },
    },
    thinking: {
      on: {
        TASK_COMPLETE: 'idle',
        TOOL_CALL: 'working',
        AGENT_HANDOFF: 'communicating',
        ERROR: 'error',
      },
    },
    communicating: {
      on: {
        TASK_COMPLETE: 'idle',
        LLM_CALL: 'thinking',
        ERROR: 'error',
      },
    },
    error: {
      on: {
        RESET: {
          target: 'idle',
          actions: ({ context }) => { context.errorMessage = null; },
        },
      },
    },
  },
});
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS (5 tests)

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(frontend): XState v5 agent FSM - 5 states with full transitions"
```

---

## Task 6: WebSocket Hook

**Files:**
- Create: `src/frontend/src/hooks/useWebSocket.ts`

- [ ] **Step 1: Write failing WS hook tests**

```typescript
// src/hooks/__tests__/useWebSocket.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebSocket } from '@hooks/useWebSocket';
import { useAgentStore } from '@stores/agentStore';

// Mock WebSocket
const mockWS = { send: vi.fn(), close: vi.fn(), onmessage: null as any, onopen: null as any, onerror: null as any };
vi.stubGlobal('WebSocket', vi.fn(() => mockWS));

describe('useWebSocket', () => {
  beforeEach(() => useAgentStore.getState().reset());

  it('dispatches agent status update to store on live event', () => {
    renderHook(() => useWebSocket('ws1'));
    // Simulate message from server
    mockWS.onmessage({ data: JSON.stringify({ event_type: 'agent.state.changed', agent_id: 'a1', status: 'working' }) });
    expect(useAgentStore.getState().agents['a1']?.status).toBe('working');
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/hooks/useWebSocket.ts`**

```typescript
import { useEffect, useRef } from 'react';
import { useAgentStore } from '@stores/agentStore';
import { useAlertStore } from '@stores/alertStore';
import { useMetricsStore } from '@stores/metricsStore';

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

export function useWebSocket(workspaceId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { upsertAgent, setAgentStatus } = useAgentStore();
  const { addAlert } = useAlertStore();
  const { updateLiveMetrics } = useMetricsStore();

  useEffect(() => {
    if (!workspaceId) return;
    const ws = new WebSocket(`${WS_BASE}/live?workspace_id=${workspaceId}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        dispatch(event);
      } catch { /* ignore malformed */ }
    };

    ws.onerror = () => console.error('[OAV WS] connection error');

    // Reconnect on close after 2s
    ws.onclose = () => {
      setTimeout(() => wsRef.current?.readyState !== WebSocket.OPEN && reconnect(), 2000);
    };

    return () => ws.close();
  }, [workspaceId]);

  function reconnect() {
    if (workspaceId) {
      wsRef.current = new WebSocket(`${WS_BASE}/live?workspace_id=${workspaceId}`);
    }
  }

  function dispatch(event: Record<string, unknown>) {
    const type = event.event_type as string;
    const agentId = event.agent_id as string;

    if (type === 'agent.state.changed' && agentId) {
      setAgentStatus(agentId, event.status as any);
    }
    if (type === 'agent.registered') {
      upsertAgent(event.agent as any);
    }
    if (type === 'alert.created') {
      addAlert(event.alert as any);
    }
    if (type?.startsWith('agent.llm.')) {
      updateLiveMetrics(event as any);
    }
  }
}
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(frontend): WebSocket hook with auto-reconnect and store dispatch"
```

---

## Task 7: Utility Libraries

**Files:**
- Create: `src/frontend/src/lib/isoMath.ts`
- Create: `src/frontend/src/lib/formatters.ts`
- Create: `src/frontend/src/lib/xpLevels.ts`
- Create: `src/frontend/src/lib/colorTokens.ts`

- [ ] **Step 1: Write failing utility tests**

```typescript
// src/lib/__tests__/isoMath.test.ts
import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld } from '@lib/isoMath';

describe('isoMath', () => {
  it('worldToScreen converts correctly', () => {
    const { x, y } = worldToScreen(0, 0, { tileW: 64, tileH: 32, originX: 400, originY: 200 });
    expect(x).toBe(400);
    expect(y).toBe(200);
  });

  it('round-trips world↔screen', () => {
    const opts = { tileW: 64, tileH: 32, originX: 400, originY: 200 };
    const screen = worldToScreen(3, 5, opts);
    const world = screenToWorld(screen.x, screen.y, opts);
    expect(Math.round(world.x)).toBe(3);
    expect(Math.round(world.y)).toBe(5);
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/lib/isoMath.ts`**

```typescript
interface IsoOptions { tileW: number; tileH: number; originX: number; originY: number; }

export function worldToScreen(wx: number, wy: number, opts: IsoOptions): { x: number; y: number } {
  return {
    x: opts.originX + (wx - wy) * (opts.tileW / 2),
    y: opts.originY + (wx + wy) * (opts.tileH / 2),
  };
}

export function screenToWorld(sx: number, sy: number, opts: IsoOptions): { x: number; y: number } {
  const dx = sx - opts.originX;
  const dy = sy - opts.originY;
  return {
    x: (dx / (opts.tileW / 2) + dy / (opts.tileH / 2)) / 2,
    y: (dy / (opts.tileH / 2) - dx / (opts.tileW / 2)) / 2,
  };
}
```

- [ ] **Step 3: Implement `src/lib/xpLevels.ts`**

```typescript
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

export function xpProgress(xp: number): { level: number; name: string; color: string; progress: number } {
  const level = levelFromXP(xp);
  const idx = level - 1;
  const currentThreshold = XP_THRESHOLDS[idx] ?? 0;
  const nextThreshold = XP_THRESHOLDS[idx + 1] ?? Infinity;
  const progress = nextThreshold === Infinity ? 1 : (xp - currentThreshold) / (nextThreshold - currentThreshold);
  return { level, name: LEVEL_NAMES[idx], color: LEVEL_COLORS[idx], progress };
}
```

- [ ] **Step 4: Implement `formatters.ts`** (formatCost, formatTokens, formatDuration)

- [ ] **Step 5: Run all lib tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git commit -m "feat(frontend): utility libs - isoMath, formatters, xpLevels"
```

---

## Task 8: PixiJS Virtual World — Canvas Bootstrap

**Files:**
- Create: `src/frontend/src/canvas/WorldCanvas.tsx`
- Create: `src/frontend/src/canvas/world/IsoGrid.ts`
- Create: `src/frontend/src/canvas/world/OfficeZones.ts`
- Create: `src/frontend/src/canvas/world/WorldRenderer.ts`

- [ ] **Step 1: Write failing WorldCanvas render test**

```typescript
// src/canvas/__tests__/WorldCanvas.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { WorldCanvas } from '@canvas/WorldCanvas';

// PixiJS doesn't run in jsdom — mock the Application
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    canvas: document.createElement('canvas'),
    stage: { addChild: vi.fn() },
    ticker: { add: vi.fn() },
    destroy: vi.fn(),
  })),
  Container: vi.fn(() => ({ addChild: vi.fn(), x: 0, y: 0 })),
  Graphics: vi.fn(() => ({ rect: vi.fn().mockReturnThis(), fill: vi.fn().mockReturnThis() })),
}));

describe('WorldCanvas', () => {
  it('renders without crashing', () => {
    const { container } = render(<WorldCanvas workspaceId="ws1" />);
    expect(container.querySelector('div')).toBeTruthy();
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/canvas/WorldCanvas.tsx`**

```typescript
import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { WorldRenderer } from './world/WorldRenderer';
import { useAgentStore } from '@stores/agentStore';
import { useUIStore } from '@stores/uiStore';

interface Props { workspaceId: string; }

export function WorldCanvas({ workspaceId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const agents = useAgentStore(s => s.agents);

  useEffect(() => {
    if (!containerRef.current) return;
    const app = new Application();
    appRef.current = app;

    app.init({
      resizeTo: containerRef.current,
      backgroundColor: 0x0f1117,
      antialias: true,
    }).then(() => {
      containerRef.current!.appendChild(app.canvas);
      const renderer = new WorldRenderer(app);
      rendererRef.current = renderer;
      renderer.init();
    });

    return () => { app.destroy(true); };
  }, []);

  // Sync agent state changes to canvas
  useEffect(() => {
    rendererRef.current?.syncAgents(Object.values(agents));
  }, [agents]);

  return <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'none' }} />;
}
```

- [ ] **Step 3: Implement `src/canvas/world/IsoGrid.ts`**

```typescript
import { Container, Graphics } from 'pixi.js';
import { worldToScreen } from '@lib/isoMath';

const ISO_OPTS = { tileW: 64, tileH: 32, originX: 0, originY: 0 };

export class IsoGrid {
  private container: Container;
  private cols: number;
  private rows: number;

  constructor(cols = 20, rows = 20) {
    this.container = new Container();
    this.cols = cols;
    this.rows = rows;
  }

  get view() { return this.container; }

  draw(centerX: number, centerY: number) {
    const opts = { ...ISO_OPTS, originX: centerX, originY: centerY };
    const g = new Graphics();
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const { x: sx, y: sy } = worldToScreen(x, y, opts);
        this.drawTile(g, sx, sy, opts.tileW, opts.tileH);
      }
    }
    this.container.addChild(g);
  }

  private drawTile(g: Graphics, sx: number, sy: number, tw: number, th: number) {
    const hw = tw / 2, hh = th / 2;
    g.moveTo(sx, sy - hh);
    g.lineTo(sx + hw, sy);
    g.lineTo(sx, sy + hh);
    g.lineTo(sx - hw, sy);
    g.lineTo(sx, sy - hh);
    g.stroke({ color: 0x2d3748, width: 1, alpha: 0.5 });
    g.fill({ color: 0x1e2433, alpha: 0.8 });
  }
}
```

- [ ] **Step 4: Implement `WorldRenderer.ts`** — orchestrates IsoGrid, manages AgentSprite instances

- [ ] **Step 5: Run canvas tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git commit -m "feat(frontend): PixiJS canvas bootstrap with isometric grid renderer"
```

---

## Task 9: Agent Sprites & Rive Animation

**Files:**
- Create: `src/frontend/src/canvas/agents/AgentSprite.ts`
- Create: `src/frontend/src/canvas/agents/AgentAvatarRive.ts`
- Create: `src/frontend/src/canvas/agents/AgentStatusBadge.ts`
- Create: `src/frontend/src/canvas/agents/AgentLabel.ts`
- Create: `src/frontend/src/canvas/agents/AgentXPBar.ts`

- [ ] **Step 1: Write failing AgentSprite test**

```typescript
// src/canvas/agents/__tests__/AgentSprite.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AgentSprite } from '@canvas/agents/AgentSprite';

vi.mock('pixi.js', () => ({
  Container: vi.fn(() => ({ addChild: vi.fn(), x: 0, y: 0, visible: true })),
  Text: vi.fn(() => ({ text: '', x: 0, y: 0 })),
  Graphics: vi.fn(() => ({ rect: vi.fn().mockReturnThis(), fill: vi.fn().mockReturnThis(), x: 0, y: 0 })),
}));

describe('AgentSprite', () => {
  it('creates container with correct agent ID', () => {
    const sprite = new AgentSprite({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    expect(sprite.agentId).toBe('a1');
  });

  it('updates status badge color on status change', () => {
    const sprite = new AgentSprite({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    const badge = sprite.updateStatus('working');
    expect(badge).toBeDefined();
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/canvas/agents/AgentSprite.ts`**

```typescript
import { Container, Text, Graphics } from 'pixi.js';
import type { Agent } from '@types/agent';

const STATUS_COLORS: Record<string, number> = {
  idle: 0x94a3b8,
  working: 0x3b82f6,
  thinking: 0xa855f7,
  communicating: 0x10b981,
  error: 0xef4444,
};

export class AgentSprite {
  private container: Container;
  private statusBadge: Graphics;
  private nameLabel: Text;
  readonly agentId: string;

  constructor(agent: Agent) {
    this.agentId = agent.id;
    this.container = new Container();
    this.statusBadge = new Graphics();
    this.nameLabel = new Text({ text: agent.name, style: { fontSize: 11, fill: 0xe2e8f0 } });
    this.nameLabel.x = -this.nameLabel.width / 2;
    this.nameLabel.y = -36;
    this.drawBody();
    this.container.addChild(this.statusBadge, this.nameLabel);
    this.updateStatus(agent.status);
  }

  get view() { return this.container; }

  private drawBody() {
    // Placeholder: colored diamond until Rive assets available
    const g = new Graphics();
    g.moveTo(0, -16).lineTo(14, 0).lineTo(0, 16).lineTo(-14, 0).lineTo(0, -16);
    g.fill({ color: 0x3b82f6 });
    this.container.addChildAt(g, 0);
  }

  updateStatus(status: Agent['status']): Graphics {
    this.statusBadge.clear();
    this.statusBadge.circle(0, -24, 5).fill({ color: STATUS_COLORS[status] ?? 0x94a3b8 });
    return this.statusBadge;
  }

  moveTo(x: number, y: number) {
    this.container.x = x;
    this.container.y = y;
  }
}
```

- [ ] **Step 3: Implement `AgentLabel.ts`** and `AgentXPBar.ts`**

- [ ] **Step 4: Implement `AgentAvatarRive.ts`** — Rive state machine controller (loads `.riv` file, drives state transitions)

```typescript
import { Rive, StateMachineInput } from '@rive-app/canvas';

export class AgentAvatarRive {
  private rive: Rive | null = null;
  private stateInput: StateMachineInput | null = null;

  async load(canvas: HTMLCanvasElement, rivSrc: string) {
    this.rive = new Rive({
      src: rivSrc,
      canvas,
      autoplay: true,
      stateMachines: 'AgentStateMachine',
      onLoad: () => {
        const inputs = this.rive!.stateMachineInputs('AgentStateMachine');
        this.stateInput = inputs?.find(i => i.name === 'agentState') ?? null;
      },
    });
  }

  // State index: 0=idle, 1=working, 2=thinking, 3=communicating, 4=error
  setState(stateIndex: number) {
    if (this.stateInput) this.stateInput.value = stateIndex;
  }

  destroy() { this.rive?.cleanup(); }
}
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git commit -m "feat(frontend): AgentSprite with status indicators, Rive animation controller"
```

---

## Task 10: Auth & Login Page

**Files:**
- Create: `src/frontend/src/pages/LoginPage.tsx`
- Create: `src/frontend/src/main.tsx`
- Create: `src/frontend/src/App.tsx`
- Create: `src/frontend/src/routes.tsx`
- Create: `src/frontend/src/index.css`

- [ ] **Step 1: Write failing login page test**

```typescript
// src/pages/__tests__/LoginPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@pages/LoginPage';

vi.mock('@services/api', () => ({ apiClient: { post: vi.fn().mockResolvedValue({ data: { access_token: 'tok', workspace_id: 'ws1' } }) } }));

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/password/i)).toBeTruthy();
  });

  it('submit button is present', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });
});
```

Run: `npm test`
Expected: FAIL

- [ ] **Step 2: Implement `src/pages/LoginPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@services/api';

export function LoginPage() {
  const [email, setEmail] = useState('kotsai@gmail.com');
  const [password, setPassword] = useState('kots@123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await apiClient.post('/api/auth/login', { email, password });
      localStorage.setItem('oav_token', data.access_token);
      localStorage.setItem('oav_workspace', data.workspace_id);
      navigate('/world');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-oav-bg flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-oav-surface border border-oav-border rounded-xl p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-oav-text">OpenAgentVisualizer</h1>
        {error && <p className="text-oav-error text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-oav-bg border border-oav-border rounded-lg px-4 py-2 text-oav-text"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-oav-bg border border-oav-border rounded-lg px-4 py-2 text-oav-text"
        />
        <button type="submit" className="w-full bg-oav-accent text-white rounded-lg py-2 font-semibold hover:bg-blue-600">
          Sign In
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Implement `App.tsx`, `routes.tsx`, `main.tsx`** (React Router, QueryClientProvider, auth guard)

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git commit -m "feat(frontend): login page, app routing, React root"
```

---

## Task 11: Dashboard & Metrics Charts

**Files:**
- Create: `src/frontend/src/pages/DashboardPage.tsx`
- Create: `src/frontend/src/components/metrics/CostChart.tsx`
- Create: `src/frontend/src/components/metrics/TokenUsageBar.tsx`
- Create: `src/frontend/src/components/metrics/CostSummaryCard.tsx`

- [ ] **Step 1: Write failing chart tests**

```typescript
// src/components/metrics/__tests__/CostChart.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostChart } from '@components/metrics/CostChart';

const mockData = [
  { date: '2026-03-01', cost: 1.23 },
  { date: '2026-03-02', cost: 0.89 },
];

describe('CostChart', () => {
  it('renders chart container', () => {
    const { container } = render(<CostChart data={mockData} />);
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement `CostChart.tsx`**

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { data: Array<{ date: string; cost: number }>; }

export function CostChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v.toFixed(2)}`} />
        <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid #2d3748', color: '#e2e8f0' }} />
        <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="url(#costGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Implement `TokenUsageBar.tsx`** and `CostSummaryCard.tsx`**

- [ ] **Step 4: Implement `DashboardPage.tsx`** — uses TanStack Query to fetch metrics, renders 3 charts + KPI cards

- [ ] **Step 5: Run tests, commit**
```bash
git commit -m "feat(frontend): dashboard page with cost and token charts"
```

---

## Task 12: Gamification Components

**Files:**
- Create: `src/frontend/src/components/gamification/XPProgressBar.tsx`
- Create: `src/frontend/src/components/gamification/LeaderboardTable.tsx`
- Create: `src/frontend/src/components/gamification/LevelUpToast.tsx`

- [ ] **Step 1: Write failing XP tests**

```typescript
// src/components/gamification/__tests__/XPProgressBar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPProgressBar } from '@components/gamification/XPProgressBar';

describe('XPProgressBar', () => {
  it('shows level name', () => {
    render(<XPProgressBar xpTotal={500} />);
    expect(screen.getByText('Rookie')).toBeTruthy();
  });

  it('shows Pro at 1000 XP', () => {
    render(<XPProgressBar xpTotal={1000} />);
    expect(screen.getByText('Pro')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement `XPProgressBar.tsx`**

```tsx
import { xpProgress } from '@lib/xpLevels';

export function XPProgressBar({ xpTotal }: { xpTotal: number }) {
  const { level, name, color, progress } = xpProgress(xpTotal);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-oav-muted">
        <span style={{ color }}>{name}</span>
        <span>Lv {level}</span>
      </div>
      <div className="h-1.5 bg-oav-bg rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `LevelUpToast.tsx`** with GSAP animation

```tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function LevelUpToast({ agentName, newLevel, onDone }: { agentName: string; newLevel: number; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 40, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)',
        onComplete: () => gsap.to(ref.current, { opacity: 0, delay: 2, onComplete: onDone }) }
    );
  }, []);

  return (
    <div ref={ref} className="fixed bottom-8 right-8 bg-oav-surface border border-oav-border rounded-xl px-6 py-4 shadow-xl z-50">
      <p className="text-oav-text font-bold">⬆️ Level Up!</p>
      <p className="text-oav-muted text-sm">{agentName} reached Level {newLevel}</p>
    </div>
  );
}
```

- [ ] **Step 4: Implement `LeaderboardTable.tsx`**

- [ ] **Step 5: Run tests, commit**
```bash
git commit -m "feat(frontend): gamification components - XP bar, leaderboard, level-up toast"
```

---

## Task 13: Alerts & Replay Pages

**Files:**
- Create: `src/frontend/src/pages/AlertsPage.tsx`
- Create: `src/frontend/src/pages/ReplayPage.tsx`
- Create: `src/frontend/src/hooks/useSessionReplay.ts`
- Create: `src/frontend/src/components/alerts/AlertList.tsx`

- [ ] **Step 1: Implement `useSessionReplay.ts`** — fetches session events, manages playback cursor with requestAnimationFrame ticker

- [ ] **Step 2: Implement `ReplayPage.tsx`** — timeline scrubber, play/pause/speed controls, mini virtual world showing agent positions at cursor time

- [ ] **Step 3: Implement `AlertsPage.tsx`** — TanStack Query for alerts list, resolve button, loop-detected alert cards

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Verify app builds**

```bash
cd src/frontend && npm run build
```

Expected: No TypeScript errors, dist/ generated

- [ ] **Step 6: Final commit**
```bash
git commit -m "feat(frontend): complete MVP frontend - alerts, replay, virtual world, dashboard"
```
