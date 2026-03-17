import { describe, it, expect, vi } from 'vitest';
import { AgentSprite } from '../AgentSprite';

vi.mock('pixi.js', () => ({
  Container: vi.fn(() => ({
    addChild: vi.fn(),
    addChildAt: vi.fn(),
    x: 0,
    y: 0,
    visible: true,
  })),
  Text: vi.fn(() => ({ text: '', x: 0, y: 0, width: 50 })),
  Graphics: vi.fn(() => ({
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    circle: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
  })),
}));

describe('AgentSprite', () => {
  it('creates sprite with correct agent ID', () => {
    const sprite = new AgentSprite({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    expect(sprite.agentId).toBe('a1');
  });

  it('updateStatus returns the badge Graphics', () => {
    const sprite = new AgentSprite({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    const badge = sprite.updateStatus('working');
    expect(badge).toBeDefined();
  });

  it('exposes view container', () => {
    const sprite = new AgentSprite({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    expect(sprite.view).toBeDefined();
  });
});
