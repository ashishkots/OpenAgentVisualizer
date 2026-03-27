import type { Container } from 'pixi.js';
import type { Agent } from '../../types/agent';
import { AgentSprite } from './AgentSprite';
import { killSpriteTweens } from '../animations/gsapAnimations';

/**
 * SpritePool — manages creation and recycling of AgentSprite instances.
 * Avoids GC pressure from repeated Graphics/Text construction.
 * Pool capacity: 600 max (scaled for 500-agent workspace per Sprint 4 spec).
 */
export class SpritePool {
  private pool: AgentSprite[] = [];
  private active: Map<string, AgentSprite> = new Map();
  private readonly agentLayer: Container;
  private readonly MAX_POOL_SIZE = 600;

  constructor(agentLayer: Container) {
    this.agentLayer = agentLayer;
  }

  /** Acquire a sprite for an agent. Reuses from pool or creates new. */
  acquire(agent: Agent): AgentSprite {
    let sprite = this.pool.pop();
    if (!sprite) {
      sprite = new AgentSprite();
    }
    sprite.bind(agent);
    this.active.set(agent.id, sprite);
    this.agentLayer.addChild(sprite.view);
    return sprite;
  }

  /** Release a sprite back to the pool. */
  release(agentId: string): void {
    const sprite = this.active.get(agentId);
    if (!sprite) return;
    killSpriteTweens(sprite.view);
    this.agentLayer.removeChild(sprite.view);
    sprite.unbind();
    this.active.delete(agentId);
    if (this.pool.length < this.MAX_POOL_SIZE) {
      this.pool.push(sprite);
    } else {
      sprite.view.destroy();
    }
  }

  /** Get active sprite for agent. */
  get(agentId: string): AgentSprite | undefined {
    return this.active.get(agentId);
  }

  /** Sync pool with current agent list. */
  sync(agents: Agent[]): void {
    const incoming = new Set(agents.map((a) => a.id));

    // Release sprites for removed agents
    for (const id of [...this.active.keys()]) {
      if (!incoming.has(id)) {
        this.release(id);
      }
    }

    // Acquire or update sprites for current agents
    for (const agent of agents) {
      const existing = this.active.get(agent.id);
      if (existing) {
        existing.update(agent);
      } else {
        this.acquire(agent);
      }
    }
  }

  /** Iterate active sprites for dirty-flag rendering. */
  activeSprites(): IterableIterator<AgentSprite> {
    return this.active.values();
  }

  /** Release all sprites. */
  releaseAll(): void {
    for (const id of [...this.active.keys()]) {
      this.release(id);
    }
  }

  get activeCount(): number {
    return this.active.size;
  }
}
