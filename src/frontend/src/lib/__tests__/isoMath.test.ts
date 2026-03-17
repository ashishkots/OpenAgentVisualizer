import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld } from '../isoMath';

describe('isoMath', () => {
  it('worldToScreen converts origin correctly', () => {
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
