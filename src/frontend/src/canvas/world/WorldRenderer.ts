import { Container, type Application } from 'pixi.js';
import type { Agent } from '../../types/agent';
import { SpritePool } from '../agents/SpritePool';
import { CameraController } from '../camera/CameraController';
import { computeForceLayout, type LayoutNode } from '../layout/forceLayout';
import { IsoGrid } from './IsoGrid';
import { animateAgentMove, animateError, animateLevelUp, animateXPFloater } from '../animations/gsapAnimations';

/**
 * WorldRenderer — manages the full PixiJS scene graph.
 * Container hierarchy:
 *   stage -> worldContainer -> [gridLayer, connectionLayer, agentLayer, effectsLayer]
 *   stage -> uiLayer (HUD, not affected by pan/zoom)
 */
export class WorldRenderer {
  private app: Application;
  private worldContainer: Container;
  private gridLayer: Container;
  private connectionLayer: Container;
  private agentLayer: Container;
  private effectsLayer: Container;
  private uiLayer: Container;

  private spritePool: SpritePool;
  private camera: CameraController;
  private grid: IsoGrid;

  private layoutCache: Map<string, LayoutNode> = new Map();
  private cameraDirty = true;
  private agentClickHandler?: (agentId: string) => void;
  private agentDblClickHandler?: (agentId: string) => void;
  private agentLongPressHandler?: (agentId: string) => void;
  private _boundTick: () => void;

  constructor(app: Application) {
    this.app = app;

    // Build container hierarchy
    this.worldContainer = new Container();
    this.gridLayer = new Container();
    this.connectionLayer = new Container();
    this.agentLayer = new Container();
    this.effectsLayer = new Container();
    this.uiLayer = new Container();

    this.worldContainer.addChild(
      this.gridLayer,
      this.connectionLayer,
      this.agentLayer,
      this.effectsLayer,
    );
    this.app.stage.addChild(this.worldContainer, this.uiLayer);

    this.spritePool = new SpritePool(this.agentLayer);
    this.grid = new IsoGrid(20, 20);

    // Camera controller on the worldContainer
    this.camera = new CameraController(
      this.worldContainer,
      this.app.canvas as HTMLCanvasElement,
    );

    // Ticker — store bound reference so it can be removed in destroy()
    this._boundTick = this.tick.bind(this);
    this.app.ticker.add(this._boundTick);
  }

  init(): void {
    const w = this.app.screen.width ?? 800;
    const h = this.app.screen.height ?? 600;
    this.grid.draw(w / 2, h / 4);
    this.gridLayer.addChild(this.grid.view);

    // Center worldContainer
    this.worldContainer.x = w / 2;
    this.worldContainer.y = h / 2;
  }

  syncAgents(agents: Agent[]): void {
    if (agents.length === 0) {
      this.spritePool.sync([]);
      return;
    }

    const w = this.app.screen.width ?? 800;
    const h = this.app.screen.height ?? 600;

    // Compute layout for new agents only
    const newAgents = agents.filter((a) => !this.layoutCache.has(a.id));
    if (newAgents.length > 0) {
      const allLayouts = computeForceLayout(agents, w, h);
      for (const node of allLayouts) {
        if (!this.layoutCache.has(node.id)) {
          this.layoutCache.set(node.id, node);
        }
      }
    }

    this.spritePool.sync(agents);

    // Position sprites using cached layout
    for (const agent of agents) {
      const layout = this.layoutCache.get(agent.id);
      const sprite = this.spritePool.get(agent.id);
      if (sprite && layout) {
        // Use GSAP animation for smooth moves, direct set for initial placement
        if (sprite.view.x === 0 && sprite.view.y === 0) {
          sprite.moveTo(layout.x - w / 2, layout.y - h / 2);
        } else {
          animateAgentMove(sprite.view, layout.x - w / 2, layout.y - h / 2);
        }
      }
    }

    // Enable click handling
    for (const agent of agents) {
      const sprite = this.spritePool.get(agent.id);
      if (sprite) {
        sprite.view.eventMode = 'static';
        sprite.view.cursor = 'pointer';
        sprite.view.removeAllListeners();

        // Long-press state (500 ms threshold)
        let longPressTimer: ReturnType<typeof setTimeout> | null = null;
        let longPressTriggered = false;

        const clearLongPress = () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        };

        sprite.view.on('pointerdown', () => {
          longPressTriggered = false;
          clearLongPress();
          longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            longPressTimer = null;
            this.agentLongPressHandler?.(agent.id);
          }, 500);
        });

