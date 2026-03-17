import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { WorldCanvas } from '../WorldCanvas';

// PixiJS doesn't run in jsdom — mock the Application
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    canvas: document.createElement('canvas'),
    stage: { addChild: vi.fn() },
    ticker: { add: vi.fn() },
    destroy: vi.fn(),
  })),
  Container: vi.fn(() => ({ addChild: vi.fn(), addChildAt: vi.fn(), x: 0, y: 0 })),
  Graphics: vi.fn(() => ({
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    circle: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
  })),
  Text: vi.fn(() => ({ text: '', x: 0, y: 0, width: 50 })),
}));

describe('WorldCanvas', () => {
  it('renders a container div', () => {
    const { container } = render(<WorldCanvas workspaceId="ws1" />);
    expect(container.querySelector('div')).toBeTruthy();
  });
});
