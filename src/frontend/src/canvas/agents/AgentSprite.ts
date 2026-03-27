import { Container, Graphics, Text } from 'pixi.js';
import type { Agent } from '../../types/agent';
import {
  FSM_STATE_PIXI_COLORS,
  LEVEL_RING_PIXI_COLORS,
  PIXI_COLORS,
} from '../../lib/colorTokens';
import { xpProgress } from '../../lib/xpLevels';

/**
 * AgentSprite — full visual representation of an agent in the PixiJS canvas.
 * Uses dirty-flag pattern: only redraws when state changes.
 * Supports pool pattern: bind() to configure, unbind() to reset.
 *
 * Layer stack (bottom to top):
 * 0. body (diamond shape)
 * 1. levelRing (colored arc)
 * 2. statusDot (5px circle)
 * 3. xpBar (progress bar below avatar)
 * 4. nameLabel (text below)
 * 5. levelLabel ("Lv N")
 * 6. badgeRow (up to 3 achievement badges)
 * 7. particleContainer (GSAP effects)
 */
export class AgentSprite {
  readonly view: Container;
  readonly body: Graphics;
  readonly levelRing: Graphics;
  readonly statusDot: Graphics;
  readonly xpBar: Graphics;
  readonly nameLabel: Text;
  readonly levelLabel: Text;
  readonly badgeRow: Container;
  readonly particleContainer: Container;

  private _agentId: string | null = null;
  private _dirty = false;
  private _level = 1;
  private _status = 'idle';

  constructor() {
    this.view = new Container();
    this.body = new Graphics();
    this.levelRing = new Graphics();
    this.statusDot = new Graphics();
    this.xpBar = new Graphics();
    this.nameLabel = new Text({
      text: '',
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        fontWeight: '600',
        fill: PIXI_COLORS.text,
        align: 'center',
      },
    });
    this.levelLabel = new Text({
      text: '',
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 10,
        fontWeight: '500',
        fill: PIXI_COLORS.muted,
        align: 'center',
      },
    });
    this.badgeRow = new Container();
    this.particleContainer = new Container();

    this.view.addChild(
      this.body,
      this.levelRing,
      this.statusDot,
      this.xpBar,
      this.nameLabel,
      this.levelLabel,
      this.badgeRow,
      this.particleContainer,
    );
  }

  get agentId(): string | null { return this._agentId; }
  get dirty(): boolean { return this._dirty; }
  get level(): number { return this._level; }

  /** Configure sprite for a specific agent. Called on pool acquire. */
  bind(agent: Agent): void {
    this._agentId = agent.id;
    this._level = agent.level;
    this._status = agent.status;
    this.nameLabel.text = agent.name;
    this.nameLabel.anchor.set(0.5);
    this.nameLabel.y = 28;
    this.levelLabel.text = `Lv ${agent.level}`;
    this.levelLabel.anchor.set(0.5);
    this.levelLabel.y = 40;
    this.drawBody();
    this.drawLevelRing(agent.level);
    this.drawStatusDot(agent.status);
    this.drawXPBar(agent.xp_total, agent.level);
    this._dirty = true;
  }

  /** Reset sprite to neutral state. Called on pool release. */
  unbind(): void {
    this._agentId = null;
    this._level = 1;
    this._status = 'idle';
    this.body.clear();
    this.levelRing.clear();
    this.statusDot.clear();
    this.xpBar.clear();
    this.badgeRow.removeChildren();
    this.particleContainer.removeChildren();
    this.nameLabel.text = '';
    this.levelLabel.text = '';
    this._dirty = false;
  }

  /** Update partial state (called on WebSocket events). */
  update(agent: Agent): void {
    if (this._status !== agent.status) {
      this._status = agent.status;
      this.drawStatusDot(agent.status);
    }
    if (this._level !== agent.level) {
      this._level = agent.level;
      this.drawLevelRing(agent.level);
      this.levelLabel.text = `Lv ${agent.level}`;
    }
    this.drawXPBar(agent.xp_total, agent.level);
    this._dirty = true;
  }

  /** Called by renderer tick — resets dirty flag. */
  render(): void {
    this._dirty = false;
  }

  moveTo(x: number, y: number): void {
    this.view.x = x;
    this.view.y = y;
  }

  /**
   * Set level-of-detail for this sprite.
   *
   * - 'full': all elements visible, scale 1.0 (default, close zoom)
   * - 'simple': body + levelRing + statusDot only, scale 0.6 (medium zoom or >100 visible)
   * - 'dot': body only, scale 0.3 (far zoom < 0.2)
   */
  setLOD(level: 'full' | 'simple' | 'dot'): void {
    switch (level) {
      case 'dot':
        this.nameLabel.visible = false;
        this.levelLabel.visible = false;
        this.levelRing.visible = false;
        this.statusDot.visible = false;
        this.xpBar.visible = false;
        this.badgeRow.visible = false;
        this.view.scale.set(0.3);
        break;
      case 'simple':
        this.nameLabel.visible = false;
        this.levelLabel.visible = false;
        this.levelRing.visible = true;
        this.statusDot.visible = true;
        this.xpBar.visible = false;
        this.badgeRow.visible = false;
        this.view.scale.set(0.6);
        break;
      case 'full':
      default:
        this.nameLabel.visible = true;
        this.levelLabel.visible = true;
        this.levelRing.visible = true;
        this.statusDot.visible = true;
        this.xpBar.visible = true;
        this.badgeRow.visible = true;
        this.view.scale.set(1.0);
        break;
    }
  }

  private drawBody(): void {
    this.body.clear();
    // Diamond shape (isometric agent avatar)
    this.body
      .moveTo(0, -16)
      .lineTo(14, 0)
      .lineTo(0, 16)
      .lineTo(-14, 0)
      .lineTo(0, -16)
      .fill({ color: 0x3b82f6, alpha: 0.9 });
  }

  private drawLevelRing(level: number): void {
    const color = LEVEL_RING_PIXI_COLORS[level] ?? PIXI_COLORS.muted;
    const thickness = level <= 2 ? 1 : level <= 4 ? 2 : 3;
    this.levelRing.clear();
    this.levelRing
      .circle(0, 0, 18)
      .stroke({ color, width: thickness });

    // Glow effect for levels 8+
    if (level >= 8) {
      const glowAlpha = level === 8 ? 0.3 : level === 9 ? 0.4 : 0.5;
      this.levelRing
        .circle(0, 0, 22)
        .stroke({ color, width: 1, alpha: glowAlpha });
    }
  }

  private drawStatusDot(status: string): void {
    const color = FSM_STATE_PIXI_COLORS[status] ?? PIXI_COLORS.muted;
    this.statusDot.clear();
    this.statusDot
      .circle(10, -14, 5)
      .fill({ color });
  }

  private drawXPBar(xpTotal: number, level: number): void {
    const { progress } = xpProgress(xpTotal);
    const barWidth = 28;
    const barHeight = 3;
    const barX = -barWidth / 2;
    const barY = 18;

    this.xpBar.clear();
    // Track
    this.xpBar
      .rect(barX, barY, barWidth, barHeight)
      .fill({ color: PIXI_COLORS.bg });
    // Fill
    const fillColor = level >= 5 ? PIXI_COLORS.gold : PIXI_COLORS.xp;
    const fillWidth = Math.max(0, Math.min(1, progress)) * barWidth;
    if (fillWidth > 0) {
      this.xpBar
        .rect(barX, barY, fillWidth, barHeight)
        .fill({ color: fillColor });
    }
  }
}
