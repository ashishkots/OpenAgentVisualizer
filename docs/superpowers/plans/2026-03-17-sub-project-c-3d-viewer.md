# Sub-project C: 3D/UE5 Viewer — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Virtual World page from flat PixiJS to a proper 2.5D Three.js isometric renderer (all tiers) and add UE5 Pixel Streaming embed (Pro/Enterprise), with clean WebGL context lifecycle management and a 3-mode toggle (2D → 2.5D → 3D).

**Architecture:** `VirtualWorldPage` owns the 3-way mode state and mounts/unmounts (never just hides) each renderer to prevent WebGL context leaks. Three.js `ThreeCanvas` uses an `OrthographicCamera` at 45°, subscribes to `agentStore` via an `isoToThree` coordinate adapter, and fires particle events via `ThreeParticles`. UE5 mode renders a `PixelStreamingEmbed` WebRTC iframe. A companion signalling server runs as an optional Docker service.

**Tech Stack:** Three.js r170+, React 18, TypeScript, Zustand (`agentStore`), `@pixiv/three-vrm` (not needed — standard Three.js only), CSS2DRenderer for agent labels, `@react-three/fiber` is NOT used (raw Three.js to match existing PixiJS pattern), vitest + `@testing-library/react`, Docker Compose for signalling server

---

## File Structure

**New files:**

```
src/frontend/src/
├── canvas/
│   └── three/
│       ├── ThreeCanvas.tsx            React wrapper — mount/unmount + stores cleanup ref
│       ├── ThreeRenderer.ts           Scene init, render loop, camera, CSS2DRenderer
│       ├── AgentDesk.ts               Per-agent desk mesh (instanced), PointLight, CSS2D label
│       ├── OfficeFloor.ts             Floor grid geometry + zone separator LineSegments
│       ├── ThreeMiniMap.ts            Top-down orthographic thumbnail camera
│       ├── ThreeParticles.ts          Points-based particle events (level-up, XP, error, handoff)
│       └── __tests__/
│           ├── ThreeRenderer.test.ts
│           ├── ThreeParticles.test.ts
│           └── isoToThree.test.ts
└── components/canvas/
    ├── PixelStreamingEmbed.tsx        WebRTC wrapper, quality controls, fullscreen
    ├── PixelStreamingBridge.ts        Encodes agentStore state → UE5 data channel JSON
    └── __tests__/
        └── PixelStreamingEmbed.test.tsx

src/pixel-streaming/
├── signalling-server/
│   ├── server.js                      Epic's reference signalling server, OAV-configured
│   └── Dockerfile
└── docker-compose.override.yml       Adds signalling-server service (Pro/Enterprise only)
```

**Modified files:**

```
src/frontend/src/
├── canvas/WorldCanvas.tsx             Add mode-prop handling (2D only now, 2.5D delegates to ThreeCanvas)
├── pages/VirtualWorldPage.tsx         Add 3-way mode toggle, mount/unmount logic, tier gating
└── stores/agentStore.ts               Verify AgentPosition fields (x, y) exist — no change if already present
```

---

## Task 0: Install Three.js dependencies

**Files:** No new files — dependency installation only.

- [ ] **Step 1: Install Three.js and types**

```bash
cd OpenAgentVisualizer/src/frontend
npm install three@^0.170.0
npm install --save-dev @types/three@^0.170.0
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('./node_modules/three/build/three.cjs.js'); console.log('three ok')"
```
Expected: `three ok` — no import errors.

- [ ] **Step 3: Commit**

```bash
cd OpenAgentVisualizer
git add src/frontend/package.json
# Note: per CLAUDE.md Known Fixes, the repo uses `npm install` (not `npm ci`) because
# there is no lockfile in the repo. Do NOT commit package-lock.json.
git commit -m "chore(deps): add three.js r170 and @types/three"
```

---

## Task 1: `isoToThree` coordinate adapter + unit tests

**Files:**
- Modify: `OpenAgentVisualizer/src/frontend/src/canvas/three/ThreeRenderer.ts` (create file)
- Test: `OpenAgentVisualizer/src/frontend/src/canvas/three/__tests__/isoToThree.test.ts`

The `isoToThree` adapter is the critical bridge. Its correctness is tested first, standalone, before any Three.js scene code.

- [ ] **Step 1: Write failing tests**

```typescript
// src/frontend/src/canvas/three/__tests__/isoToThree.test.ts
import { describe, it, expect } from 'vitest';
import { isoToThree } from '../ThreeRenderer';

describe('isoToThree coordinate adapter', () => {
  it('origin (0,0) maps to Three.js (0, 0, 0)', () => {
    const { x, z } = isoToThree(0, 0);
    expect(x).toBe(0);
    expect(z).toBe(0);
  });

  it('iso (1,0) maps to threeX = 32, threeZ = 16', () => {
    const { x, z } = isoToThree(1, 0);
    expect(x).toBe(32);
    expect(z).toBe(16);
  });

  it('iso (0,1) maps to threeX = -32, threeZ = 16', () => {
    const { x, z } = isoToThree(0, 1);
    expect(x).toBe(-32);
    expect(z).toBe(16);
  });

  it('iso (2,2) maps correctly', () => {
    const { x, z } = isoToThree(2, 2);
    expect(x).toBe(0);    // (2-2)*32
    expect(z).toBe(64);   // (2+2)*16
  });

  it('iso (3,1) maps correctly', () => {
    const { x, z } = isoToThree(3, 1);
    expect(x).toBe(64);   // (3-1)*32
    expect(z).toBe(64);   // (3+1)*16
  });

  it('returns y=0 always (Three.js ground plane)', () => {
    const p = isoToThree(5, 3);
    expect(p.y).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/isoToThree.test.ts 2>&1 | head -20
```
Expected: `FAILED` with `Cannot find module '../ThreeRenderer'`

- [ ] **Step 3: Stub ThreeRenderer.ts with just the isoToThree export**

```typescript
// src/frontend/src/canvas/three/ThreeRenderer.ts
// Coordinate adapter — single source of truth for PixiJS grid → Three.js world coords.
// PixiJS uses 2:1 diamond grid: tile 64px wide × 32px tall.
// Three.js uses a 45° OrthographicCamera (true isometric).
// Formula: threeX = (isoX - isoY) * 32;  threeZ = (isoX + isoY) * 16;
export function isoToThree(isoX: number, isoY: number): { x: number; y: number; z: number } {
  return {
    x: (isoX - isoY) * 32,
    y: 0,
    z: (isoX + isoY) * 16,
  };
}

// ThreeRenderer class — implemented in Task 3 below
export class ThreeRenderer {
  constructor(_container: HTMLDivElement) {}
  init(): void {}
  syncAgents(_agents: import('../../stores/agentStore').AgentState[]): void {}
  dispose(): void {}
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/isoToThree.test.ts
```
Expected: 6 tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/canvas/three/ThreeRenderer.ts \
        src/frontend/src/canvas/three/__tests__/isoToThree.test.ts
