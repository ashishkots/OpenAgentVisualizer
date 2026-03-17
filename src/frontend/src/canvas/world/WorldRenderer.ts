import type { Application } from 'pixi.js';
import { IsoGrid } from './IsoGrid';
import type { Agent } from '../../types/agent';
import { worldToScreen } from '../../lib/isoMath';

const GRID_COLS = 20;
const GRID_ROWS = 20;
const TILE_W = 64;
const TILE_H = 32;

export class WorldRenderer {
  private app: Application;
  private grid: IsoGrid;
  private agentPositions: Map<string, { x: number; y: number }> = new Map();

  constructor(app: Application) {
    this.app = app;
    this.grid = new IsoGrid(GRID_COLS, GRID_ROWS);
  }

  init() {
    const centerX = this.app.screen?.width / 2 ?? 400;
    const centerY = (this.app.screen?.height ?? 400) / 4;
    this.grid.draw(centerX, centerY);
    this.app.stage.addChild(this.grid.view);
  }

  syncAgents(agents: Agent[]) {
    // Assign deterministic positions on a grid based on agent index
    agents.forEach((agent, idx) => {
      const col = (idx % GRID_COLS) + 2;
      const row = Math.floor(idx / GRID_COLS) * 2 + 3;
      this.agentPositions.set(agent.id, { x: col, y: row });
    });
  }

  worldToScreenPos(wx: number, wy: number): { x: number; y: number } {
    const centerX = this.app.screen?.width / 2 ?? 400;
    const centerY = (this.app.screen?.height ?? 400) / 4;
    return worldToScreen(wx, wy, { tileW: TILE_W, tileH: TILE_H, originX: centerX, originY: centerY });
  }
}
