import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorldCanvas } from '../WorldCanvas';

// PixiJS doesn't run in jsdom — mock the Application
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    canvas: document.createElement('canvas'),
    stage: {
      addChild: vi.fn(),
      children: [],
    },
    screen: { width: 800, height: 600 },
    ticker: { add: vi.fn(), remove: vi.fn() },
    destroy: vi.fn(),
  })),
  Container: vi.fn(() => ({
    addChild: vi.fn(),
    addChildAt: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    removeAllListeners: vi.fn(),
    children: [],
    x: 0,
    y: 0,
    scale: { set: vi.fn(), x: 1, y: 1 },
    interactive: false,
    cursor: 'default',
    on: vi.fn(),
    visible: true,
  })),
  Graphics: vi.fn(() => ({
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    circle: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    x: 0,
    y: 0,
  })),
  Text: vi.fn(() => ({
    text: '',
    x: 0,
    y: 0,
    width: 50,
    anchor: { set: vi.fn() },
    destroy: vi.fn(),
  })),
}));

// Mock MachineManager
vi.mock('../machines/MachineManager', () => ({
  MachineManager: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    destroyAll: vi.fn(),
    dispatchWsEvent: vi.fn(),
  })),
  machineManager: {
    create: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    destroyAll: vi.fn(),
    dispatchWsEvent: vi.fn(),
  },
}));

describe('WorldCanvas', () => {
  it('renders a container div', () => {
    const { container } = render(
      <MemoryRouter>
        <WorldCanvas workspaceId="ws1" />
      </MemoryRouter>
    );
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('sets data-workspace attribute', () => {
    const { container } = render(
      <MemoryRouter>
        <WorldCanvas workspaceId="test-workspace" />
      </MemoryRouter>
    );
    const div = container.querySelector('[data-workspace]');
    expect(div).toBeTruthy();
    expect(div?.getAttribute('data-workspace')).toBe('test-workspace');
  });

  it('has accessible role and label', () => {
    const { getByRole } = render(
      <MemoryRouter>
        <WorldCanvas workspaceId="ws1" />
      </MemoryRouter>
    );
    expect(getByRole('img')).toBeInTheDocument();
  });
});