        sprite.view.on('pointermove', () => {
          // Cancel long-press if the pointer moves during hold
          clearLongPress();
        });

        sprite.view.on('pointerup', () => {
          clearLongPress();
        });

        sprite.view.on('pointercancel', () => {
          clearLongPress();
        });

        // Single tap / click — fire only if long-press did not trigger
        sprite.view.on('pointertap', () => {
          if (!longPressTriggered) {
            this.agentClickHandler?.(agent.id);
          }
        });

        // Double-tap detection
        let dblTapTimer: ReturnType<typeof setTimeout> | null = null;
        sprite.view.on('pointerdown', () => {
          if (dblTapTimer) {
            clearTimeout(dblTapTimer);
            dblTapTimer = null;
            this.agentDblClickHandler?.(agent.id);
          } else {
            dblTapTimer = setTimeout(() => { dblTapTimer = null; }, 300);
          }
        });
      }
    }

    this.cameraDirty = true;
  }

  onAgentClick(handler: (agentId: string) => void): void {
    this.agentClickHandler = handler;
  }

  onAgentDoubleClick(handler: (agentId: string) => void): void {
    this.agentDblClickHandler = handler;
  }

  /**
   * Registers a callback fired after a 500 ms long-press on an agent sprite.
   * Useful for showing context menus or agent detail navigation on touch devices.
   */
  onAgentLongPress(handler: (agentId: string) => void): void {
    this.agentLongPressHandler = handler;
  }

  triggerXPFloat(agentId: string, xp: number): void {
    const sprite = this.spritePool.get(agentId);
    if (!sprite) return;
    animateXPFloater(xp, sprite.view.x, sprite.view.y, this.effectsLayer);
  }

  triggerLevelUp(agentId: string, newLevel: number): void {
    const sprite = this.spritePool.get(agentId);
    if (!sprite) return;
    animateLevelUp(sprite.view, sprite.levelRing, newLevel, this.effectsLayer);
  }

  triggerError(agentId: string): void {
    const sprite = this.spritePool.get(agentId);
    if (!sprite) return;
    animateError(sprite.view);
  }

  private tick(): void {
    // 1. Cull offscreen sprites (only if camera moved)
    if (this.camera.dirty || this.cameraDirty) {
      this.cullOffscreen();
      this.camera.dirty = false;
      this.cameraDirty = false;
    }

    // 2. Update LOD based on current zoom level and visible sprite count
    this.updateLevelOfDetail();

    // 3. Update dirty sprites
    for (const sprite of this.spritePool.activeSprites()) {
      if (sprite.dirty) {
        sprite.render();
      }
    }
  }

  /**
   * Returns the number of currently visible (non-culled) sprites.
   */
  getVisibleSpriteCount(): number {
    let count = 0;
    for (const sprite of this.spritePool.activeSprites()) {
      if (sprite.view.visible) count++;
    }
    return count;
  }

  /**
   * Applies level-of-detail to all active sprites based on camera zoom and
   * visible sprite count.
   *
   * LOD levels:
   * - dot    (zoom < 0.2):                        scale 0.3, body only
   * - simple (zoom 0.2–0.5 OR >100 visible):      scale 0.6, circle only
   * - full   (zoom > 0.5 AND ≤100 visible):        scale 1.0, everything
   */
  private updateLevelOfDetail(): void {
    const zoom = this.camera.scale;
    const visibleCount = this.getVisibleSpriteCount();

    let lod: 'full' | 'simple' | 'dot';
    if (zoom < 0.2) {
      lod = 'dot';
    } else if (zoom <= 0.5 || visibleCount > 100) {
      lod = 'simple';
    } else {
      lod = 'full';
    }

    for (const sprite of this.spritePool.activeSprites()) {
      sprite.setLOD(lod);
    }
  }

  private cullOffscreen(): void {
    const w = this.app.screen.width ?? 800;
    const h = this.app.screen.height ?? 600;
    const bounds = this.camera.getViewportBounds(w, h);
    const margin = 100; // px margin to avoid pop-in

    for (const sprite of this.spritePool.activeSprites()) {
      const sx = sprite.view.x;
      const sy = sprite.view.y;
      sprite.view.visible =
        sx >= bounds.left - margin &&
        sx <= bounds.right + margin &&
        sy >= bounds.top - margin &&
        sy <= bounds.bottom + margin;
    }
  }

  destroy(): void {
    this.spritePool.releaseAll();
    this.camera.destroy();
    this.app.ticker.remove(this._boundTick);
  }
}
