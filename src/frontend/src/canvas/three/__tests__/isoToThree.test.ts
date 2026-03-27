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
