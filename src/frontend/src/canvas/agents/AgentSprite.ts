import { Container, Text, Graphics } from 'pixi.js';
import type { Agent } from '../../types/agent';

const STATUS_COLORS: Record<string, number> = {
  idle: 0x94a3b8,
  working: 0x3b82f6,
  thinking: 0xa855f7,
  communicating: 0x10b981,
  error: 0xef4444,
};

export class AgentSprite {
  private container: Container;
  private statusBadge: Graphics;
  private nameLabel: Text;
  readonly agentId: string;

  constructor(agent: Agent) {
    this.agentId = agent.id;
    this.container = new Container();
    this.statusBadge = new Graphics();
    this.nameLabel = new Text({ text: agent.name, style: { fontSize: 11, fill: 0xe2e8f0 } } as any);
    this.nameLabel.x = -(this.nameLabel.width / 2);
    this.nameLabel.y = -36;
    this.drawBody();
    this.container.addChild(this.statusBadge, this.nameLabel);
    this.updateStatus(agent.status);
  }

  get view(): Container {
    return this.container;
  }

  private drawBody() {
    const g = new Graphics();
    g.moveTo(0, -16).lineTo(14, 0).lineTo(0, 16).lineTo(-14, 0).lineTo(0, -16);
    g.fill({ color: 0x3b82f6 });
    this.container.addChildAt(g, 0);
  }

  updateStatus(status: Agent['status']): Graphics {
    this.statusBadge.clear();
    this.statusBadge.circle(0, -24, 5).fill({ color: STATUS_COLORS[status] ?? 0x94a3b8 });
    return this.statusBadge;
  }

  moveTo(x: number, y: number) {
    this.container.x = x;
    this.container.y = y;
  }
}
