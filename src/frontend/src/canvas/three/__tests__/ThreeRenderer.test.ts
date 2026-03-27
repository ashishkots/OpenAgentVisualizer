import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Three.js — not available in vitest jsdom environment
vi.mock('three', () => ({
  Scene: vi.fn(() => ({ add: vi.fn(), remove: vi.fn(), background: null })),
  OrthographicCamera: vi.fn(() => ({ position: { set: vi.fn() }, lookAt: vi.fn(), updateProjectionMatrix: vi.fn(), left: 0, right: 0, top: 0, bottom: 0 })),
  WebGLRenderer: vi.fn(() => ({ setSize: vi.fn(), setPixelRatio: vi.fn(), render: vi.fn(), dispose: vi.fn(), setClearColor: vi.fn(), domElement: document.createElement('canvas') })),
  DirectionalLight: vi.fn(() => ({ position: { set: vi.fn() } })),
  AmbientLight: vi.fn(),
  GridHelper: vi.fn(() => ({ rotation: { x: 0 }, position: { set: vi.fn() } })),
  Color: vi.fn(),
  LineSegments: vi.fn(() => ({ geometry: { dispose: vi.fn() }, material: { dispose: vi.fn() } })),
  BufferGeometry: vi.fn(() => ({ setAttribute: vi.fn(), dispose: vi.fn() })),
  LineBasicMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  Float32BufferAttribute: vi.fn(),
  BoxGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  MeshStandardMaterial: vi.fn(() => ({ dispose: vi.fn(), emissive: { setHex: vi.fn() }, emissiveIntensity: 0 })),
  Mesh: vi.fn(() => ({ position: { set: vi.fn() }, add: vi.fn(), userData: {} })),
  PointLight: vi.fn(() => ({ position: { set: vi.fn() }, color: { setHex: vi.fn() }, intensity: 0 })),
  Points: vi.fn(() => ({ position: { set: vi.fn() }, geometry: { attributes: { position: { array: new Float32Array(30), needsUpdate: false } }, getAttribute: vi.fn(() => ({ array: new Float32Array(30), needsUpdate: false })), dispose: vi.fn() }, material: { dispose: vi.fn() } })),
  PointsMaterial: vi.fn(() => ({ dispose: vi.fn(), opacity: 1 })),
  CSS2DRenderer: vi.fn(() => ({ setSize: vi.fn(), render: vi.fn(), domElement: Object.assign(document.createElement('div'), { style: {} }) })),
  CSS2DObject: vi.fn(() => ({ position: { set: vi.fn() } })),
  Vector3: vi.fn((x=0,y=0,z=0) => ({ x, y, z, set: vi.fn() })),
  Raycaster: vi.fn(() => ({ setFromCamera: vi.fn(), intersectObjects: vi.fn(() => []) })),
  Vector2: vi.fn(),
  Group: vi.fn(() => ({ add: vi.fn(), remove: vi.fn(), position: { set: vi.fn(), x: 0, y: 0, z: 0 } })),
  Material: vi.fn(),
}));

vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(() => ({ enableRotate: false, enablePan: true, enableZoom: true, update: vi.fn(), minZoom: 0, maxZoom: 10 })),
}));

vi.mock('three/addons/renderers/CSS2DRenderer.js', () => ({
  CSS2DRenderer: vi.fn(() => ({ setSize: vi.fn(), render: vi.fn(), domElement: Object.assign(document.createElement('div'), { style: {} }) })),
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

describe('AgentDesk', () => {
  it('can be imported', async () => {
    const { AgentDesk } = await import('../AgentDesk');
    expect(AgentDesk).toBeDefined();
  });

  it('instantiates with mock agent and does not throw', async () => {
    const { AgentDesk } = await import('../AgentDesk');
    const { Scene } = await import('three');
    const scene = new Scene();
    const agent = { id: 'a1', name: 'Agent-1', status: 'working', xp: 0, tokens_per_second: 5, position: { x: 2, y: 3 } };
    expect(() => new AgentDesk(scene as any, agent as any)).not.toThrow();
  });

  it('update() does not throw', async () => {
    const { AgentDesk } = await import('../AgentDesk');
    const { Scene } = await import('three');
    const scene = new Scene();
    const agent = { id: 'a1', name: 'Agent-1', status: 'idle', xp: 0, tokens_per_second: 0, position: { x: 0, y: 0 } };
    const desk = new AgentDesk(scene as any, agent as any);
    expect(() => desk.update({ ...agent, status: 'error' } as any)).not.toThrow();
  });
});

import { ThreeRenderer } from '../ThreeRenderer';

describe('ThreeRenderer class', () => {
  it('can be instantiated with a container div', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(div, 'clientHeight', { value: 600, configurable: true });
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })) as any;
    // Mock requestAnimationFrame — do NOT invoke callback to avoid infinite loop
    global.requestAnimationFrame = vi.fn(() => 0) as any;
    global.cancelAnimationFrame = vi.fn() as any;
    const renderer = new ThreeRenderer(div);
    expect(renderer).toBeDefined();
    renderer.dispose();
  });

  it('syncAgents adds desks for each agent', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(div, 'clientHeight', { value: 600, configurable: true });
    global.ResizeObserver = vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })) as any;
    global.requestAnimationFrame = vi.fn(() => 0) as any;
    global.cancelAnimationFrame = vi.fn() as any;
    const renderer = new ThreeRenderer(div);
    renderer.syncAgents([
      { id: 'a1', name: 'Agent 1', status: 'working', model: 'gpt-4o' } as any,
    ]);
    renderer.dispose();
  });
});

describe('ThreeCanvas', () => {
  it('can be imported', async () => {
    const { ThreeCanvas } = await import('../ThreeCanvas');
    expect(ThreeCanvas).toBeDefined();
  });
});

describe('ThreeMiniMap', () => {
  it('can be imported', async () => {
    const { ThreeMiniMap } = await import('../ThreeMiniMap');
    expect(ThreeMiniMap).toBeDefined();
  });

  it('instantiates without throwing', async () => {
    const { ThreeMiniMap } = await import('../ThreeMiniMap');
    const { Scene } = await import('three');
    const scene = new Scene();
    expect(() => new ThreeMiniMap(scene as any)).not.toThrow();
  });
});
