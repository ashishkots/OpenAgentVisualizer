import { Container, Graphics } from 'pixi.js';
import { xpProgress } from '../../lib/xpLevels';

const BAR_WIDTH = 32;
const BAR_HEIGHT = 3;

export class AgentXPBar {
  private container: Container;
  private bg: Graphics;
  private fill: Graphics;

  constructor() {
    this.container = new Container();
    this.bg = new Graphics();
    this.fill = new Graphics();
    this.bg.rect(-BAR_WIDTH / 2, 20, BAR_WIDTH, BAR_HEIGHT).fill({ color: 0x2d3748 });
    this.container.addChild(this.bg, this.fill);
  }

  get view(): Container {
    return this.container;
  }

  update(xpTotal: number) {
    const { progress, color } = xpProgress(xpTotal);
    this.fill.clear();
    const fillWidth = Math.max(1, BAR_WIDTH * progress);
    this.fill.rect(-BAR_WIDTH / 2, 20, fillWidth, BAR_HEIGHT).fill({ color: parseInt(color.slice(1), 16) });
  }
}