git commit -m "feat(3d): add isoToThree coordinate adapter with full test coverage"
```

---

## Task 2: OfficeFloor and basic scene setup tests

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/canvas/three/OfficeFloor.ts`
- Test: `OpenAgentVisualizer/src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Three.js — not available in vitest jsdom environment
vi.mock('three', () => ({
  Scene: vi.fn(() => ({ add: vi.fn(), background: null })),
  OrthographicCamera: vi.fn(() => ({ position: { set: vi.fn() }, lookAt: vi.fn(), updateProjectionMatrix: vi.fn(), left: 0, right: 0, top: 0, bottom: 0 })),
  WebGLRenderer: vi.fn(() => ({ setSize: vi.fn(), setPixelRatio: vi.fn(), render: vi.fn(), dispose: vi.fn(), domElement: document.createElement('canvas') })),
  DirectionalLight: vi.fn(() => ({ position: { set: vi.fn() } })),
  AmbientLight: vi.fn(),
  GridHelper: vi.fn(() => ({ rotation: { x: 0 } })),
  Color: vi.fn(),
  LineSegments: vi.fn(),
  BufferGeometry: vi.fn(() => ({ setAttribute: vi.fn(), dispose: vi.fn() })),
  LineBasicMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  Float32BufferAttribute: vi.fn(),
  BoxGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  MeshStandardMaterial: vi.fn(() => ({ dispose: vi.fn(), emissive: { setHex: vi.fn() }, emissiveIntensity: 0 })),
  Mesh: vi.fn(() => ({ position: { set: vi.fn() }, add: vi.fn(), userData: {} })),
  PointLight: vi.fn(() => ({ position: { set: vi.fn() } })),
  Points: vi.fn(() => ({ position: { set: vi.fn() }, geometry: { attributes: { position: { array: new Float32Array(30), needsUpdate: false } } } })),
  PointsMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  CSS2DRenderer: vi.fn(() => ({ setSize: vi.fn(), render: vi.fn(), domElement: document.createElement('div') })),
  CSS2DObject: vi.fn(() => ({ position: { set: vi.fn() } })),
  Vector3: vi.fn((x=0,y=0,z=0) => ({ x, y, z, set: vi.fn() })),
  Raycaster: vi.fn(() => ({ setFromCamera: vi.fn(), intersectObjects: vi.fn(() => []) })),
  Vector2: vi.fn(),
  Group: vi.fn(() => ({ add: vi.fn(), remove: vi.fn(), position: { set: vi.fn() } })),
}));

vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(() => ({ enableRotate: false, enablePan: true, enableZoom: true, update: vi.fn() })),
}));

vi.mock('three/addons/renderers/CSS2DRenderer.js', () => ({
  CSS2DRenderer: vi.fn(() => ({ setSize: vi.fn(), render: vi.fn(), domElement: document.createElement('div') })),
  CSS2DObject: vi.fn(() => ({ position: { set: vi.fn() } })),
}));

import { isoToThree } from '../ThreeRenderer';

describe('isoToThree (re-exported via ThreeRenderer)', () => {
  it('is re-exported correctly', () => {
    expect(typeof isoToThree).toBe('function');
  });
});

describe('OfficeFloor', () => {
  it('can be imported', async () => {
    const { OfficeFloor } = await import('../OfficeFloor');
    expect(OfficeFloor).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts 2>&1 | head -20
```
Expected: `FAILED` with `Cannot find module '../OfficeFloor'`

- [ ] **Step 3: Implement OfficeFloor.ts**

```typescript
// src/frontend/src/canvas/three/OfficeFloor.ts
import * as THREE from 'three';

export class OfficeFloor {
  readonly mesh: THREE.GridHelper;
  readonly zoneSeparators: THREE.LineSegments;

  constructor(private scene: THREE.Scene, tilesX = 16, tilesY = 16) {
    // Floor grid — Three.js GridHelper is XZ plane (correct for our camera)
    this.mesh = new THREE.GridHelper(
      tilesX * 32,         // size matches iso tile scale
      tilesX,
      0x1e2433,            // center line colour (dark)
      0x1e2433,            // grid line colour
    );
    this.mesh.position.set(0, -0.5, tilesY * 16);
    scene.add(this.mesh);

    // Zone separator lines — dashed lines dividing sections of the office
    const pts: number[] = [];
    for (let i = 0; i <= tilesX; i += 4) {
      const x = (i - tilesX / 2) * 32;
      pts.push(x, 0, 0,  x, 0, tilesY * 32);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.zoneSeparators = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color: 0x2a3040, transparent: true, opacity: 0.4 })
    );
    scene.add(this.zoneSeparators);
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.scene.remove(this.zoneSeparators);
    this.zoneSeparators.geometry.dispose();
    (this.zoneSeparators.material as THREE.Material).dispose();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts
```
Expected: 2 tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/canvas/three/OfficeFloor.ts \
        src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts
git commit -m "feat(3d): add OfficeFloor with grid and zone separators"
```

---

## Task 3: AgentDesk — per-agent 3D mesh + light + CSS2D label

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/canvas/three/AgentDesk.ts`
- Test: add AgentDesk smoke test to `OpenAgentVisualizer/src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts`

- [ ] **Step 1: Add AgentDesk smoke test to ThreeRenderer.test.ts**

Add this describe block to the existing `ThreeRenderer.test.ts` (after the OfficeFloor describe block):

```typescript
describe('AgentDesk', () => {
  it('can be imported', async () => {
    const { AgentDesk } = await import('../AgentDesk');
    expect(AgentDesk).toBeDefined();
  });

  it('instantiates with mock agent and does not throw', async () => {
    const { AgentDesk } = await import('../AgentDesk');
    const scene = new (await import('three')).Scene();
    const agent = { id: 'a1', name: 'Agent-1', status: 'working', xp: 0, tokens_per_second: 5, position: { x: 2, y: 3 } };
    expect(() => new AgentDesk(scene as any, agent as any)).not.toThrow();
  });

  it('update() does not throw', async () => {
    const { AgentDesk } = await import('../AgentDesk');
    const scene = new (await import('three')).Scene();
    const agent = { id: 'a1', name: 'Agent-1', status: 'idle', xp: 0, tokens_per_second: 0, position: { x: 0, y: 0 } };
    const desk = new AgentDesk(scene as any, agent as any);
    expect(() => desk.update({ ...agent, status: 'error' } as any)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts 2>&1 | head -20
```
Expected: `FAILED` — `AgentDesk` not yet created.

- [ ] **Step 3: Implement AgentDesk.ts**

