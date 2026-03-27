# OpenAgentVisualizer Sprint 2 -- Architecture Design Document

**Author:** Tech Lead (Stage 2.1)
**Date:** 2026-03-27
**Status:** APPROVED
**Sprint:** 2
**Inputs:** Sprint 2 PRD, PM Handoff (stage-1.1), existing Sprint 1 codebase

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [PixiJS Scene Graph Architecture](#2-pixijs-scene-graph-architecture)
3. [XState FSM Design](#3-xstate-fsm-design)
4. [ReactFlow Topology Architecture](#4-reactflow-topology-architecture)
5. [WebSocket Room Architecture](#5-websocket-room-architecture)
6. [Event Replay System](#6-event-replay-system)
7. [Agent Relationship Graph](#7-agent-relationship-graph)
8. [Gamification Achievement System](#8-gamification-achievement-system)
9. [Continuous Aggregates](#9-continuous-aggregates)
10. [Performance Budget](#10-performance-budget)
11. [New API Endpoints](#11-new-api-endpoints)
12. [New Database Migrations](#12-new-database-migrations)
13. [Open Questions Resolved](#13-open-questions-resolved)
14. [Implementation Sequencing](#14-implementation-sequencing)

---

## 1. Architecture Overview

Sprint 2 transforms the headless API into a visual platform. The architecture adds three major subsystems on top of the Sprint 1 foundation:

```
                         +---------------------+
                         |   React SPA (Vite)  |
                         +---------------------+
                         |  Pages / Components |
                         |   Recharts / Forms  |
                         +----------+----------+
                                    |
              +---------------------+---------------------+
              |                     |                     |
   +----------v----------+  +------v------+  +-----------v-----------+
   | PixiJS Canvas Engine|  | ReactFlow   |  | Zustand Stores        |
   | (WorldCanvas)       |  | (Topology)  |  | (agent, metrics, ui)  |
   +----------+----------+  +------+------+  +-----------+-----------+
              |                     |                     |
              +---------------------+---------------------+
                                    |
                         +----------v----------+
                         | XState Agent FSMs   |
                         | (per-agent instance) |
                         +----------+----------+
                                    |
                         +----------v----------+
                         |  WebSocket Client   |
                         |  (room subscriptions)|
                         +----------+----------+
                                    | wss
                         +----------v----------+
                         |  FastAPI Backend     |
                         |  + WebSocket Router  |
                         +----------+----------+
                                    |
              +---------------------+---------------------+
              |                     |                     |
   +----------v--------+  +--------v--------+  +---------v---------+
   | Redis Pub/Sub      |  | PostgreSQL +    |  | Celery Workers    |
   | (room channels)    |  | TimescaleDB     |  | (graph, achieve.) |
   +--------------------+  +-----------------+  +-------------------+
```

### Key Architectural Decisions

**ADR-001: PixiJS via imperative class hierarchy, not @pixi/react declarative.**
The existing codebase already uses imperative `Application` + `WorldRenderer` + `AgentSprite` classes. The PRD requires sprite pooling, dirty-flag rendering, and fine-grained GSAP control -- all of which are easier with imperative PixiJS. We keep the existing pattern: a single React `<WorldCanvas>` component that holds an imperative `Application` ref. No `@pixi/react` Stage/Sprite JSX components.

**ADR-002: XState machines are managed in a Zustand store, not per-component.**
Creating 50 `useActor` hooks inside React causes re-renders. Instead, a `MachineManager` class outside React owns all XState actor instances. The Zustand `agentStore` holds serialized snapshots (current state value). The canvas reads state from the store; WebSocket events feed transitions into the `MachineManager`.

**ADR-003: WebSocket rooms via Redis Pub/Sub channels, not in-process maps.**
Room routing uses Redis channels (`ws:workspace:{id}`, `ws:agent:{id}`, `ws:session:{id}`). This decouples room membership from the WebSocket process and supports horizontal scaling. The existing `WebSocketManager` is refactored to track per-room subscriptions.

**ADR-004: Relationship graph is pre-computed, not queried live.**
The graph is computed by a Celery task and cached in Redis as a JSON blob. The API serves the cached graph. Incremental updates run every 30 seconds when new events arrive. This avoids expensive JOINs on every topology page load.

**ADR-005: Continuous aggregates replace the manual metrics_agg table.**
TimescaleDB continuous aggregates replace the application-level `metrics_agg` table. The Alembic migration creates the continuous aggregates via raw SQL. The existing `GET /api/metrics/aggregated` endpoint is repointed to the continuous aggregate views.

---

## 2. PixiJS Scene Graph Architecture

### 2.1 Container Hierarchy

```
Application.stage
  |
  +-- WorldContainer (Container) -- pan/zoom transforms applied here
  |     |
  |     +-- GridLayer (Container) -- isometric grid tiles (existing IsoGrid)
  |     |
  |     +-- ConnectionLayer (Container) -- lines between agents (below agents)
  |     |
  |     +-- AgentLayer (Container) -- all AgentSprite containers
  |     |     |
  |     |     +-- AgentSprite (Container) -- per agent
  |     |           +-- BodyGraphics (diamond shape, tinted by state)
  |     |           +-- LevelRing (Graphics, colored arc by level)
  |     |           +-- StatusDot (Graphics, 5px circle)
  |     |           +-- NameLabel (Text)
  |     |           +-- XPBar (Graphics, progress bar)
  |     |           +-- BadgeRow (Container, up to 3 badge sprites + "+N" text)
  |     |           +-- ParticleContainer (Container, for GSAP particle effects)
  |     |
  |     +-- EffectsLayer (Container) -- floating text (+XP), particle bursts
  |
  +-- UILayer (Container) -- HUD elements not affected by pan/zoom
        +-- TooltipContainer
        +-- MinimapContainer (future)
        +-- FPSCounter (Text, dev only)
```

### 2.2 WorldContainer: Camera System (Pan/Zoom)

The `WorldContainer` is the single transform node for camera. Pan and zoom are applied to its `position` and `scale` properties.

```typescript
// File: src/frontend/src/canvas/camera/CameraController.ts

export class CameraController {
  private world: Container;
  private minZoom = 0.25;
  private maxZoom = 4.0;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };

  constructor(world: Container, canvas: HTMLCanvasElement) {
    canvas.addEventListener('wheel', this.onWheel.bind(this));
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(this.maxZoom, Math.max(this.minZoom, this.world.scale.x * factor));
    // Zoom toward mouse position
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    const worldX = (mouseX - this.world.x) / this.world.scale.x;
    const worldY = (mouseY - this.world.y) / this.world.scale.y;
    this.world.scale.set(newScale);
    this.world.x = mouseX - worldX * newScale;
    this.world.y = mouseY - worldY * newScale;
  }

  // pointerdown/move/up implement drag panning
  // ...
}
```

**Viewport Culling:** On each ticker frame, iterate `AgentLayer.children` and set `visible = false` for sprites outside the viewport bounds. This is a simple AABB check:

```typescript
private cullOffscreen(): void {
  const viewBounds = this.getViewportBounds(); // inverse transform of canvas rect
  for (const child of this.agentLayer.children) {
    const sprite = child as Container;
    child.visible = viewBounds.contains(sprite.x, sprite.y);
  }
}
```

Culling runs once per frame in the ticker callback, gated by a dirty flag that is set when the camera moves.

### 2.3 Agent Sprite Management and Pooling

The existing `AgentSprite` class is extended. A `SpritePool` manages creation/recycling:

```typescript
// File: src/frontend/src/canvas/agents/SpritePool.ts

export class SpritePool {
  private pool: AgentSprite[] = [];
  private active: Map<string, AgentSprite> = new Map();
  private readonly agentLayer: Container;

  constructor(agentLayer: Container) {
    this.agentLayer = agentLayer;
  }

  /** Acquire a sprite for an agent. Reuses from pool or creates new. */
  acquire(agent: Agent): AgentSprite {
    let sprite = this.pool.pop();
    if (!sprite) {
      sprite = new AgentSprite();
    }
    sprite.bind(agent); // configure for this agent
    this.active.set(agent.id, sprite);
    this.agentLayer.addChild(sprite.view);
    return sprite;
  }

  /** Release a sprite back to the pool. */
  release(agentId: string): void {
    const sprite = this.active.get(agentId);
    if (sprite) {
      this.agentLayer.removeChild(sprite.view);
      sprite.unbind(); // reset to default state
      this.active.delete(agentId);
      this.pool.push(sprite);
    }
  }

  /** Sync pool with current agent list. */
  sync(agents: Agent[]): void {
    const incoming = new Set(agents.map(a => a.id));
    // Release sprites for removed agents
    for (const id of this.active.keys()) {
      if (!incoming.has(id)) this.release(id);
    }
    // Acquire or update sprites for current agents
    for (const agent of agents) {
      const existing = this.active.get(agent.id);
      if (existing) {
        existing.update(agent);
      } else {
        this.acquire(agent);
      }
    }
  }
}
```

Pool capacity: pre-allocate 0 sprites; create on demand up to 200 (workspace max). Recycled sprites avoid GC pressure from repeated Graphics/Text construction.

### 2.4 AgentSprite Extension

The existing `AgentSprite` class is refactored to support the new visual requirements:

```typescript
// File: src/frontend/src/canvas/agents/AgentSprite.ts (refactored)

export class AgentSprite {
  readonly view: Container;
  private body: Graphics;
  private levelRing: Graphics;
  private statusDot: Graphics;
  private nameLabel: Text;
  private xpBar: Graphics;
  private badgeRow: Container;
  private particleContainer: Container;
  private _agentId: string | null = null;
  private _dirty = true;

  constructor() {
    this.view = new Container();
    this.body = new Graphics();
    this.levelRing = new Graphics();
    this.statusDot = new Graphics();
    this.nameLabel = new Text({ text: '', style: { fontSize: 11, fill: 0xe2e8f0 } });
    this.xpBar = new Graphics();
    this.badgeRow = new Container();
    this.particleContainer = new Container();
    this.view.addChild(
      this.body, this.levelRing, this.statusDot,
      this.nameLabel, this.xpBar, this.badgeRow, this.particleContainer
    );
  }

  get agentId(): string | null { return this._agentId; }
  get dirty(): boolean { return this._dirty; }

  bind(agent: Agent): void {
    this._agentId = agent.id;
    this.nameLabel.text = agent.name;
    this.nameLabel.x = -(this.nameLabel.width / 2);
    this.nameLabel.y = -36;
    this.drawBody();
    this.drawLevelRing(agent.level);
    this.drawStatusDot(agent.status);
    this.drawXPBar(agent.xp_total, agent.level);
    this.drawBadges([]);  // badges loaded async
    this._dirty = true;
  }

  unbind(): void {
    this._agentId = null;
    this.body.clear();
    this.levelRing.clear();
    this.statusDot.clear();
    this.xpBar.clear();
    this.badgeRow.removeChildren();
    this.particleContainer.removeChildren();
    this.nameLabel.text = '';
    this._dirty = false;
  }

  update(agent: Agent): void {
    this.drawStatusDot(agent.status);
    this.drawLevelRing(agent.level);
    this.drawXPBar(agent.xp_total, agent.level);
    this._dirty = true;
  }

  /** Level ring colors per PRD section 3.2 */
  private drawLevelRing(level: number): void {
    const colors: Record<number, number> = {
      1: 0x94a3b8, 2: 0x3b82f6, 3: 0x22c55e, 4: 0xa855f7,
      5: 0xeab308, 6: 0xeab308, 7: 0xeab308, 8: 0xeab308,
      9: 0xeab308, 10: 0xeab308,
    };
    this.levelRing.clear();
    this.levelRing.circle(0, 0, 18).stroke({
      color: colors[level] ?? 0x94a3b8, width: 2,
    });
  }
  // drawBody, drawStatusDot, drawXPBar, drawBadges...
}
```

### 2.5 Render Loop Optimization

The `WorldRenderer` uses a dirty-flag approach. The PixiJS `Ticker` callback runs every frame but only performs expensive operations when state has changed:

```typescript
// In WorldRenderer.init()
this.app.ticker.add(this.tick, this);

private tick(): void {
  // 1. Cull offscreen sprites (only if camera moved)
  if (this.cameraDirty) {
    this.camera.cullOffscreen();
    this.cameraDirty = false;
  }

  // 2. Update dirty sprites only
  for (const sprite of this.spritePool.activeSprites()) {
    if (sprite.dirty) {
      sprite.render();  // redraw changed graphics
    }
  }

  // 3. GSAP animations update automatically via its own ticker (no manual step)
}
```

**Batch rendering:** PixiJS 8 automatically batches draw calls for Graphics and Sprites in the same Container. No manual batching needed. The key optimization is minimizing the number of Graphics.clear()/redraw calls per frame.

### 2.6 Force-Directed Layout

Initial agent positions use a simple force-directed layout computed once on load, then cached:

```typescript
// File: src/frontend/src/canvas/layout/forceLayout.ts

export interface LayoutNode { id: string; x: number; y: number; }

export function computeForceLayout(
  agents: { id: string }[],
  width: number,
  height: number,
  iterations: number = 50,
): LayoutNode[] {
  // Initialize positions in a grid
  const nodes: LayoutNode[] = agents.map((a, i) => ({
    id: a.id,
    x: (i % 10) * 80 + width / 4,
    y: Math.floor(i / 10) * 80 + height / 4,
  }));

  const repulsion = 5000;
  const idealDist = 100;
  const damping = 0.9;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = nodes.map(() => ({ fx: 0, fy: 0 }));

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        forces[i].fx += fx;
        forces[i].fy += fy;
        forces[j].fx -= fx;
        forces[j].fy -= fy;
      }
    }

    // Center gravity
    const cx = width / 2, cy = height / 2;
    for (let i = 0; i < nodes.length; i++) {
      forces[i].fx += (cx - nodes[i].x) * 0.01;
      forces[i].fy += (cy - nodes[i].y) * 0.01;
    }

    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x += forces[i].fx * damping;
      nodes[i].y += forces[i].fy * damping;
    }
  }

  return nodes;
}
```

This runs once on `WorldRenderer.syncAgents()` when positions are not already cached. For 50 agents with 50 iterations, this completes in <10ms.

### 2.7 Integration with React

The `WorldCanvas` React component is the bridge. It remains thin:

- `useEffect([], ...)` creates the PixiJS `Application`, `WorldRenderer`, `CameraController`
- `useEffect([agents], ...)` calls `renderer.syncAgents(agents)` when the Zustand store updates
- A new `useEffect([wsMessages], ...)` feeds real-time events into the `MachineManager` and triggers sprite updates
- The component exposes an `onAgentClick` callback and an `onAgentDoubleClick` that navigates to the agent detail page

### 2.8 Cleanup

On unmount:
1. Stop all XState actors via `MachineManager.destroyAll()`
2. GSAP: `gsap.killTweensOf(target)` for all active sprites
3. Release all sprites back to pool (calls `unbind()`)
4. Destroy the PixiJS Application with `app.destroy(true)` (removes textures from GPU)

---

## 3. XState FSM Design

### 3.1 State Machine Definition

The PRD specifies five visible states: `idle`, `active`, `waiting`, `error`, `complete`. The existing machine has different state names (`idle`, `working`, `thinking`, `communicating`, `error`). We reconcile by mapping the PRD states to the existing ones and adding the missing `waiting` and `complete` states.

**Decision:** Rename to match the PRD states for consistency with the backend `agent.status` field. The existing `working`/`thinking`/`communicating` become sub-states of `active`.

```typescript
// File: src/frontend/src/machines/agentMachine.ts (rewrite)

import { setup, assign, type ActorRefFrom } from 'xstate';

export type AgentState = 'idle' | 'active' | 'waiting' | 'error' | 'complete';

export interface AgentMachineContext {
  agentId: string;
  currentTaskId: string | null;
  errorMessage: string | null;
  previousState: AgentState | null;
}

export type AgentMachineEvent =
  | { type: 'ACTIVATE'; taskId?: string }
  | { type: 'WAIT' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE' }
  | { type: 'ERROR'; message: string }
  | { type: 'RECOVER' }
  | { type: 'RESET' };

export const agentMachine = setup({
  types: {
    context: {} as AgentMachineContext,
    events: {} as AgentMachineEvent,
  },
  actions: {
    notifyStateChange: ({ context, event }) => {
      // Side effect: emit to canvas animation system
      // Implemented by MachineManager via subscription
    },
    recordPreviousState: assign({
      previousState: ({ context }) => {
        // Capture current state before transition
        // (XState invoke this before entering new state)
        return null; // set by MachineManager on snapshot read
      },
    }),
  },
}).createMachine({
  id: 'agent',
  initial: 'idle',
  context: ({ input }: { input: { agentId: string } }) => ({
    agentId: input.agentId,
    currentTaskId: null,
    errorMessage: null,
    previousState: null,
  }),
  states: {
    idle: {
      entry: ['notifyStateChange'],
      on: {
        ACTIVATE: {
          target: 'active',
          actions: assign({
            currentTaskId: ({ event }) => event.taskId ?? null,
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({ errorMessage: ({ event }) => event.message }),
        },
      },
    },
    active: {
      entry: ['notifyStateChange'],
      on: {
        WAIT: 'waiting',
        COMPLETE: {
          target: 'complete',
          actions: assign({ currentTaskId: () => null }),
        },
        ERROR: {
          target: 'error',
          actions: assign({ errorMessage: ({ event }) => event.message }),
        },
      },
    },
    waiting: {
      entry: ['notifyStateChange'],
      on: {
        RESUME: 'active',
        ERROR: {
          target: 'error',
          actions: assign({ errorMessage: ({ event }) => event.message }),
        },
      },
    },
    error: {
      entry: ['notifyStateChange'],
      on: {
        RECOVER: {
          target: 'active',
          actions: assign({ errorMessage: () => null }),
        },
        RESET: {
          target: 'idle',
          actions: assign({
            errorMessage: () => null,
            currentTaskId: () => null,
          }),
        },
      },
    },
    complete: {
      entry: ['notifyStateChange'],
      on: {
        RESET: {
          target: 'idle',
          actions: assign({ currentTaskId: () => null }),
        },
      },
    },
  },
});

export type AgentMachineActor = ActorRefFrom<typeof agentMachine>;
```

### 3.2 Transition Map

```
idle ----ACTIVATE----> active
idle ----ERROR-------> error
active --WAIT--------> waiting
active --COMPLETE----> complete
active --ERROR-------> error
waiting -RESUME------> active
waiting -ERROR-------> error
error ---RECOVER-----> active
error ---RESET-------> idle
complete-RESET-------> idle
```

### 3.3 MachineManager (Outside React)

```typescript
// File: src/frontend/src/machines/MachineManager.ts

import { createActor, type Snapshot } from 'xstate';
import { agentMachine, type AgentMachineEvent, type AgentState } from './agentMachine';
import { useAgentStore } from '../stores/agentStore';

type StateChangeCallback = (agentId: string, from: AgentState, to: AgentState) => void;

export class MachineManager {
  private actors: Map<string, ReturnType<typeof createActor>> = new Map();
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();
  private onStateChange: StateChangeCallback;

  constructor(onStateChange: StateChangeCallback) {
    this.onStateChange = onStateChange;
  }

  /** Create and start a machine for an agent. */
  create(agentId: string, initialState?: AgentState): void {
    if (this.actors.has(agentId)) return;

    const actor = createActor(agentMachine, {
      input: { agentId },
    });

    const sub = actor.subscribe((snapshot) => {
      const stateValue = snapshot.value as AgentState;
      // Push to Zustand store (no React re-render per machine)
      useAgentStore.getState().setAgentStatus(agentId, stateValue);
    });

    this.actors.set(agentId, actor);
    this.subscriptions.set(agentId, sub);
    actor.start();

    // If agent is not idle, send initial transition
    if (initialState && initialState !== 'idle') {
      this.send(agentId, this.stateToEvent(initialState));
    }
  }

  /** Send an event to a specific agent's machine. */
  send(agentId: string, event: AgentMachineEvent): void {
    const actor = this.actors.get(agentId);
    if (!actor) return;
    const prevState = (actor.getSnapshot().value as AgentState);
    actor.send(event);
    const newState = (actor.getSnapshot().value as AgentState);
    if (prevState !== newState) {
      this.onStateChange(agentId, prevState, newState);
    }
  }

  /** Stop and clean up a single agent machine. */
  destroy(agentId: string): void {
    this.subscriptions.get(agentId)?.unsubscribe();
    this.subscriptions.delete(agentId);
    this.actors.get(agentId)?.stop();
    this.actors.delete(agentId);
  }

  /** Stop all machines. Called on WorldCanvas unmount. */
  destroyAll(): void {
    for (const id of this.actors.keys()) {
      this.destroy(id);
    }
  }

  private stateToEvent(state: AgentState): AgentMachineEvent {
    switch (state) {
      case 'active': return { type: 'ACTIVATE' };
      case 'waiting': return { type: 'WAIT' };
      case 'error': return { type: 'ERROR', message: 'initial' };
      case 'complete': return { type: 'COMPLETE' };
      default: return { type: 'RESET' };
    }
  }
}
```

### 3.4 Mapping XState States to PixiJS Visual Effects

The `MachineManager.onStateChange` callback drives GSAP animations:

| From -> To | GSAP Animation | Duration |
|-----------|----------------|----------|
| any -> idle | Tint to 0x94a3b8 (gray), start breathing (scale 1.0-1.02, 2s loop) | 400ms tint |
| any -> active | Tint to 0x22c55e (green), glow filter, faster pulse | 400ms tint |
| any -> waiting | Tint to 0xf59e0b (amber), clock icon overlay appears | 400ms tint |
| any -> error | Tint to 0xef4444 (red), shake (x +/-3px, 3 cycles) | 300ms shake |
| any -> complete | Tint to 0x3b82f6 (blue), checkmark overlay appears | 400ms tint |

```typescript
// File: src/frontend/src/canvas/animations/StateAnimator.ts

import gsap from 'gsap';
import type { AgentSprite } from '../agents/AgentSprite';
import type { AgentState } from '../../machines/agentMachine';

const STATE_TINTS: Record<AgentState, number> = {
  idle: 0x94a3b8,
  active: 0x22c55e,
  waiting: 0xf59e0b,
  error: 0xef4444,
  complete: 0x3b82f6,
};

export class StateAnimator {
  /** Animate a sprite from one state to another. */
  transition(sprite: AgentSprite, from: AgentState, to: AgentState): void {
    const body = sprite.bodyGraphics;

    // Kill any running tweens on this sprite
    gsap.killTweensOf(body);
    gsap.killTweensOf(sprite.view);

    // Tint transition (400ms ease-out)
    gsap.to(body, {
      tint: STATE_TINTS[to],
      duration: 0.4,
      ease: 'power2.out',
    });

    // State-specific animations
    switch (to) {
      case 'idle':
        // Breathing: scale 1.0 -> 1.02 -> 1.0, infinite loop
        gsap.to(sprite.view.scale, {
          x: 1.02, y: 1.02,
          duration: 1,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
        break;

      case 'active':
        // Faster pulse
        gsap.to(sprite.view.scale, {
          x: 1.05, y: 1.05,
          duration: 0.5,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
        break;

      case 'error':
        // Shake: x offset +/-3px, 3 cycles, 300ms total
        gsap.to(sprite.view, {
          x: sprite.view.x + 3,
          duration: 0.05,
          yoyo: true,
          repeat: 5,
          ease: 'none',
        });
        break;

      case 'waiting':
        sprite.showOverlayIcon('clock');
        break;

      case 'complete':
        sprite.showOverlayIcon('checkmark');
        break;
    }
  }

  /** Level-up celebration. */
  levelUp(sprite: AgentSprite, xpGained: number): gsap.core.Timeline {
    const tl = gsap.timeline();
    // Scale pulse
    tl.to(sprite.view.scale, { x: 1.3, y: 1.3, duration: 0.3, ease: 'back.out(2)' });
    tl.to(sprite.view.scale, { x: 1.0, y: 1.0, duration: 0.3, ease: 'power2.in' });
    // Particle burst (20 particles)
    tl.call(() => sprite.emitParticles(20), [], 0);
    // Floating +XP text
    tl.call(() => sprite.showFloatingText(`+${xpGained} XP`), [], 0);
    return tl;
  }

  /** Achievement unlock. */
  achievementUnlock(sprite: AgentSprite, achievementIcon: string): gsap.core.Timeline {
    const tl = gsap.timeline();
    tl.call(() => sprite.addBadge(achievementIcon), []);
    tl.from(sprite.badgeRow.children[sprite.badgeRow.children.length - 1], {
      y: 20, alpha: 0, duration: 0.4, ease: 'back.out(2)',
    });
    return tl;
  }
}
```

### 3.5 Rive Integration (Fallback Pattern)

Rive animations are optional. The system checks for `.riv` asset availability:

```typescript
// File: src/frontend/src/canvas/animations/RiveManager.ts

import { Rive } from '@rive-app/canvas';

export class RiveManager {
  private loaded: Map<string, boolean> = new Map();
  private instances: Map<string, Rive> = new Map();

  async preload(assetNames: string[]): Promise<void> {
    for (const name of assetNames) {
      try {
        // Attempt to fetch the .riv file
        const resp = await fetch(`/assets/rive/${name}.riv`);
        this.loaded.set(name, resp.ok);
      } catch {
        this.loaded.set(name, false);
      }
    }
  }

  isAvailable(name: string): boolean {
    return this.loaded.get(name) === true;
  }

  /** Play a Rive animation. Falls back to GSAP via the provided callback. */
  playOrFallback(
    name: string,
    canvas: HTMLCanvasElement,
    gsapFallback: () => void,
  ): void {
    if (!this.isAvailable(name)) {
      gsapFallback();
      return;
    }
    // Play Rive animation on an offscreen canvas overlaid on the sprite
    const rive = new Rive({
      src: `/assets/rive/${name}.riv`,
      canvas,
      autoplay: true,
      onStop: () => {
        rive.cleanup();
        this.instances.delete(name);
      },
    });
    this.instances.set(name, rive);
  }

  destroyAll(): void {
    for (const rive of this.instances.values()) {
      rive.cleanup();
    }
    this.instances.clear();
  }
}
```

---

## 4. ReactFlow Topology Architecture

### 4.1 Component Structure

```
src/frontend/src/components/topology/
  TopologyGraph.tsx         -- main ReactFlow wrapper
  nodes/
    AgentNode.tsx           -- custom node with status indicator
  edges/
    DataFlowEdge.tsx        -- solid arrow, labeled
    ControlFlowEdge.tsx     -- solid arrow with different color
    SharedSessionEdge.tsx   -- dashed line, undirected
  hooks/
    useTopologyData.ts      -- fetches graph from GET /api/agents/graph
    useTopologyLayout.ts    -- runs dagre/force layout
```

### 4.2 Custom Node Types

```typescript
// File: src/frontend/src/components/topology/nodes/AgentNode.tsx

import { Handle, Position, type NodeProps } from 'reactflow';

interface AgentNodeData {
  name: string;
  status: AgentState;
  level: number;
  xp_total: number;
  taskCount: number;
  achievementCount: number;
}

export function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  return (
    <div className={`
      rounded-lg border-2 p-3 min-w-[140px]
      ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-600'}
      bg-gray-800 text-white
    `}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColor(data.status)}`} />
        <span className="font-medium text-sm">{data.name}</span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Lv.{data.level} | {data.xp_total} XP
      </div>
      {selected && (
        <div className="mt-2 text-xs border-t border-gray-700 pt-2">
          <div>Tasks: {data.taskCount}</div>
          <div>Achievements: {data.achievementCount}</div>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### 4.3 Custom Edge Types

Three edge types per the PRD:

| Edge Type | Style | Label | Arrow |
|-----------|-------|-------|-------|
| `delegates_to` | Solid, blue | "delegates (N)" | Directed arrow |
| `data_flow` | Solid, green | "data flow (N)" | Directed arrow |
| `shared_session` | Dashed, gray | "session (N)" | None (undirected) |
| `monitors` | Dotted, amber | "monitors" | Directed arrow |

### 4.4 Layout Algorithm

Use `dagre` for hierarchical layouts (when graph has clear delegation chains) and fall back to force-directed for organic graphs:

```typescript
// File: src/frontend/src/components/topology/hooks/useTopologyLayout.ts

import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export function layoutDagre(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  for (const node of nodes) {
    g.setNode(node.id, { width: 160, height: 80 });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }
  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x - 80, y: pos.y - 40 } };
  });
}
```

### 4.5 Real-Time Updates

The topology component subscribes to the workspace WebSocket room. When `graph_updated` events arrive, the component incrementally updates the ReactFlow node/edge arrays:

```typescript
// In useTopologyData.ts
useEffect(() => {
  // On WebSocket "graph_updated" event:
  // 1. Fetch delta or full graph from API
  // 2. Merge new edges into existing ReactFlow state
  // 3. Re-layout only if new nodes were added
}, [wsMessage]);
```

ReactFlow's `setNodes`/`setEdges` handles incremental updates without full re-render.

### 4.6 Minimap

Use ReactFlow's built-in `<MiniMap>` component:

```tsx
<ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}>
  <MiniMap nodeColor={minimapNodeColor} />
  <Controls />
  <Background />
</ReactFlow>
```

---

## 5. WebSocket Room Architecture

### 5.1 Room Naming Convention

| Room Pattern | Scope | Use Case |
|-------------|-------|----------|
| `workspace:{workspace_id}` | All events in workspace | Dashboard, overview |
| `agent:{agent_id}` | Single agent events | Agent detail page |
| `session:{session_id}` | Single session events | Session viewer / replay |

### 5.2 Client Protocol

Messages from client to server:

```json
{"action": "subscribe", "room": "workspace:abc-123"}
{"action": "subscribe", "room": "agent:def-456"}
{"action": "unsubscribe", "room": "agent:def-456"}
{"action": "sync", "room": "workspace:abc-123"}
```

The `sync` action requests a full state snapshot for the room (used after reconnection).

Messages from server to client:

```json
{
  "room": "agent:def-456",
  "event_type": "state_change",
  "agent_id": "def-456",
  "data": { "status": "active", "task_id": "task-789" },
  "timestamp": "2026-03-27T14:30:00Z",
  "sequence": 42
}
```

Every server message includes a `sequence` number (monotonically increasing per room). The client tracks the last received sequence. On reconnect, the `sync` action returns all events since the client's last sequence.

### 5.3 Server-Side Implementation

Refactor `WebSocketManager` to support rooms:

```python
# File: src/backend/app/services/websocket_manager.py (rewrite)

import json
import asyncio
from collections import defaultdict
from fastapi import WebSocket
import redis.asyncio as aioredis
import orjson

class RoomWebSocketManager:
    """Manages WebSocket connections with room-based subscriptions."""

    def __init__(self):
        # room_name -> set of WebSocket connections
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)
        # ws -> set of room names (for cleanup on disconnect)
        self._ws_rooms: dict[WebSocket, set[str]] = defaultdict(set)
        # room -> sequence counter
        self._sequences: dict[str, int] = defaultdict(int)

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()

    def subscribe(self, ws: WebSocket, room: str) -> None:
        self._rooms[room].add(ws)
        self._ws_rooms[ws].add(room)

    def unsubscribe(self, ws: WebSocket, room: str) -> None:
        self._rooms[room].discard(ws)
        self._ws_rooms[ws].discard(room)

    def disconnect(self, ws: WebSocket) -> None:
        for room in self._ws_rooms.pop(ws, set()):
            self._rooms[room].discard(ws)

    async def publish_to_room(self, room: str, message: dict) -> None:
        """Send a message to all connections subscribed to a room."""
        self._sequences[room] += 1
        message["room"] = room
        message["sequence"] = self._sequences[room]
        data = orjson.dumps(message).decode()
        dead: set[WebSocket] = set()
        for ws in list(self._rooms.get(room, set())):
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(ws)

    async def start_redis_listener(self, redis_conn: aioredis.Redis) -> None:
        """Listen to Redis Pub/Sub for room channels and fan out."""
        pubsub = redis_conn.pubsub()
        await pubsub.psubscribe("ws:*")
        async for msg in pubsub.listen():
            if msg["type"] == "pmessage":
                channel: str = msg["channel"]
                if isinstance(channel, bytes):
                    channel = channel.decode()
                # Channel format: ws:workspace:{id} or ws:agent:{id}
                room = channel[3:]  # strip "ws:" prefix
                try:
                    payload = orjson.loads(msg["data"])
                except Exception:
                    continue
                await self.publish_to_room(room, payload)


manager = RoomWebSocketManager()
```

### 5.4 Redis Pub/Sub Channel Mapping

When an event is ingested (via `POST /api/events` or `POST /api/events/batch`), the event pipeline publishes to multiple Redis channels:

```python
# In EventPipeline.publish():
async def publish(self, event: dict) -> None:
    workspace_id = event["workspace_id"]
    agent_id = event.get("agent_id")
    session_id = event.get("session_id")
    data = orjson.dumps(event)

    # Always publish to workspace room
    await self.redis.publish(f"ws:workspace:{workspace_id}", data)

    # Publish to agent room if agent_id present
    if agent_id:
        await self.redis.publish(f"ws:agent:{agent_id}", data)

    # Publish to session room if session_id present
    if session_id:
        await self.redis.publish(f"ws:session:{session_id}", data)
```

### 5.5 WebSocket Router Update

```python
# File: src/backend/app/routers/websocket.py (updated)

@router.websocket("/ws/live")
async def ws_live(
    websocket: WebSocket,
    workspace_id: str = Query(...),
    token: str = Query(...),
):
    # ... existing auth logic ...

    await manager.connect(websocket)
    # Auto-subscribe to workspace room
    manager.subscribe(websocket, f"workspace:{workspace_id}")
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = orjson.loads(raw)
            except Exception:
                continue

            action = msg.get("action")
            room = msg.get("room", "")

            # Security: validate room access
            if not validate_room_access(room, workspace_id, user_id):
                await websocket.send_text(
                    orjson.dumps({"error": "unauthorized_room"}).decode()
                )
                continue

            if action == "subscribe":
                manager.subscribe(websocket, room)
            elif action == "unsubscribe":
                manager.unsubscribe(websocket, room)
            elif action == "sync":
                # Fetch current state for the room and send snapshot
                snapshot = await build_room_snapshot(room, db)
                await websocket.send_text(
                    orjson.dumps({"action": "sync_response", "room": room, "data": snapshot}).decode()
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

### 5.6 Reconnection and Missed-Message Recovery

**Client side:**
1. On disconnect, start exponential backoff: 1s, 2s, 4s, 8s, max 30s
2. Show "Reconnecting..." banner in the UI
3. On reconnect, send `{"action": "sync", "room": "workspace:{id}"}` for each previously subscribed room
4. Server responds with current state snapshot
5. Client reconciles snapshot with local Zustand store

**Server side:**
The `sync` action builds a snapshot by querying the database:
- For `workspace:{id}`: all agents with current status, top leaderboard entries
- For `agent:{id}`: agent detail, last 20 events
- For `session:{id}`: session detail, event count

### 5.7 Client-Side WebSocket Hook Refactor

```typescript
// File: src/frontend/src/hooks/useWebSocket.ts (rewrite sketch)

export function useWebSocket(workspaceId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedRooms = useRef<Set<string>>(new Set());
  const backoffRef = useRef(1000);
  const maxBackoff = 30000;

  // ... connection logic with exponential backoff ...

  function subscribe(room: string): void {
    subscribedRooms.current.add(room);
    wsRef.current?.send(JSON.stringify({ action: 'subscribe', room }));
  }

  function unsubscribe(room: string): void {
    subscribedRooms.current.delete(room);
    wsRef.current?.send(JSON.stringify({ action: 'unsubscribe', room }));
  }

  // On reconnect: re-subscribe to all rooms, then sync
  function onReconnect(): void {
    backoffRef.current = 1000; // reset backoff
    for (const room of subscribedRooms.current) {
      wsRef.current?.send(JSON.stringify({ action: 'subscribe', room }));
      wsRef.current?.send(JSON.stringify({ action: 'sync', room }));
    }
  }

  return { subscribe, unsubscribe };
}
```

### 5.8 Event Batching on the Client

To prevent frame-per-event rendering, the WebSocket dispatcher batches events using `requestAnimationFrame`:

```typescript
const pendingEvents: Record<string, unknown>[] = [];
let rafScheduled = false;

ws.onmessage = (e: MessageEvent) => {
  const event = JSON.parse(e.data);
  pendingEvents.push(event);
  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(() => {
      const batch = pendingEvents.splice(0);
      processBatch(batch);
      rafScheduled = false;
    });
  }
};
```

---

## 6. Event Replay System

### 6.1 Storage

Events are already in the TimescaleDB `events` hypertable partitioned by `timestamp`. The hypertable index on `(workspace_id, timestamp)` supports efficient time-range queries.

For replay, we need an additional index:

```sql
CREATE INDEX ix_events_agent_ts ON events (agent_id, timestamp);
CREATE INDEX ix_events_session_ts ON events (session_id, timestamp);
```

### 6.2 Replay API Endpoint

```
GET /api/events/replay
  ?agent_id=<uuid>           (optional)
  &session_id=<uuid>         (optional)
  &start=<ISO8601>           (optional, default: session start or 24h ago)
  &end=<ISO8601>             (optional, default: now)
  &cursor=<event_id>         (optional, for pagination)
  &limit=100                 (optional, default 100, max 500)
```

**Response:**

```json
{
  "events": [
    {
      "id": "evt-001",
      "agent_id": "agent-123",
      "event_type": "state_change",
      "event_data": { "status": "active" },
      "timestamp": "2026-03-27T14:30:00.123Z",
      "sequence_number": 1
    }
  ],
  "next_cursor": "evt-100",
  "has_more": true,
  "total_count": 5430
}
```

### 6.3 Backend Implementation

```python
# File: src/backend/app/routers/events.py (new endpoint)

@router.get("/replay")
async def replay_events(
    agent_id: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    cursor: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Event)
        .where(Event.workspace_id == workspace_id)
        .order_by(Event.timestamp.asc())
        .limit(limit + 1)  # fetch one extra to determine has_more
    )
    if agent_id:
        query = query.where(Event.agent_id == agent_id)
    if session_id:
        query = query.where(Event.session_id == session_id)
    if start:
        query = query.where(Event.timestamp >= start)
    if end:
        query = query.where(Event.timestamp <= end)
    if cursor:
        # Cursor-based pagination: fetch events after cursor event's timestamp
        cursor_event = await db.get(Event, cursor)
        if cursor_event:
            query = query.where(Event.timestamp > cursor_event.timestamp)

    result = await db.execute(query)
    events = result.scalars().all()

    has_more = len(events) > limit
    if has_more:
        events = events[:limit]

    return {
        "events": [
            {
                "id": e.id,
                "agent_id": e.agent_id,
                "session_id": e.session_id,
                "event_type": e.event_type,
                "event_data": e.extra_data,
                "timestamp": e.timestamp.isoformat(),
                "sequence_number": idx + 1,
            }
            for idx, e in enumerate(events)
        ],
        "next_cursor": events[-1].id if has_more else None,
        "has_more": has_more,
    }
```

### 6.4 Client-Side Replay Controller

```typescript
// File: src/frontend/src/hooks/useSessionReplay.ts (rewrite)

export function useSessionReplay(sessionId: string) {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [cursor, setCursor] = useState(0);
  const [speed, setSpeed] = useState(1.0); // 0.5, 1, 2, 5, 10
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number>();

  // Fetch all events for the session (paginated)
  useEffect(() => {
    fetchAllEvents(sessionId).then(setEvents);
  }, [sessionId]);

  // Playback loop
  useEffect(() => {
    if (!playing || cursor >= events.length) return;

    const currentEvent = events[cursor];
    const nextEvent = events[cursor + 1];
    if (!nextEvent) {
      setPlaying(false);
      return;
    }

    const realDelay = new Date(nextEvent.timestamp).getTime()
                    - new Date(currentEvent.timestamp).getTime();
    const scaledDelay = Math.max(realDelay / speed, 16); // min 16ms

    timerRef.current = window.setTimeout(() => {
      setCursor(c => c + 1);
    }, scaledDelay);

    return () => clearTimeout(timerRef.current);
  }, [playing, cursor, speed, events]);

  // Dispatch current event to MachineManager
  useEffect(() => {
    if (events[cursor]) {
      dispatchReplayEvent(events[cursor]);
    }
  }, [cursor]);

  return { events, cursor, speed, playing, setPlaying, setSpeed, setCursor };
}
```

### 6.5 Playback Controls

- Play/Pause toggle
- Speed selector: 0.5x, 1x, 2x, 5x, 10x
- Timeline scrubber: draggable slider mapped to event index (0 to events.length - 1)
- Seek: clicking the scrubber sets `cursor` directly

---

## 7. Agent Relationship Graph

### 7.1 Graph Model

Nodes = agents. Edges = relationships with type and weight.

```python
# File: src/backend/app/schemas/graph.py

from pydantic import BaseModel
from typing import Literal

class GraphNode(BaseModel):
    id: str
    name: str
    status: str
    level: int
    xp_total: int

class GraphEdge(BaseModel):
    source: str
    target: str
    edge_type: Literal["delegates_to", "shared_session", "data_flow", "monitors"]
    weight: int  # count of interactions
    first_seen: str  # ISO 8601
    last_seen: str  # ISO 8601

class AgentGraph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
```

### 7.2 Edge Detection Logic

The Celery task scans events to build edges:

| Edge Type | Detection Rule |
|-----------|---------------|
| `delegates_to` | Agent A creates a task, agent B executes it (same `task_id` in events with different `agent_id`s; A has `task_created`, B has `task_started`) |
| `shared_session` | Agents A and B both have events with the same `session_id` |
| `data_flow` | Agent B's event references Agent A's span via `parent_span_id` lineage (join spans table on trace_id) |
| `monitors` | Agent A has events of type `agent.health_check` targeting Agent B (detected via `event_data.target_agent_id`) |

### 7.3 Celery Task

```python
# File: src/backend/app/tasks/graph.py

from app.core.celery_app import celery_app
from app.core.database import SyncSessionLocal
from app.core.redis_client import get_sync_redis
from app.models.event import Event
from app.models.agent import Agent
from sqlalchemy import select, and_, func
from collections import defaultdict
import orjson

@celery_app.task(name="app.tasks.compute_agent_graph")
def compute_agent_graph(workspace_id: str) -> None:
    """Compute agent relationship graph and cache in Redis."""
    redis = get_sync_redis()
    cache_key = f"graph:{workspace_id}"

    with SyncSessionLocal() as db:
        # 1. Fetch all agents for workspace
        agents = db.execute(
            select(Agent).where(Agent.workspace_id == workspace_id)
        ).scalars().all()

        nodes = [
            {"id": a.id, "name": a.name, "status": a.status,
             "level": a.level, "xp_total": a.xp_total}
            for a in agents
        ]

        edges = []

        # 2. Shared sessions
        # Find session_ids with multiple distinct agent_ids
        session_pairs = db.execute(
            select(Event.session_id, Event.agent_id)
            .where(
                Event.workspace_id == workspace_id,
                Event.session_id.isnot(None),
                Event.agent_id.isnot(None),
            )
            .distinct()
        ).all()

        session_agents: dict[str, set[str]] = defaultdict(set)
        for session_id, agent_id in session_pairs:
            session_agents[session_id].add(agent_id)

        shared_counts: dict[tuple[str, str], int] = defaultdict(int)
        for session_id, agent_ids in session_agents.items():
            agent_list = sorted(agent_ids)
            for i in range(len(agent_list)):
                for j in range(i + 1, len(agent_list)):
                    shared_counts[(agent_list[i], agent_list[j])] += 1

        for (a, b), count in shared_counts.items():
            edges.append({
                "source": a, "target": b,
                "edge_type": "shared_session",
                "weight": count,
            })

        # 3. Delegation (task_created -> task_started with different agents)
        # ... similar event JOIN logic ...

        # 4. Data flow via span lineage
        # ... similar span JOIN logic ...

    graph = {"nodes": nodes, "edges": edges}
    redis.setex(cache_key, 300, orjson.dumps(graph))  # 5 min TTL
```

The task is triggered:
- On app startup (once per workspace)
- Every 30 seconds via Celery beat
- On demand when new delegation/session events arrive (via event pipeline hook)

### 7.4 API Endpoint

```
GET /api/agents/graph
  ?workspace_id=<uuid>  (from auth)

Response: { nodes: [...], edges: [...] }
```

Implementation: read from Redis cache. If cache miss, return 202 and trigger the Celery task.

### 7.5 Redis Storage

- Key: `graph:{workspace_id}`
- Value: JSON blob (orjson-serialized `AgentGraph`)
- TTL: 300 seconds (5 minutes)
- Size estimate: 50 agents + 100 edges = ~15KB

---

## 8. Gamification Achievement System

### 8.1 Achievement Model

```python
# File: src/backend/app/models/achievement.py

from sqlalchemy import String, Integer, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid
from app.core.database import Base
from app.core.utils import utcnow

class Achievement(Base):
    __tablename__ = "achievements"
    __table_args__ = (
        UniqueConstraint("workspace_id", "agent_id", "achievement_id",
                         name="uq_achievement_per_agent"),
        Index("ix_achievements_workspace_agent", "workspace_id", "agent_id"),
    )
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    achievement_id: Mapped[str] = mapped_column(String(20), nullable=False)  # "ACH-001"
    achievement_name: Mapped[str] = mapped_column(String(100), nullable=False)
    xp_bonus: Mapped[int] = mapped_column(Integer, nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(default=utcnow)
```

### 8.2 Achievement Definitions (Static Config)

```python
# File: src/backend/app/services/achievement_definitions.py

from dataclasses import dataclass
from typing import Optional

@dataclass
class AchievementDef:
    id: str
    name: str
    description: str
    condition_summary: str
    xp_bonus: int
    icon: str

ACHIEVEMENT_DEFS: dict[str, AchievementDef] = {
    "ACH-001": AchievementDef(
        id="ACH-001", name="First Steps",
        description="Agent completes first task",
        condition_summary="task_count >= 1",
        xp_bonus=50, icon="footprint",
    ),
    "ACH-002": AchievementDef(
        id="ACH-002", name="Centurion",
        description="Agent completes 100 tasks",
        condition_summary="task_count >= 100",
        xp_bonus=500, icon="shield",
    ),
    "ACH-003": AchievementDef(
        id="ACH-003", name="Speed Demon",
        description="Agent completes 10 tasks with < 1s latency",
        condition_summary="fast_task_count >= 10",
        xp_bonus=300, icon="lightning",
    ),
    "ACH-004": AchievementDef(
        id="ACH-004", name="Penny Pincher",
        description="Agent completes 50 tasks under median cost",
        condition_summary="cheap_task_count >= 50",
        xp_bonus=400, icon="coin",
    ),
    "ACH-005": AchievementDef(
        id="ACH-005", name="Iron Will",
        description="Agent recovers from error 10 times",
        condition_summary="error_recovery_count >= 10",
        xp_bonus=350, icon="anvil",
    ),
    "ACH-006": AchievementDef(
        id="ACH-006", name="Marathon Runner",
        description="Agent has 24+ hours of total session time",
        condition_summary="total_session_hours >= 24",
        xp_bonus=500, icon="clock",
    ),
    "ACH-007": AchievementDef(
        id="ACH-007", name="Team Player",
        description="Agent appears in 5+ relationship edges",
        condition_summary="relationship_edge_count >= 5",
        xp_bonus=250, icon="handshake",
    ),
    "ACH-008": AchievementDef(
        id="ACH-008", name="Perfect Streak",
        description="Agent completes 10 consecutive tasks without error",
        condition_summary="max_streak >= 10",
        xp_bonus=600, icon="star",
    ),
    "ACH-009": AchievementDef(
        id="ACH-009", name="Night Owl",
        description="Agent completes 50 tasks between 22:00-06:00 UTC",
        condition_summary="night_task_count >= 50",
        xp_bonus=200, icon="moon",
    ),
    "ACH-010": AchievementDef(
        id="ACH-010", name="Trailblazer",
        description="First agent in workspace to reach Level 5",
        condition_summary="first_to_level_5",
        xp_bonus=1000, icon="flag",
    ),
}
```

### 8.3 Achievement Evaluator (Celery Task)

```python
# File: src/backend/app/tasks/achievements.py

from app.core.celery_app import celery_app
from app.core.database import SyncSessionLocal
from app.models.achievement import Achievement
from app.models.agent import Agent
from app.models.event import Event
from app.services.achievement_definitions import ACHIEVEMENT_DEFS
from sqlalchemy import select, func, and_
import orjson

@celery_app.task(name="app.tasks.evaluate_achievements")
def evaluate_achievements(workspace_id: str, agent_id: str) -> list[str]:
    """Evaluate all achievement conditions for a single agent.
    Returns list of newly awarded achievement IDs.
    """
    awarded: list[str] = []

    with SyncSessionLocal() as db:
        # Fetch already-earned achievements
        existing = set(
            db.execute(
                select(Achievement.achievement_id)
                .where(Achievement.workspace_id == workspace_id,
                       Achievement.agent_id == agent_id)
            ).scalars().all()
        )

        agent = db.get(Agent, agent_id)
        if not agent:
            return []

        # Compute stats for this agent
        stats = _compute_agent_stats(db, workspace_id, agent_id)

        for ach_id, defn in ACHIEVEMENT_DEFS.items():
            if ach_id in existing:
                continue
            if _check_condition(ach_id, stats, db, workspace_id, agent):
                # Award the achievement
                achievement = Achievement(
                    workspace_id=workspace_id,
                    agent_id=agent_id,
                    achievement_id=ach_id,
                    achievement_name=defn.name,
                    xp_bonus=defn.xp_bonus,
                )
                db.add(achievement)
                awarded.append(ach_id)

                # Award XP bonus (inline, same transaction)
                agent.xp_total += defn.xp_bonus

        if awarded:
            db.commit()

            # Publish WebSocket events for each achievement
            redis = get_sync_redis()
            for ach_id in awarded:
                defn = ACHIEVEMENT_DEFS[ach_id]
                event = {
                    "event_type": "achievement_unlocked",
                    "agent_id": agent_id,
                    "achievement_id": ach_id,
                    "achievement_name": defn.name,
                    "xp_bonus": defn.xp_bonus,
                    "icon": defn.icon,
                }
                redis.publish(f"ws:workspace:{workspace_id}", orjson.dumps(event))
                redis.publish(f"ws:agent:{agent_id}", orjson.dumps(event))

    return awarded


def _compute_agent_stats(db, workspace_id: str, agent_id: str) -> dict:
    """Compute aggregate stats needed for achievement evaluation."""
    task_count = db.scalar(
        select(func.count(Event.id))
        .where(Event.workspace_id == workspace_id,
               Event.agent_id == agent_id,
               Event.event_type == "task_completed")
    ) or 0

    error_recovery_count = db.scalar(
        select(func.count(Event.id))
        .where(Event.workspace_id == workspace_id,
               Event.agent_id == agent_id,
               Event.event_type == "error_recovered")
    ) or 0

    # ... more stats as needed ...

    return {
        "task_count": task_count,
        "error_recovery_count": error_recovery_count,
        # fast_task_count, cheap_task_count, night_task_count,
        # total_session_hours, max_streak, relationship_edge_count
    }


def _check_condition(ach_id: str, stats: dict, db, workspace_id: str, agent) -> bool:
    """Check if the achievement condition is met."""
    match ach_id:
        case "ACH-001": return stats["task_count"] >= 1
        case "ACH-002": return stats["task_count"] >= 100
        case "ACH-003": return stats.get("fast_task_count", 0) >= 10
        case "ACH-004": return stats.get("cheap_task_count", 0) >= 50
        case "ACH-005": return stats["error_recovery_count"] >= 10
        case "ACH-006": return stats.get("total_session_hours", 0) >= 24
        case "ACH-007": return stats.get("relationship_edge_count", 0) >= 5
        case "ACH-008": return stats.get("max_streak", 0) >= 10
        case "ACH-009": return stats.get("night_task_count", 0) >= 50
        case "ACH-010":
            # First agent in workspace to reach level 5
            if agent.level < 5:
                return False
            first_level5 = db.scalar(
                select(Achievement.id)
                .where(Achievement.workspace_id == workspace_id,
                       Achievement.achievement_id == "ACH-010")
            )
            return first_level5 is None
        case _: return False
```

### 8.4 Trigger Points

The achievement evaluator is called:
1. After XP is awarded (in the gamification router/service)
2. After a task completes (in the event pipeline)
3. After error recovery (in the event pipeline)
4. Periodically via Celery beat (every 5 minutes, for time-based achievements like ACH-006)

```python
# In event pipeline, after processing a task_completed event:
from app.tasks.achievements import evaluate_achievements
evaluate_achievements.delay(workspace_id, agent_id)
```

### 8.5 API Endpoints

```
GET /api/gamification/achievements/{agent_id}
  Response: [{ achievement_id, name, xp_bonus, icon, unlocked_at }]

GET /api/gamification/achievements/definitions
  Response: [{ id, name, description, condition_summary, xp_bonus, icon }]
```

---

## 9. Continuous Aggregates

### 9.1 TimescaleDB Continuous Aggregates

Replace the manual `metrics_agg` table with two continuous aggregates:

```sql
-- Alembic migration: raw SQL in upgrade()

-- Hourly aggregate
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS hour,
    workspace_id,
    agent_id,
    SUM(total_tokens)::BIGINT AS total_tokens,
    SUM(cost_usd) AS total_cost_usd,
    COUNT(*)::INTEGER AS request_count,
    AVG(latency_ms) AS avg_latency_ms,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM metrics_raw
GROUP BY hour, workspace_id, agent_id
WITH NO DATA;

-- Refresh policy: refresh every 15 minutes, covering the last 2 hours
SELECT add_continuous_aggregate_policy('metrics_hourly',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '30 minutes',
    schedule_interval => INTERVAL '15 minutes');

-- Daily aggregate
CREATE MATERIALIZED VIEW metrics_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    workspace_id,
    agent_id,
    SUM(total_tokens)::BIGINT AS total_tokens,
    SUM(cost_usd) AS total_cost_usd,
    COUNT(*)::INTEGER AS request_count,
    AVG(latency_ms) AS avg_latency_ms,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM metrics_raw
GROUP BY day, workspace_id, agent_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('metrics_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### 9.2 Leaderboard Materialized View

```sql
-- Materialized view for agent leaderboard scoring
CREATE MATERIALIZED VIEW agent_leaderboard AS
SELECT
    a.workspace_id,
    a.id AS agent_id,
    a.name,
    a.level,
    a.xp_total,
    COALESCE(task_stats.task_count, 0) AS task_count,
    COALESCE(task_stats.avg_cost, 0) AS avg_cost_per_task,
    COALESCE(ach_stats.achievement_count, 0) AS achievement_count,
    RANK() OVER (
        PARTITION BY a.workspace_id
        ORDER BY a.xp_total DESC
    ) AS rank_xp
FROM agents a
LEFT JOIN (
    SELECT agent_id, COUNT(*) AS task_count, AVG(cost_usd) AS avg_cost
    FROM metrics_raw
    WHERE metric_type = 'llm_call'
    GROUP BY agent_id
) task_stats ON task_stats.agent_id = a.id
LEFT JOIN (
    SELECT agent_id, COUNT(*) AS achievement_count
    FROM achievements
    GROUP BY agent_id
) ach_stats ON ach_stats.agent_id = a.id;

-- Refresh via Celery task every 5 minutes
-- (Cannot use continuous aggregate policy on regular tables, so use REFRESH MATERIALIZED VIEW CONCURRENTLY)
```

### 9.3 Updated Metrics API

The existing `GET /api/metrics/aggregated` endpoint is updated to query from continuous aggregates:

```python
@router.get("/aggregated")
async def get_aggregated_metrics(
    period: str = Query("7d"),  # 24h, 7d, 30d
    granularity: str = Query("hourly"),  # hourly, daily
    agent_id: Optional[str] = Query(None),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    view = "metrics_hourly" if granularity == "hourly" else "metrics_daily"
    time_col = "hour" if granularity == "hourly" else "day"

    # Use raw SQL to query the continuous aggregate view
    sql = f"""
        SELECT {time_col}, agent_id, total_tokens, total_cost_usd,
               request_count, avg_latency_ms, p95_latency_ms
        FROM {view}
        WHERE workspace_id = :workspace_id
          AND {time_col} >= NOW() - :interval::INTERVAL
    """
    params = {"workspace_id": workspace_id, "interval": period_to_interval(period)}
    if agent_id:
        sql += " AND agent_id = :agent_id"
        params["agent_id"] = agent_id
    sql += f" ORDER BY {time_col} ASC"

    result = await db.execute(text(sql), params)
    rows = result.mappings().all()
    return {"data": [dict(r) for r in rows]}
```

### 9.4 Leaderboard Enhancement

The `GET /api/gamification/leaderboard` endpoint adds time-scoping and category support:

```
GET /api/gamification/leaderboard
  ?period=daily|weekly|monthly|all_time  (default: all_time)
  &category=xp|tasks|cost_efficiency|streaks  (default: xp)
  &limit=50

Response: {
  "agents": [
    {
      "rank": 1,
      "agent_id": "...",
      "name": "...",
      "level": 7,
      "xp_total": 25000,
      "achievement_count": 5,
      "trend": "up"  // "up" | "down" | "same"
    }
  ]
}
```

For time-scoped leaderboards, query `xp_transactions` filtered by `created_at` within the period, then SUM and RANK.

---

## 10. Performance Budget

### 10.1 Canvas Performance

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Frame rate | >= 60fps with 50 agents | `app.ticker.FPS` logged every 5s |
| Frame time | < 16.67ms | `app.ticker.deltaMS` |
| Agent sprite count | <= 200 (soft limit) | `agentLayer.children.length` |
| GPU memory | < 128MB texture memory | PixiJS texture manager stats |
| JS heap | < 100MB for canvas module | `performance.memory` (Chrome) |
| Sprite pool size | <= 200 pre-allocated | `SpritePool.pool.length` |
| GSAP concurrent tweens | <= 100 | `gsap.globalTimeline.getChildren().length` |

### 10.2 WebSocket Performance

| Metric | Budget |
|--------|--------|
| Event delivery latency | < 2s from ingestion to canvas render |
| Room routing time | < 50ms per event |
| Concurrent connections | >= 100 stable |
| Message size | < 4KB per event |
| Batch window | 16ms (one animation frame) |
| Reconnection time | < 30s with exponential backoff |
| Missed-message recovery | Full state sync on reconnect |

### 10.3 API Response Times

| Endpoint Category | Target |
|------------------|--------|
| Single resource GET | < 200ms |
| List endpoints | < 500ms |
| Replay endpoint (100 events) | < 500ms |
| Graph endpoint (cache hit) | < 200ms |
| Graph endpoint (cache miss) | < 3s (returns 202, computes async) |
| Metrics aggregated (30d hourly) | < 500ms (continuous aggregate) |
| Leaderboard | < 300ms |

### 10.4 Page Load

| Page | Budget |
|------|--------|
| Dashboard | < 3s initial load |
| Agent detail | < 2s |
| Leaderboard | < 2s |
| Analytics | < 3s |
| Topology | < 3s (including layout computation) |

---

## 11. New API Endpoints

### 11.1 Event Replay

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/events/replay` | Query: `agent_id?`, `session_id?`, `start?`, `end?`, `cursor?`, `limit?` | `{ events: [...], next_cursor, has_more }` |

### 11.2 Agent Relationship Graph

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/agents/graph` | Auth (workspace from JWT) | `{ nodes: [GraphNode], edges: [GraphEdge] }` |

### 11.3 Achievement Endpoints

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/gamification/achievements/{agent_id}` | Path: agent_id | `[{ achievement_id, name, xp_bonus, icon, unlocked_at }]` |
| GET | `/api/gamification/achievements/definitions` | None | `[{ id, name, description, condition_summary, xp_bonus, icon }]` |

### 11.4 Enhanced Leaderboard

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/gamification/leaderboard` | Query: `period?`, `category?`, `limit?` | `{ agents: [{ rank, agent_id, name, level, xp_total, achievement_count, trend }] }` |

### 11.5 Enhanced Metrics

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/metrics/aggregated` | Query: `period`, `granularity`, `agent_id?` | `{ data: [{ hour/day, agent_id, total_tokens, total_cost_usd, request_count, avg_latency_ms, p95_latency_ms }] }` |

### 11.6 Room State Sync

Not a REST endpoint -- handled via WebSocket `sync` action (see Section 5.6).

---

## 12. New Database Migrations

### 12.1 New Tables

**`achievements` table:**

```sql
CREATE TABLE achievements (
    id VARCHAR PRIMARY KEY,
    workspace_id VARCHAR NOT NULL,
    agent_id VARCHAR NOT NULL,
    achievement_id VARCHAR(20) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    xp_bonus INTEGER NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_achievement_per_agent UNIQUE (workspace_id, agent_id, achievement_id)
);
CREATE INDEX ix_achievements_workspace_agent ON achievements (workspace_id, agent_id);
```

### 12.2 New Indexes

```sql
-- Event replay performance
CREATE INDEX ix_events_agent_ts ON events (agent_id, timestamp);
CREATE INDEX ix_events_session_ts ON events (session_id, timestamp);
```

### 12.3 Continuous Aggregates

```sql
-- metrics_hourly (see Section 9.1)
-- metrics_daily (see Section 9.1)
-- agent_leaderboard materialized view (see Section 9.2)
```

### 12.4 Schema Changes to Existing Tables

**`agents` table -- new columns:**

```sql
-- No new columns needed. level, xp_total, total_tokens, total_cost_usd already exist.
-- The status column already supports the states we need.
```

**`events` table -- add sequence column for replay ordering:**

```sql
-- Not needed: replay uses timestamp ordering via the existing hypertable index.
-- The sequence_number in the replay response is computed at query time (ROW_NUMBER).
```

### 12.5 Alembic Migration Files

Create two migration files:

1. `alembic/versions/sprint2_001_achievements.py` -- creates `achievements` table and new indexes
2. `alembic/versions/sprint2_002_continuous_aggregates.py` -- creates continuous aggregates and materialized views (raw SQL via `op.execute()`)

### 12.6 Gamification Service Update

The existing `GamificationService` has a 5-level system with different XP thresholds. Sprint 2 PRD specifies a 10-level system with a power curve formula: `required_xp(level) = round(500 * (level - 1) ^ 1.8)`.

**Backend Expert must update:**
- `src/backend/app/services/gamification_service.py`: change `XP_THRESHOLDS` to match PRD Section 3.2 (10 levels)
- `src/frontend/src/lib/xpLevels.ts`: update to match

New thresholds:

| Level | Cumulative XP |
|-------|---------------|
| 1 | 0 |
| 2 | 500 |
| 3 | 1,500 |
| 4 | 3,500 |
| 5 | 7,000 |
| 6 | 12,000 |
| 7 | 20,000 |
| 8 | 35,000 |
| 9 | 60,000 |
| 10 | 100,000 |

---

## 13. Open Questions Resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | Should Rive .riv assets be created in Sprint 2? | **Deferred.** GSAP-only animations are the primary path. RiveManager exists as a fallback-aware wrapper. If .riv assets appear later, they slot in without code changes. |
| 2 | Should topology graph use WebSocket or polling? | **WebSocket.** Consistent with the rest of the platform. The topology subscribes to the `workspace:{id}` room and listens for `graph_updated` events. |
| 3 | Should achievements be workspace-scoped or global? | **Workspace-scoped.** The `achievements` table has `workspace_id`. The `uq_achievement_per_agent` constraint scopes to (workspace, agent, achievement). |
| 4 | Should session replay drive the PixiJS canvas? | **Separate timeline view with optional canvas sync.** The ReplayPage has a timeline component. If the user has the WorldCanvas open in a split view, replay events are dispatched to the MachineManager. |
| 5 | Maximum agents per workspace? | **200 (soft limit).** Enforced in `POST /api/agents` with a configurable `MAX_AGENTS_PER_WORKSPACE=200` env var. The canvas SpritePool has capacity for 200. |

---

## 14. Implementation Sequencing

### Backend Expert (BE) -- Recommended Order

1. **OAV-221** WebSocket room support -- refactor `WebSocketManager`, update router (blocks OAV-206)
2. **OAV-225** Continuous aggregates -- Alembic migration with raw SQL (unblocks OAV-214)
3. **OAV-224** Achievement system -- model, definitions, evaluator task, API endpoints
4. **OAV-222** Event replay -- new endpoint on events router, new indexes
5. **OAV-223** Relationship graph -- Celery task, Redis cache, API endpoint
6. Update gamification service -- 10-level system, XP triggers per PRD Section 3.1
7. Enhanced leaderboard -- time-scoped, category-based, trend calculation

### Frontend Expert (FE) -- Recommended Order

1. **OAV-201** PixiJS canvas -- refactor WorldRenderer, SpritePool, CameraController, AgentSprite extensions
2. **OAV-202** XState FSM -- rewrite agentMachine, MachineManager, StateAnimator
3. **OAV-204** GSAP animations -- StateAnimator transitions, level-up, achievement effects
4. **OAV-206** Real-time canvas updates -- refactor useWebSocket with rooms and batching
5. **OAV-211** Main dashboard -- agent grid, metrics charts, mini-leaderboard
6. **OAV-212** Agent detail page -- stats, event timeline, state diagram, achievements
7. **OAV-213** Leaderboard page -- ranked list, time/category filters, virtual scrolling
8. **OAV-203** ReactFlow topology -- custom nodes/edges, dagre layout, WebSocket updates
9. **OAV-214** Analytics dashboard -- Recharts charts, time range selector
10. **OAV-215** Alert management page
11. **OAV-216** Session viewer -- timeline, replay controls
12. **OAV-217** Settings page
13. **OAV-205** Rive animations (if assets available)

### Parallel Tracks

- BE and FE can start immediately after this handoff
- BE OAV-221 (WebSocket rooms) should be completed before FE starts OAV-206 (real-time canvas)
- BE OAV-223 (relationship graph) should be completed before FE starts OAV-203 (topology)
- BE OAV-224 (achievements) can run in parallel with FE OAV-201-204 (canvas work)
- Testing tasks (OAV-231 through OAV-235) follow their corresponding feature implementations

---

*Document produced by Tech Lead (Stage 2.1) for handoff to Frontend Expert (Stage 2.2a) and Backend Expert (Stage 2.2b).*
