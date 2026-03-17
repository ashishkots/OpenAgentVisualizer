import { Container, Graphics } from 'pixi.js';
import { worldToScreen } from '../../lib/isoMath';

const ISO_OPTS = { tileW: 64, tileH: 32, originX: 0, originY: 0 };

export class IsoGrid {
  private container: Container;
  private cols: number;
  private rows: number;

  constructor(cols = 20, rows = 20) {
    this.container = new Container();
    this.cols = cols;
    this.rows = rows;
  }

  get view() {
    return this.container;
  }

  draw(centerX: number, centerY: number) {
    const opts = { ...ISO_OPTS, originX: centerX, originY: centerY };
    const g = new Graphics();
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const { x: sx, y: sy } = worldToScreen(x, y, opts);
        this.drawTile(g, sx, sy, opts.tileW, opts.tileH);
      }
    }
    this.container.addChild(g);
  }

  private drawTile(g: Graphics, sx: number, sy: number, tw: number, th: number) {
    const hw = tw / 2;
    const hh = th / 2;
    g.moveTo(sx, sy - hh);
    g.lineTo(sx + hw, sy);
    g.lineTo(sx, sy + hh);
    g.lineTo(sx - hw, sy);
    g.lineTo(sx, sy - hh);
    g.stroke({ color: 0x2d3748, width: 1, alpha: 0.5 });
    g.fill({ color: 0x1e2433, alpha: 0.8 });
  }
}
