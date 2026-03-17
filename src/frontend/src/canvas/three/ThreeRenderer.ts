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

// ThreeRenderer class — implemented in Task 5
export class ThreeRenderer {
  constructor(_container: HTMLDivElement) {}
  init(): void {}
  syncAgents(_agents: import('../../types/agent').Agent[]): void {}
  dispose(): void {}
}
