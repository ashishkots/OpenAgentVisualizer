import { Graphics } from 'pixi.js';
import type { AgentStatus } from '../../types/agent';

const STATUS_COLORS: Record<AgentStatus, number> = {
  idle: 0x94a3b8,
  working: 0x3b82f6,
  thinking: 0xa855f7,
  communicating: 0x10b981,
  error: 0xef4444,
};

export class AgentStatusBadge {
  private graphics: Graphics;

  constructor() {
    this.graphics = new Graphics();
  }

  get view(): Graphics {
    return this.graphics;
  }

  update(status: AgentStatus) {
    this.graphics.clear();
    this.graphics.circle(0, -24, 5).fill({ color: STATUS_COLORS[status] });
  }
}
