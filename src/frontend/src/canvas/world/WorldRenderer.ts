import type { Application } from 'pixi.js';
import { IsoGrid } from './IsoGrid';
import type { Agent } from '../../types/agent';
import { worldToScreen } from '../../lib/isoMath';
import { AgentSprite } from '../agents/AgentSprite';

const GRID_COLS = 20;
const GRID_ROWS = 20;
const TILE_W = 64;
const TILE_H = 32;

export class WorldRenderer {
  private app: Application;
  private grid: IsoGrid;
  private agentPositions: Map<string, { x: number; y: number }> = new Map();
  private sprites: Map<string, AgentSprite> = new Map();

  constructor(app: Application) {
    this.app = app;
    this.grid = new IsoGrid(GRID_COLS, GRID_ROWS);
  }

  init() {
    const centerX = (this.app.screen.width ?? 800) / 2;
    const centerY = (this.app.screen.height ?? 400) / 4;
    this.grid.draw(centerX, centerY);
    this.app.stage.addChild(this.grid.view);
  }

  syncAgents(agents: Agent[]) {
    agents.forEach((agent, idx) => {
      const col = (idx % GRID_COLS) + 2;
      const row = Math.floor(idx / GRID_COLS) * 2 + 3;
      this.agentPositions.set(agent.id, { x: col, y: row });

      let sprite = this.sprites.get(agent.id);
      if (!sprite) {
        sprite = new AgentSprite(agent);
        this.sprites.set(agent.id, sprite);
        this.app.stage.addChild(sprite.view);
      } else {
        sprite.updateStatus(agent.status);
      }

      const screenPos = this.worldToScreenPos(col, row);
      sprite.moveTo(screenPos.x, screenPos.y);
    });

    // Remove sprites for agents that no longer exist
    const agentIds = new Set(agents.map((a) => a.id));
    for (const [id, sprite] of this.sprites) {
      if (!agentIds.has(id)) {
        this.app.stage.removeChild(sprite.view);
        this.sprites.delete(id);
      }
    }
  }

  worldToScreenPos(wx: number, wy: number): { x: number; y: number } {
    const centerX = (this.app.screen.width ?? 800) / 2;
    const centerY = (this.app.screen?.height ?? 400) / 4;
    return worldToScreen(wx, wy, { tileW: TILE_W, tileH: TILE_H, originX: centerX, originY: centerY });
  }
}
