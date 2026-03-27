import { describe, it, expect, vi } from 'vitest';
import { AgentSprite } from '../AgentSprite';
import type { Agent } from '../../../types/agent';

const mockGraphics = () => ({
  moveTo: vi.fn().mockReturnThis(),
  lineTo: vi.fn().mockReturnThis(),
  stroke: vi.fn().mockReturnThis(),
  fill: vi.fn().mockReturnThis(),
  circle: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  rect: vi.fn().mockReturnThis(),
  x: 0,
  y: 0,
});

vi.mock('pixi.js', () => ({
  Container: vi.fn(() => ({
    addChild: vi.fn(),
    addChildAt: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    removeAllListeners: vi.fn(),
    x: 0,
    y: 0,
    visible: true,
    interactive: false,
    cursor: 'default',
    scale: { set: vi.fn(), x: 1, y: 1 },
    on: vi.fn(),
    children: [],
  })),
  Text: vi.fn(() => ({
    text: '',
    x: 0,
    y: 0,
    width: 50,
    anchor: { set: vi.fn() },
    destroy: vi.fn(),
  })),
  Graphics: vi.fn(mockGraphics),
}));

const mockAgent: Agent = {
  id: 'a1',
  workspace_id: 'ws1',
  name: 'TestBot',
  role: 'assistant',
  framework: 'langchain',
  avatar_id: 'av1',
  status: 'idle',
  level: 1,
  xp_total: 0,
  total_tokens: 0,
  total_cost_usd: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('AgentSprite (Sprint 2 — pool pattern)', () => {
  it('starts with no agentId (pool pattern)', () => {
    const sprite = new AgentSprite();
    expect(sprite.agentId).toBeNull();
  });

  it('exposes view container', () => {
    const sprite = new AgentSprite();
    expect(sprite.view).toBeDefined();
  });

  it('bind() sets agentId', () => {
    const sprite = new AgentSprite();
    sprite.bind(mockAgent);
    expect(sprite.agentId).toBe('a1');
  });

  it('unbind() clears agentId', () => {
    const sprite = new AgentSprite();
    sprite.bind(mockAgent);
    sprite.unbind();
    expect(sprite.agentId).toBeNull();
  });

  it('dirty flag is set after bind', () => {
    const sprite = new AgentSprite();
    sprite.bind(mockAgent);
    expect(sprite.dirty).toBe(true);
  });

  it('dirty flag is cleared after render()', () => {
    const sprite = new AgentSprite();
    sprite.bind(mockAgent);
    sprite.render();
    expect(sprite.dirty).toBe(false);
  });

  it('update() sets dirty flag', () => {
    const sprite = new AgentSprite();
    sprite.bind(mockAgent);
    sprite.render(); // clear
    sprite.update({ ...mockAgent, status: 'active' });
    expect(sprite.dirty).toBe(true);
  });

  it('moveTo() sets position on view', () => {
    const sprite = new AgentSprite();
    sprite.moveTo(100, 200);
    expect(sprite.view.x).toBe(100);
    expect(sprite.view.y).toBe(200);
  });
});
