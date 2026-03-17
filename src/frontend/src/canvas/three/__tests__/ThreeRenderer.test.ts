import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Three.js — not available in vitest jsdom environment
vi.mock('three', () => ({
  Scene: vi.fn(() => ({ add: vi.fn(), background: null })),
  OrthographicCamera: vi.fn(() => ({ position: { set: vi.fn() }, lookAt: vi.fn(), updateProjectionMatrix: vi.fn(), left: 0, right: 0, top: 0, bottom: 0 })),
  WebGLRenderer: vi.fn(() => ({ setSize: vi.fn(), setPixelRatio: vi.fn(), render: vi.fn(), dispose: vi.fn(), domElement: document.createElement('canvas') })),
  DirectionalLight: vi.fn(() => ({ position: { set: vi.fn() } })),
  AmbientLight: vi.fn(),
  GridHelper: vi.fn(() => ({ rotation: { x: 0 }, position: { set: vi.fn() } })),
  Color: vi.fn(),
  LineSegments: vi.fn(),
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