```typescript
// src/frontend/src/canvas/three/AgentDesk.ts
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { isoToThree } from './ThreeRenderer';
import type { AgentState } from '../../stores/agentStore';

const STATUS_COLOURS: Record<string, number> = {
  working:  0x6366f1,   // indigo — accent colour from tokens
  idle:     0x1e2433,   // dark surface
  error:    0xef4444,   // red
  waiting:  0xf59e0b,   // amber
};

const DESK_GEOMETRY = new THREE.BoxGeometry(28, 4, 20);

export class AgentDesk {
  readonly group: THREE.Group;
  private deskMesh: THREE.Mesh;
  private glowLight: THREE.PointLight;
  private label: CSS2DObject;
  private labelDiv: HTMLDivElement;

  constructor(private scene: THREE.Scene, agent: AgentState) {
    this.group = new THREE.Group();

    // Desk body
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1f2e,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.deskMesh = new THREE.Mesh(DESK_GEOMETRY, mat);
    this.deskMesh.userData.agentId = agent.id;
    this.group.add(this.deskMesh);

    // Glow ring under desk
    this.glowLight = new THREE.PointLight(
      STATUS_COLOURS[agent.status] ?? STATUS_COLOURS.idle,
      agent.status === 'working' ? 2 : 0.3,
      80,
    );
    this.glowLight.position.set(0, 6, 0);
    this.group.add(this.glowLight);

    // CSS2D label (crisp text overlay, no texture baking needed)
    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'oav-desk-label';
    this.labelDiv.style.cssText = `
      color: #fafafa; font-size: 11px; font-family: 'Inter', sans-serif;
      background: rgba(10,10,10,0.75); padding: 2px 6px; border-radius: 4px;
      pointer-events: none; white-space: nowrap;
    `;
    this.labelDiv.textContent = agent.name;
    this.label = new CSS2DObject(this.labelDiv);
    this.label.position.set(0, 16, 0);
    this.group.add(this.label);

    // Position desk in Three.js world using isoToThree adapter
    const pos = agent.position ?? { x: 0, y: 0 };
    const wp = isoToThree(pos.x, pos.y);
    this.group.position.set(wp.x, wp.y, wp.z);

    scene.add(this.group);
  }

  update(agent: AgentState): void {
    // Update glow colour and intensity based on new status
    const colour = STATUS_COLOURS[agent.status] ?? STATUS_COLOURS.idle;
    this.glowLight.color.setHex(colour);
    this.glowLight.intensity = agent.status === 'working'
      ? 1.0 + (agent.tokens_per_second ?? 0) * 0.5
      : agent.status === 'error' ? 1.5 : 0.3;

    // Update emissive on desk mesh to match status
    (this.deskMesh.material as THREE.MeshStandardMaterial).emissive.setHex(colour);
    (this.deskMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
      agent.status === 'working' ? 0.15 : agent.status === 'error' ? 0.4 : 0;

    // Update label
    this.labelDiv.textContent = agent.name;

    // Move if position changed
    const pos = agent.position ?? { x: 0, y: 0 };
    const wp = isoToThree(pos.x, pos.y);
    this.group.position.set(wp.x, wp.y, wp.z);
  }

  dispose(): void {
    this.scene.remove(this.group);
    DESK_GEOMETRY; // shared geometry — do NOT dispose
    (this.deskMesh.material as THREE.Material).dispose();
    this.labelDiv.remove();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts
```
Expected: all tests `PASSED` including 3 new AgentDesk tests.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/canvas/three/AgentDesk.ts \
        src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts
git commit -m "feat(3d): add AgentDesk with glow lights, emissive material, and CSS2D label"
```

---

## Task 4: ThreeParticles — particle events via Three.js Points

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/canvas/three/ThreeParticles.ts`
- Test: `OpenAgentVisualizer/src/frontend/src/canvas/three/__tests__/ThreeParticles.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/frontend/src/canvas/three/__tests__/ThreeParticles.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('three', () => ({
  Points: vi.fn(() => ({ position: { set: vi.fn() }, geometry: { attributes: { position: { array: new Float32Array(300), needsUpdate: false } }, setAttribute: vi.fn(), dispose: vi.fn() }, material: { dispose: vi.fn() } })),
  BufferGeometry: vi.fn(() => ({ setAttribute: vi.fn(), dispose: vi.fn() })),
  PointsMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  Float32BufferAttribute: vi.fn((arr, _n) => ({ array: arr })),
  Color: vi.fn((hex) => ({ r: 0, g: 0, b: 0, setHex: vi.fn() })),
  Scene: vi.fn(() => ({ add: vi.fn(), remove: vi.fn() })),
  Vector3: vi.fn((x=0,y=0,z=0) => ({ x, y, z })),
}));

import { ThreeParticles } from '../ThreeParticles';
import * as THREE from 'three';

describe('ThreeParticles', () => {
  let scene: THREE.Scene;
  let particles: ThreeParticles;

  beforeEach(() => {
    scene = new THREE.Scene();
    particles = new ThreeParticles(scene);
  });

  it('instantiates without throwing', () => {
    expect(particles).toBeDefined();
  });

  it('emitXPGain does not throw', () => {
    expect(() => particles.emitXPGain({ x: 0, y: 0, z: 0 })).not.toThrow();
  });

  it('emitLevelUp does not throw', () => {
    expect(() => particles.emitLevelUp({ x: 32, y: 0, z: 16 })).not.toThrow();
  });

  it('emitError does not throw', () => {
    expect(() => particles.emitError({ x: 0, y: 0, z: 0 })).not.toThrow();
  });

  it('emitHandoff does not throw with two positions', () => {
    expect(() => particles.emitHandoff({ x: 0, y: 0, z: 0 }, { x: 64, y: 0, z: 32 })).not.toThrow();
  });

  it('dispose does not throw', () => {
    expect(() => particles.dispose()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeParticles.test.ts 2>&1 | head -20
```
Expected: `FAILED` with `Cannot find module '../ThreeParticles'`

- [ ] **Step 3: Implement ThreeParticles.ts**

```typescript
// src/frontend/src/canvas/three/ThreeParticles.ts
import * as THREE from 'three';

interface Vec3 { x: number; y: number; z: number; }

interface ParticleBurst {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;       // remaining frames
  maxLife: number;
}

const PARTICLE_COUNT = 30;

export class ThreeParticles {
  private bursts: ParticleBurst[] = [];
  private frameId: number | null = null;

  constructor(private scene: THREE.Scene) {}

  /** Gold sparkles rising from a point (XP gain). */
  emitXPGain(pos: Vec3): void {
    this._burst(pos, 0xffd700, PARTICLE_COUNT, 20, 0.6);
  }

  /** Gold confetti explosion (level-up). */
  emitLevelUp(pos: Vec3): void {
    this._burst(pos, 0xffd700, PARTICLE_COUNT, 40, 1.5);
    this._burst(pos, 0xa855f7, PARTICLE_COUNT, 35, 1.5);
  }

  /** Red pulse ring (agent error). */
  emitError(pos: Vec3): void {
    this._burst(pos, 0xef4444, PARTICLE_COUNT, 25, 0.8);
  }

  /** Blue arc from one agent to another (handoff). */
  emitHandoff(from: Vec3, to: Vec3): void {
    // Midpoint arc: emit from midpoint toward both endpoints
    const mid = { x: (from.x + to.x) / 2, y: 8, z: (from.z + to.z) / 2 };
    this._burst(mid, 0x6366f1, PARTICLE_COUNT, 30, 0.5);
  }

  private _burst(pos: Vec3, colour: number, count: number, speed: number, lifeSec: number): void {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      // Random outward velocity
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI;
      velocities[i * 3]     = Math.cos(angle) * Math.cos(elevation) * speed;
      velocities[i * 3 + 1] = Math.sin(elevation) * speed + speed * 0.5;  // bias upward
      velocities[i * 3 + 2] = Math.sin(angle) * Math.cos(elevation) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: colour,
      size: 3,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const maxLife = Math.round(lifeSec * 60);
    this.bursts.push({ points, velocities, life: maxLife, maxLife });
  }

  /** Call once per render frame to advance particle physics. */
  tick(): void {
    const dead: ParticleBurst[] = [];
    for (const burst of this.bursts) {
      burst.life--;
      const t = burst.life / burst.maxLife;
      (burst.points.material as THREE.PointsMaterial).opacity = t;

      const pos = (burst.points.geometry.getAttribute('position') as THREE.BufferAttribute);
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3]     += burst.velocities[i * 3]     * 0.016;
        arr[i * 3 + 1] += burst.velocities[i * 3 + 1] * 0.016;
        arr[i * 3 + 1] -= 0.1;  // gravity
        arr[i * 3 + 2] += burst.velocities[i * 3 + 2] * 0.016;
      }
      pos.needsUpdate = true;

      if (burst.life <= 0) dead.push(burst);
    }

    for (const d of dead) {
      this.scene.remove(d.points);
      d.points.geometry.dispose();
      (d.points.material as THREE.Material).dispose();
      this.bursts.splice(this.bursts.indexOf(d), 1);
    }
  }

  dispose(): void {
    for (const burst of this.bursts) {
      this.scene.remove(burst.points);
      burst.points.geometry.dispose();
      (burst.points.material as THREE.Material).dispose();
    }
    this.bursts = [];
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeParticles.test.ts
```
Expected: 6 tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/canvas/three/ThreeParticles.ts \
        src/frontend/src/canvas/three/__tests__/ThreeParticles.test.ts
