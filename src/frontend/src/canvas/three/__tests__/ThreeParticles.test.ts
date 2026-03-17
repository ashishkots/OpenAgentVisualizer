import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('three', () => ({
  Points: vi.fn(() => ({
    position: { set: vi.fn() },
    geometry: {
      attributes: { position: { array: new Float32Array(300), needsUpdate: false } },
      setAttribute: vi.fn(),
      dispose: vi.fn(),
      getAttribute: vi.fn((name: string) => ({
        array: new Float32Array(300),
        needsUpdate: false,
      })),
    },
    material: { dispose: vi.fn(), opacity: 1 }
  })),
  BufferGeometry: vi.fn(() => ({ setAttribute: vi.fn(), dispose: vi.fn(), getAttribute: vi.fn() })),
  PointsMaterial: vi.fn(() => ({ dispose: vi.fn(), opacity: 1 })),
  Float32BufferAttribute: vi.fn((arr: Float32Array, _n: number) => ({ array: arr })),
  Color: vi.fn((hex: number) => ({ r: 0, g: 0, b: 0, setHex: vi.fn() })),
  Scene: vi.fn(() => ({ add: vi.fn(), remove: vi.fn() })),
  Vector3: vi.fn((x=0,y=0,z=0) => ({ x, y, z })),
  Material: vi.fn(),
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