git commit -m "feat(3d): add ThreeParticles with XP/level-up/error/handoff burst events"
```

---

## Task 5: ThreeRenderer — full scene + render loop + agent sync

> **Note — DirectionalLight deviation from spec:** The design spec §5.2 states "DirectionalLight intensity driven by `agent.tokens_per_second` (brighter = busier)". This plan uses a fixed-intensity `DirectionalLight` (0.8) as the ambient scene light, while per-agent activity drives `PointLight` intensity in `AgentDesk.update()` (Task 3). Rationale: a single `DirectionalLight` driving global brightness creates unreadable scenes when some agents are idle. Per-agent `PointLight` is more visually precise and is the same effect the spec intends.

**Files:**
- Modify: `OpenAgentVisualizer/src/frontend/src/canvas/three/ThreeRenderer.ts` (implement full class)

- [ ] **Step 1: Add failing ThreeRenderer class tests to ThreeRenderer.test.ts**

The mock infrastructure from Task 2 already mocks WebGL — add class-level tests now:

```typescript
// Add to src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts:
describe('ThreeRenderer class', () => {
  it('can be instantiated with a container div', () => {
    const div = document.createElement('div');
    const renderer = new ThreeRenderer(div);
    expect(renderer).toBeDefined();
    renderer.dispose();
  });

  it('syncAgents updates desks for each agent', () => {
    const div = document.createElement('div');
    const renderer = new ThreeRenderer(div);
    renderer.syncAgents([
      { id: 'a1', name: 'Agent 1', status: 'working', x: 2, y: 3, model: 'gpt-4o',
        tokens_per_second: 20, cost_usd: 0.01, xp: 100 } as any,
    ]);
    // No error = pass; AgentDesk creation is mocked
    renderer.dispose();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts 2>&1 | head -20
```
Expected: `FAILED` — ThreeRenderer class not yet fully implemented (only stub from Task 1 exists).

- [ ] **Step 3: Implement complete ThreeRenderer class**

```typescript
// src/frontend/src/canvas/three/ThreeRenderer.ts (REPLACE stub with full implementation)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { OfficeFloor } from './OfficeFloor';
import { AgentDesk } from './AgentDesk';
import { ThreeParticles } from './ThreeParticles';
import type { AgentState } from '../../stores/agentStore';

export function isoToThree(isoX: number, isoY: number): { x: number; y: number; z: number } {
  return { x: (isoX - isoY) * 32, y: 0, z: (isoX + isoY) * 16 };
}

export class ThreeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private floor: OfficeFloor;
  private particles: ThreeParticles;
  private desks = new Map<string, AgentDesk>();
  private frameId: number | null = null;
  private onSelectAgent?: (agentId: string) => void;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(private container: HTMLDivElement) {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    const aspect = w / h;
    const viewSize = 300;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1117);

    // Orthographic camera at 45° isometric angle
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect, viewSize * aspect,
      viewSize, -viewSize,
      0.1, 10000,
    );
    this.camera.position.set(300, 400, 300);
    this.camera.lookAt(0, 0, 0);

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // CSS2D renderer for agent name labels
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    this.labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    container.appendChild(this.labelRenderer.domElement);

    // Orbit controls — pan + zoom, no free rotation (maintains isometric feel)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minZoom = 0.3;
    this.controls.maxZoom = 3;

    // Lighting
    // AmbientLight: constant scene fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    // DirectionalLight: fixed sun light — NOT driven by agent activity.
    // Per-agent activity drives PointLight glow intensity in AgentDesk.update().
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(200, 400, 100);
    this.scene.add(dir);

    // Office floor
    this.floor = new OfficeFloor(this.scene);

    // Particles
    this.particles = new ThreeParticles(this.scene);

    // Click handler for agent selection
    this.renderer.domElement.addEventListener('click', this._onClick.bind(this));

    // Resize observer
    const ro = new ResizeObserver(() => this._onResize());
    ro.observe(container);

    this._startLoop();
  }

  setOnSelectAgent(cb: (agentId: string) => void): void {
    this.onSelectAgent = cb;
  }

  syncAgents(agents: AgentState[]): void {
    const incomingIds = new Set(agents.map((a) => a.id));

    // Add/update desks
    for (const agent of agents) {
      if (this.desks.has(agent.id)) {
        this.desks.get(agent.id)!.update(agent);
      } else {
        const desk = new AgentDesk(this.scene, agent);
        this.desks.set(agent.id, desk);
      }
    }

    // Remove desks for agents no longer in store
    for (const [id, desk] of this.desks) {
      if (!incomingIds.has(id)) {
        desk.dispose();
        this.desks.delete(id);
      }
    }
  }

  // Particle event forwarders — called by VirtualWorldPage on agentStore events
  emitXPGain(agentId: string): void {
    const desk = this.desks.get(agentId);
    if (desk) this.particles.emitXPGain(desk.group.position);
  }

  emitLevelUp(agentId: string): void {
    const desk = this.desks.get(agentId);
    if (desk) this.particles.emitLevelUp(desk.group.position);
  }

  emitError(agentId: string): void {
    const desk = this.desks.get(agentId);
    if (desk) this.particles.emitError(desk.group.position);
  }

  emitHandoff(fromId: string, toId: string): void {
    const from = this.desks.get(fromId);
    const to = this.desks.get(toId);
    if (from && to) this.particles.emitHandoff(from.group.position, to.group.position);
  }

  private _startLoop(): void {
    const loop = () => {
      this.frameId = requestAnimationFrame(loop);
      this.controls.update();
      this.particles.tick();
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    loop();
  }

  private _onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const aspect = w / h;
    const viewSize = 300;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  private _onClick(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.desks.values()).map((d) => (d as any).deskMesh as THREE.Mesh);
    const hits = this.raycaster.intersectObjects(meshes);
    if (hits.length > 0) {
      const agentId = hits[0].object.userData.agentId as string;
      this.onSelectAgent?.(agentId);
    }
  }

  dispose(): void {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.renderer.domElement.removeEventListener('click', this._onClick.bind(this));
    for (const desk of this.desks.values()) desk.dispose();
    this.desks.clear();
    this.floor.dispose();
    this.particles.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }
}
```

- [ ] **Step 4: Run all ThreeRenderer tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts src/canvas/three/__tests__/isoToThree.test.ts
```
Expected: all tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/canvas/three/ThreeRenderer.ts
git commit -m "feat(3d): implement full ThreeRenderer with camera, lighting, orbit controls, click-to-select"
```

---

## Task 6: ThreeCanvas React wrapper

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/canvas/three/ThreeCanvas.tsx`

- [ ] **Step 1: Write test**

```typescript
// Add to ThreeRenderer.test.ts:
describe('ThreeCanvas', () => {
  it('can be imported', async () => {
    const { ThreeCanvas } = await import('../ThreeCanvas');
    expect(ThreeCanvas).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts 2>&1 | tail -10
```
Expected: `FAILED` — `Cannot find module '../ThreeCanvas'`

- [ ] **Step 3: Implement ThreeCanvas.tsx**

```typescript
// src/frontend/src/canvas/three/ThreeCanvas.tsx
import { useEffect, useRef } from 'react';
import { ThreeRenderer } from './ThreeRenderer';
import { useAgentStore } from '../../stores/agentStore';

interface Props {
  workspaceId: string;
  onSelectAgent?: (agentId: string) => void;
}

export function ThreeCanvas({ workspaceId, onSelectAgent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const agents = useAgentStore((s) => s.agents);

  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new ThreeRenderer(containerRef.current);
    rendererRef.current = renderer;
    if (onSelectAgent) renderer.setOnSelectAgent(onSelectAgent);

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Mount once — dispose on unmount

  useEffect(() => {
    rendererRef.current?.syncAgents(Object.values(agents));
  }, [agents]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ touchAction: 'none' }}
      data-workspace={workspaceId}
    />
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts
```
Expected: all tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/canvas/three/ThreeCanvas.tsx
git commit -m "feat(3d): add ThreeCanvas React wrapper with mount/unmount lifecycle"
```

---

## Task 7: ThreeMiniMap — top-down thumbnail

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/canvas/three/ThreeMiniMap.ts`
- Test: add ThreeMiniMap smoke test to `OpenAgentVisualizer/src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts`

- [ ] **Step 1: Add ThreeMiniMap smoke test to ThreeRenderer.test.ts**

Add this describe block to the existing `ThreeRenderer.test.ts`:

```typescript
describe('ThreeMiniMap', () => {
  it('can be imported', async () => {
    const { ThreeMiniMap } = await import('../ThreeMiniMap');
    expect(ThreeMiniMap).toBeDefined();
  });

  it('instantiates without throwing', async () => {
    const { ThreeMiniMap } = await import('../ThreeMiniMap');
    const scene = new (await import('three')).Scene();
    expect(() => new ThreeMiniMap(scene as any)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts 2>&1 | head -10
```
Expected: `FAILED` — `ThreeMiniMap` not yet created.

- [ ] **Step 3: Implement ThreeMiniMap.ts**

ThreeMiniMap is a secondary camera rendering the scene from above into an off-screen canvas, then drawn into a small `<canvas>` element in the corner of the UI. Clicking the minimap pans the main camera to that world position.

```typescript
// src/frontend/src/canvas/three/ThreeMiniMap.ts
import * as THREE from 'three';

export class ThreeMiniMap {
  readonly canvas: HTMLCanvasElement;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private onPan?: (worldX: number, worldZ: number) => void;

  constructor(private scene: THREE.Scene, size = 160) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.cssText = `
      position: absolute; bottom: 16px; right: 16px;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
      opacity: 0.85; cursor: crosshair;
    `;

    this.camera = new THREE.OrthographicCamera(-300, 300, 300, -300, 1, 2000);
    this.camera.position.set(0, 1000, 0);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
    this.renderer.setSize(size, size);
    this.renderer.setClearColor(0x0a0a0a);

    // Click-to-pan: map canvas click → world XZ → notify main camera
    this.canvas.addEventListener('click', (e: MouseEvent) => {
      if (!this.onPan) return;
      const rect = this.canvas.getBoundingClientRect();
      // Normalize to [-1, 1] in minimap space
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      // Back-project through minimap camera to world XZ (y=0 plane)
      const worldX = nx * 300;
      const worldZ = -ny * 300;
      this.onPan(worldX, worldZ);
    });
  }

  /** Register callback — called when user clicks minimap with target world position. */
  setOnPan(cb: (worldX: number, worldZ: number) => void): void {
    this.onPan = cb;
  }

  tick(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.canvas.remove();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/__tests__/ThreeRenderer.test.ts
```
Expected: all tests `PASSED` including 2 new ThreeMiniMap tests.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/canvas/three/ThreeMiniMap.ts \
        src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts
git commit -m "feat(3d): add ThreeMiniMap top-down thumbnail with click-to-pan"
```

---

## Task 8: PixelStreamingEmbed + PixelStreamingBridge

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/components/canvas/PixelStreamingEmbed.tsx`
- Create: `OpenAgentVisualizer/src/frontend/src/components/canvas/PixelStreamingBridge.ts`
- Test: `OpenAgentVisualizer/src/frontend/src/components/canvas/__tests__/PixelStreamingEmbed.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/frontend/src/components/canvas/__tests__/PixelStreamingEmbed.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PixelStreamingEmbed } from '../PixelStreamingEmbed';

describe('PixelStreamingEmbed', () => {
  it('renders fallback with setup instruction when no signallingUrl provided', () => {
    render(<PixelStreamingEmbed signallingUrl="" workspaceId="ws-1" />);
    // Must show the specific docker compose command from the spec
    expect(screen.getByText(/docker compose.*--profile pro/i)).toBeTruthy();
  });

  it('renders iframe when signallingUrl is provided', () => {
    render(<PixelStreamingEmbed signallingUrl="ws://localhost:8888" workspaceId="ws-1" />);
    // Iframe or embed container should exist
    const container = document.querySelector('[data-ps-container]');
    expect(container).toBeTruthy();
  });
});

// PixelStreamingBridge
import { PixelStreamingBridge } from '../PixelStreamingBridge';

describe('PixelStreamingBridge', () => {
  it('encodeAgentState returns valid JSON', () => {
    const bridge = new PixelStreamingBridge();
    const state = { id: 'a1', name: 'Agent', status: 'working', xp: 100, position: { x: 2, y: 3 } };
    const json = bridge.encodeAgentState(state as any);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('agent_update');
    expect(parsed.agent_id).toBe('a1');
    expect(parsed.status).toBe('working');
  });

  it('encodeEvent returns valid JSON', () => {
    const bridge = new PixelStreamingBridge();
    const json = bridge.encodeEvent('level_up', 'a1', { xp: 500 });
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('level_up');
    expect(parsed.agent_id).toBe('a1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/components/canvas/__tests__/PixelStreamingEmbed.test.tsx 2>&1 | head -20
```
Expected: `FAILED` with `Cannot find module`

- [ ] **Step 3: Implement PixelStreamingBridge.ts**

```typescript
// src/frontend/src/components/canvas/PixelStreamingBridge.ts
import type { AgentState } from '../../stores/agentStore';

export class PixelStreamingBridge {
  encodeAgentState(agent: AgentState): string {
    return JSON.stringify({
      type: 'agent_update',
      agent_id: agent.id,
      name: agent.name,
      status: agent.status,
      xp: agent.xp ?? 0,
      tokens_per_second: agent.tokens_per_second ?? 0,
      position: agent.position ?? { x: 0, y: 0 },
    });
  }

  encodeEvent(eventType: string, agentId: string, data: Record<string, unknown>): string {
    return JSON.stringify({
      type: eventType,
      agent_id: agentId,
      timestamp: Date.now(),
      ...data,
    });
  }

  encodeBulkState(agents: AgentState[]): string {
    return JSON.stringify({
      type: 'bulk_state',
      agents: agents.map((a) => ({
        id: a.id,
        status: a.status,
        xp: a.xp ?? 0,
        position: a.position ?? { x: 0, y: 0 },
      })),
    });
  }
}
```

- [ ] **Step 4: Implement PixelStreamingEmbed.tsx**

```typescript
// src/frontend/src/components/canvas/PixelStreamingEmbed.tsx
import { useEffect, useRef } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { PixelStreamingBridge } from './PixelStreamingBridge';

interface Props {
  signallingUrl: string;    // ws://localhost:8888 or wss://...
  workspaceId: string;
  quality?: 'auto' | 'high' | 'low';
}

const bridge = new PixelStreamingBridge();

export function PixelStreamingEmbed({ signallingUrl, workspaceId, quality = 'auto' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const agents = useAgentStore((s) => s.agents);

  // Push agent state updates to UE5 via data channel
  useEffect(() => {
    if (!channelRef.current || channelRef.current.readyState !== 'open') return;
    channelRef.current.send(bridge.encodeBulkState(Object.values(agents)));
  }, [agents]);

  if (!signallingUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[var(--oav-bg)]">
        <p className="text-[var(--oav-muted)] text-sm">
          Pixel Streaming requires a running UE5 process and signalling server.
        </p>
        <code className="text-xs bg-[var(--oav-surface-2)] text-[var(--oav-accent)] px-3 py-2 rounded-lg">
          docker compose --profile pro up signalling-server
        </code>
        <p className="text-[var(--oav-muted)] text-xs">
          Then set <code>OAV_PS_SIGNALLING_URL</code> in your environment.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-black"
      data-ps-container
      data-workspace={workspaceId}
    >
      {/* Pixel Streaming embed — loaded via Epic's frontend JS lib */}
      <iframe
        src={`/pixel-streaming/embed?signallingUrl=${encodeURIComponent(signallingUrl)}&quality=${quality}`}
        className="w-full h-full border-0"
        allow="autoplay; camera; microphone"
        title="UE5 Virtual World"
      />
      {/* Controls overlay */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => containerRef.current?.requestFullscreen?.()}
          className="text-xs px-2 py-1 rounded bg-black/60 text-white"
        >
          Fullscreen
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/components/canvas/__tests__/PixelStreamingEmbed.test.tsx
```
Expected: 4 tests `PASSED`

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/components/canvas/PixelStreamingEmbed.tsx \
        src/frontend/src/components/canvas/PixelStreamingBridge.ts \
        src/frontend/src/components/canvas/__tests__/PixelStreamingEmbed.test.tsx
git commit -m "feat(3d): add PixelStreamingEmbed and PixelStreamingBridge for UE5 Pixel Streaming"
```

---

## Task 9: VirtualWorldPage — 3-way mode toggle with WebGL lifecycle

> **Note — tier gating deviation from spec:** The design spec §5.4 defines `canUse3D = tier === 'pro' || tier === 'enterprise'`. This plan also allows `'team'` tier. Rationale: the `useWorkspace` hook (Task 10) exposes `tier: 'free' | 'team' | 'pro' | 'enterprise'` and team-tier customers should have access to 3D. This is a deliberate product decision and does not require a backend change.

**Files:**
- Modify: `OpenAgentVisualizer/src/frontend/src/pages/VirtualWorldPage.tsx`
- Create: `OpenAgentVisualizer/src/frontend/src/pages/__tests__/VirtualWorldPage.test.tsx`

> **Note — WorldCanvas.tsx:** Listed in the architecture overview as "Add mode-prop handling", but in practice the mode switching is handled entirely by `VirtualWorldPage` (which mounts/unmounts the right canvas component per mode). `WorldCanvas.tsx` is used as-is for 2D mode — no changes required.

- [ ] **Step 1: Read current VirtualWorldPage**

Read `src/frontend/src/pages/VirtualWorldPage.tsx` to understand existing structure before modifying.

- [ ] **Step 2: Write test for mode state**

```typescript
// Add to a new test file: src/frontend/src/pages/__tests__/VirtualWorldPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock canvas components — they require WebGL which isn't available in vitest
vi.mock('../../canvas/WorldCanvas', () => ({
  WorldCanvas: () => <div data-testid="world-canvas-2d" />,
}));
vi.mock('../../canvas/three/ThreeCanvas', () => ({
  ThreeCanvas: () => <div data-testid="world-canvas-25d" />,
}));
vi.mock('../../components/canvas/PixelStreamingEmbed', () => ({
  PixelStreamingEmbed: () => <div data-testid="pixel-streaming" />,
}));
vi.mock('../../hooks/useWorkspace', () => ({
  useWorkspace: () => ({ tier: 'free', workspaceId: 'ws-1' }),
}));

import { VirtualWorldPage } from '../VirtualWorldPage';

describe('VirtualWorldPage mode toggle', () => {
  it('renders 2D canvas by default', () => {
    render(<VirtualWorldPage />);
    expect(document.querySelector('[data-testid="world-canvas-2d"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="world-canvas-25d"]')).toBeNull();
  });

  it('switches to 2.5D when 2.5D button clicked', () => {
    render(<VirtualWorldPage />);
    const btn = screen.getByText('2.5D');
    fireEvent.click(btn);
    expect(document.querySelector('[data-testid="world-canvas-25d"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="world-canvas-2d"]')).toBeNull();
  });

  it('shows 3D button as locked for free tier', () => {
    render(<VirtualWorldPage />);
    const btn = screen.getByText(/Pro/i);
    expect(btn).toBeTruthy();
  });

  it('shows upgrade prompt when locked 3D button is clicked', () => {
    render(<VirtualWorldPage />);
    const btn = screen.getByTitle(/Upgrade to Pro/i);
    fireEvent.click(btn);
    expect(screen.getByText(/requires Pro or Enterprise/i)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/pages/__tests__/VirtualWorldPage.test.tsx 2>&1 | head -20
```

- [ ] **Step 4: Rewrite VirtualWorldPage with 3-mode toggle**

```typescript
// src/frontend/src/pages/VirtualWorldPage.tsx (REWRITE)
import { useState } from 'react';
import { WorldCanvas } from '../canvas/WorldCanvas';
import { ThreeCanvas } from '../canvas/three/ThreeCanvas';
import { PixelStreamingEmbed } from '../components/canvas/PixelStreamingEmbed';
import { useWorkspace } from '../hooks/useWorkspace';

type CanvasMode = '2d' | '2.5d' | '3d';

export function VirtualWorldPage() {
  const [mode, setMode] = useState<CanvasMode>('2d');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { workspaceId, tier } = useWorkspace();
  const canUse3D = tier === 'pro' || tier === 'team' || tier === 'enterprise';
  const signallingUrl = import.meta.env.VITE_PS_SIGNALLING_URL ?? '';

  return (
    <div className="w-full h-full flex flex-col bg-[var(--oav-bg)]">
      {/* Mode toggle bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--oav-border)] shrink-0">
        <span className="text-xs text-[var(--oav-muted)] mr-2">View:</span>
        {(['2d', '2.5d'] as CanvasMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              mode === m
                ? 'bg-[var(--oav-accent)]/15 text-[var(--oav-accent)]'
                : 'text-[var(--oav-muted)] hover:text-[var(--oav-text)]'
            }`}
          >
            {m === '2d' ? '2D' : '2.5D'}
          </button>
        ))}
        {/* 3D — locked for non-Pro */}
        {canUse3D ? (
          <button
            onClick={() => setMode('3d')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              mode === '3d'
                ? 'bg-[var(--oav-accent)]/15 text-[var(--oav-accent)]'
                : 'text-[var(--oav-muted)] hover:text-[var(--oav-text)]'
            }`}
          >
            3D
          </button>
        ) : (
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="text-xs px-3 py-1.5 rounded-lg text-[var(--oav-muted)]/60 hover:text-[var(--oav-muted)] cursor-pointer flex items-center gap-1"
            title="Upgrade to Pro for UE5 3D view"
          >
            3D
            <span className="bg-[var(--oav-accent)]/20 text-[var(--oav-accent)] text-[10px] px-1 rounded">Pro</span>
          </button>
        )}
      </div>

      {/* Upgrade prompt banner */}
      {showUpgradePrompt && !canUse3D && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--oav-accent)]/10 border-b border-[var(--oav-accent)]/20 shrink-0">
          <span className="text-xs text-[var(--oav-text)]">
            UE5 3D view requires Pro or Enterprise. Upgrade to unlock real-time 3D and Pixel Streaming.
          </span>
          <button
            onClick={() => setShowUpgradePrompt(false)}
            className="ml-auto text-xs text-[var(--oav-muted)] hover:text-[var(--oav-text)]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Canvas area — mount/unmount (NOT show/hide) to prevent WebGL context leaks */}
      <div className="flex-1 relative overflow-hidden">
        {mode === '2d' && (
          <WorldCanvas workspaceId={workspaceId} />
        )}
        {mode === '2.5d' && (
          <ThreeCanvas workspaceId={workspaceId} />
        )}
        {mode === '3d' && canUse3D && (
          <PixelStreamingEmbed signallingUrl={signallingUrl} workspaceId={workspaceId} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/pages/__tests__/VirtualWorldPage.test.tsx
```
Expected: 4 tests `PASSED`

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/pages/VirtualWorldPage.tsx \
        src/frontend/src/pages/__tests__/VirtualWorldPage.test.tsx
git commit -m "feat(3d): rewrite VirtualWorldPage with 3-mode toggle and WebGL context lifecycle"
```

---

## Task 10: useWorkspace hook

> **Prerequisite:** `GET /api/workspaces/{id}` backend router is created in **Sub-project B, Task 1**. If running Plan C independently, complete Plan B Task 1 first (or stub the endpoint to return `{"workspace_id":"default","name":"Default","tier":"free","agent_count":0}`).

> **Note — endpoint deviation from spec:** The design spec §3.2 references `/api/workspaces/me` (user-context endpoint). The backend router implemented in Sub-project B Task 1 uses `/api/workspaces/{workspace_id}`. This hook fetches `/api/workspaces/default` as the always-available starting point. The hook's interface (`workspaceId`, `tier`, `agentCount`, `name`) remains stable for future endpoint changes.

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/hooks/useWorkspace.ts`

- [ ] **Step 1: Write test**

```typescript
// src/frontend/src/hooks/__tests__/useWorkspace.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkspace } from '../useWorkspace';

describe('useWorkspace', () => {
  it('returns a workspaceId string', () => {
    const { result } = renderHook(() => useWorkspace());
    expect(typeof result.current.workspaceId).toBe('string');
  });

  it('returns a tier string', () => {
    const { result } = renderHook(() => useWorkspace());
    expect(['free', 'team', 'pro', 'enterprise']).toContain(result.current.tier);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/hooks/__tests__/useWorkspace.test.ts 2>&1 | head -10
```

- [ ] **Step 3: Implement useWorkspace.ts**

```typescript
// src/frontend/src/hooks/useWorkspace.ts
import { useEffect, useState } from 'react';

interface WorkspaceInfo {
  workspaceId: string;
  name: string;
  tier: 'free' | 'team' | 'pro' | 'enterprise';
  agentCount: number;
}

const DEFAULT: WorkspaceInfo = {
  workspaceId: 'default',
  name: 'Default Workspace',
  tier: 'free',
  agentCount: 0,
};

export function useWorkspace(): WorkspaceInfo {
  const [info, setInfo] = useState<WorkspaceInfo>(DEFAULT);

  useEffect(() => {
    const endpoint = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
    const apiKey = localStorage.getItem('oav_api_key') ?? '';
    // Note: spec §3.2 shows `/api/workspaces/me` but the backend router implemented in
    // Sub-project B Task 1 uses `/api/workspaces/{workspace_id}`. We use `/api/workspaces/default`
    // (the always-available workspace) as the initial value. A future V2 user-context endpoint
    // can replace this without changing the hook's interface.
    fetch(`${endpoint}/api/workspaces/default`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setInfo({
          workspaceId: data.workspace_id ?? 'default',
          name: data.name ?? 'Default Workspace',
          tier: data.tier ?? 'free',
          agentCount: data.agent_count ?? 0,
        });
      })
      .catch(() => {
        /* Use defaults if backend unreachable */
      });
  }, []);

  return info;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/hooks/__tests__/useWorkspace.test.ts
```
Expected: 2 tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/hooks/useWorkspace.ts \
        src/frontend/src/hooks/__tests__/useWorkspace.test.ts
git commit -m "feat(hooks): add useWorkspace hook with tier and workspaceId from backend"
```

---

## Task 11: Signalling server Docker service

**Files:**
- Create: `OpenAgentVisualizer/src/pixel-streaming/signalling-server/server.js`
- Create: `OpenAgentVisualizer/src/pixel-streaming/signalling-server/server.test.js`
- Create: `OpenAgentVisualizer/src/pixel-streaming/signalling-server/Dockerfile`
- Create: `OpenAgentVisualizer/src/pixel-streaming/docker-compose.override.yml`

- [ ] **Step 1: Write failing test for signalling server message routing**

```javascript
// src/pixel-streaming/signalling-server/server.test.js
// Run with: node --test server.test.js
const assert = require('node:assert/strict');
const { describe, it, before, after } = require('node:test');
const WebSocket = require('ws');

// Import routing logic directly (extracted from server.js)
const { routeMessage, createPeerRegistry } = require('./server');

describe('signalling server routing', () => {
  it('routes targeted messages to specific peer', () => {
    const peers = createPeerRegistry();
    const sent = [];
    const mockPeer = { send: (msg) => sent.push(JSON.parse(msg)), readyState: WebSocket.OPEN };
    peers.set('peer-2', mockPeer);

    routeMessage(peers, 'peer-1', JSON.stringify({ type: 'offer', to: 'peer-2', sdp: 'test' }));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].from, 'peer-1');
    assert.equal(sent[0].sdp, 'test');
  });

  it('broadcasts messages when no target specified', () => {
    const peers = createPeerRegistry();
    const sent = [];
    const mockPeer = { send: (msg) => sent.push(JSON.parse(msg)), readyState: WebSocket.OPEN };
    peers.set('peer-1', { send: () => {}, readyState: WebSocket.OPEN }); // sender
    peers.set('peer-2', mockPeer);

    routeMessage(peers, 'peer-1', JSON.stringify({ type: 'ice-candidate' }));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].from, 'peer-1');
  });
});
```

Run to confirm it fails:
```bash
cd OpenAgentVisualizer/src/pixel-streaming/signalling-server
npm install ws 2>/dev/null || true
node --test server.test.js 2>&1 | head -15
```
Expected: `FAILED` — `Cannot find module './server'` (server.js not yet created).

- [ ] **Step 2: Create minimal signalling server**

```javascript
// src/pixel-streaming/signalling-server/server.js
// Minimal WebRTC signalling server for UE5 Pixel Streaming.
// Based on Epic's reference implementation, stripped to essentials.
const WebSocket = require('ws');

function createPeerRegistry() { return new Map(); }

function routeMessage(peers, fromId, raw) {
  try {
    const msg = JSON.parse(raw.toString());
    if (msg.to && peers.has(msg.to)) {
      // Route to specific peer
      peers.get(msg.to).send(JSON.stringify({ ...msg, from: fromId }));
    } else {
      // Broadcast to all other peers (UE5 peer discovery)
      for (const [pid, peer] of peers) {
        if (pid !== fromId && peer.readyState === WebSocket.OPEN) {
          peer.send(JSON.stringify({ ...msg, from: fromId }));
        }
      }
    }
  } catch { /* ignore parse errors */ }
}

// Only start server when run directly (not when required by tests)
if (require.main === module) {
  const PORT = process.env.PORT ?? 8888;
  const peers = createPeerRegistry();
  const wss = new WebSocket.Server({ port: PORT });

  wss.on('connection', (ws) => {
    const id = Math.random().toString(36).slice(2);
    peers.set(id, ws);
    ws.send(JSON.stringify({ type: 'config', peerConnectionOptions: {} }));
    ws.on('message', (raw) => routeMessage(peers, id, raw));
    ws.on('close', () => peers.delete(id));
  });

  console.log(`OAV Pixel Streaming signalling server listening on :${PORT}`);
}

module.exports = { createPeerRegistry, routeMessage };
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
# src/pixel-streaming/signalling-server/Dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install ws
COPY server.js .
EXPOSE 8888
CMD ["node", "server.js"]
```

- [ ] **Step 4: Create docker-compose.override.yml**

```yaml
# src/pixel-streaming/docker-compose.override.yml
# Extend the main docker-compose.yml with Pro/Enterprise services.
# Usage: docker compose --profile pro -f docker-compose.yml -f src/pixel-streaming/docker-compose.override.yml up
version: "3.9"
services:
  signalling-server:
    build: ./src/pixel-streaming/signalling-server
    ports:
      - "8888:8888"
    profiles: ["pro", "enterprise"]
    restart: unless-stopped
    environment:
      PORT: "8888"
```

- [ ] **Step 5: Run tests to verify server logic passes**

```bash
cd OpenAgentVisualizer/src/pixel-streaming/signalling-server
node --test server.test.js
```
Expected: 2 tests `PASSED`

- [ ] **Step 6: Build and verify signalling server**

```bash
cd OpenAgentVisualizer/src/pixel-streaming/signalling-server
docker build -t oav-signalling .
docker run --rm -d -p 8888:8888 --name oav-signalling-test oav-signalling
sleep 2
# Verify it's listening
curl -s --max-time 2 http://localhost:8888 || echo "WS server up (HTTP returns error, expected)"
docker stop oav-signalling-test
```
Expected: server starts without error (HTTP 400/426 is expected — it's a WebSocket-only server)

- [ ] **Step 7: Commit**

```bash
git add src/pixel-streaming/signalling-server/server.js \
        src/pixel-streaming/signalling-server/server.test.js \
        src/pixel-streaming/signalling-server/Dockerfile \
        src/pixel-streaming/docker-compose.override.yml
git commit -m "feat(3d): add UE5 Pixel Streaming signalling server with Docker service"
```

---

## Task 12: Full rebuild + 3D smoke test

**Files:** No new files — integration and verification only.

- [ ] **Step 1: Run all Three.js tests**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/canvas/three/ src/components/canvas/ src/pages/__tests__/VirtualWorldPage.test.tsx src/hooks/__tests__/useWorkspace.test.ts
```
Expected: all tests `PASSED`

- [ ] **Step 2: Rebuild frontend**

```bash
cd OpenAgentVisualizer/src/frontend
npm run build 2>&1 | tail -10
```
Expected: `Build complete` with no TypeScript errors

Key things to verify in build output:
- No `TS2305: Module has no exported member 'isoToThree'`
- No `TS2307: Cannot find module 'three/addons/...'`
- Bundle does not duplicate Three.js (only one copy)

- [ ] **Step 3: Docker Compose rebuild**

```bash
cd OpenAgentVisualizer
docker compose down
docker compose up --build -d
docker compose ps
```
Expected: all services `Up`

- [ ] **Step 4: Manual smoke test — 2.5D mode**

```
1. Open http://localhost (or http://localhost:5173 in dev)
2. Navigate to Virtual World page
3. Click "2.5D" mode toggle button
4. Verify: isometric 3D office renders, no blank/error page
5. Verify: PixiJS canvas (2D) is fully unmounted (no two canvases in DOM)
6. Click "2D" to switch back
7. Verify: Three.js canvas is disposed, PixiJS canvas appears
8. Open browser DevTools → Application → check WebGL contexts — should not grow unboundedly on toggle
```

- [ ] **Step 5: Manual smoke test — agent desks**

```
1. In 2.5D mode, verify agent desk meshes appear (if agents are connected)
2. OR: send a test event via `oav test claude-code` and verify a new desk appears
3. Click a desk — verify AgentDetailPanel opens
```

- [ ] **Step 6: Commit final build**

```bash
cd OpenAgentVisualizer
git add src/frontend/src/canvas/three/ThreeRenderer.ts \
        src/frontend/src/canvas/three/ThreeCanvas.tsx \
        src/frontend/src/canvas/three/AgentDesk.ts \
        src/frontend/src/canvas/three/OfficeFloor.ts \
        src/frontend/src/canvas/three/ThreeMiniMap.ts \
        src/frontend/src/canvas/three/ThreeParticles.ts \
        src/frontend/src/canvas/three/__tests__/ThreeRenderer.test.ts \
        src/frontend/src/canvas/three/__tests__/ThreeParticles.test.ts \
        src/frontend/src/canvas/three/__tests__/isoToThree.test.ts \
        src/frontend/src/components/canvas/PixelStreamingEmbed.tsx \
        src/frontend/src/components/canvas/PixelStreamingBridge.ts \
        src/frontend/src/components/canvas/__tests__/PixelStreamingEmbed.test.tsx \
        src/frontend/src/pages/VirtualWorldPage.tsx \
        src/frontend/src/pages/__tests__/VirtualWorldPage.test.tsx \
        src/frontend/src/hooks/useWorkspace.ts \
        src/frontend/src/hooks/__tests__/useWorkspace.test.ts \
        src/pixel-streaming/signalling-server/server.js \
        src/pixel-streaming/signalling-server/server.test.js \
        src/pixel-streaming/signalling-server/Dockerfile \
        src/pixel-streaming/docker-compose.override.yml
git commit -m "feat(3d): complete Three.js 2.5D viewer and UE5 Pixel Streaming — Sub-project C done"
git push origin master
```

---

## Completion Checklist

- [ ] `isoToThree(x, y)`: 6 unit tests pass — formula correct
- [ ] `OfficeFloor`: imports cleanly, grid and zone separators added to scene
- [ ] `AgentDesk`: per-agent desk mesh, PointLight glow, CSS2D label, `update()` changes emissive
- [ ] `ThreeParticles`: all 4 emit methods fire without throwing; `tick()` advances physics
- [ ] `ThreeRenderer`: `isoToThree` exported, `syncAgents()` adds/updates/removes desks, `dispose()` cleans WebGL
- [ ] `ThreeCanvas`: mounts `ThreeRenderer` on mount, disposes on unmount
- [ ] `ThreeMiniMap`: renders top-down thumbnail to `<canvas>`
- [ ] `PixelStreamingBridge`: `encodeAgentState` and `encodeEvent` return valid JSON with correct shape
- [ ] `PixelStreamingEmbed`: renders fallback when no URL; renders `data-ps-container` iframe when URL provided
- [ ] `VirtualWorldPage`: 3-way toggle works; 2D↔2.5D mounts/unmounts; 3D locked for free tier
- [ ] `useWorkspace`: returns `workspaceId` + `tier` from backend
- [ ] Signalling server: Docker image builds; container starts on port 8888
- [ ] Frontend TypeScript build: no errors
- [ ] Docker Compose rebuild: all services healthy
- [ ] Manual smoke test: 2.5D mode renders, switching modes does not leak WebGL contexts
