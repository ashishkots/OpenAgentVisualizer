import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock canvas components — they require WebGL which isn't available in vitest
vi.mock('../../canvas/WorldCanvas', () => ({
  WorldCanvas: () => <div data-testid="world-canvas-2d" />,
}));
vi.mock('../../canvas/three/ThreeCanvas', () => ({
  ThreeCanvas: () => <div data-testid="world-canvas-25d" />,
}));
vi.mock('../../components/canvas/PixelStreamingEmbed', () => ({
  PixelStreamingEmbed: () => <div data-testid="pixel-streaming" />,
}));
vi.mock('../../hooks/useWorkspace', () => ({
  useWorkspace: () => ({ tier: 'free', workspaceId: 'ws-1' }),
}));

import { VirtualWorldPage } from '../VirtualWorldPage';

describe('VirtualWorldPage mode toggle', () => {
  it('renders 2D canvas by default', () => {
    render(<VirtualWorldPage />);
    expect(document.querySelector('[data-testid="world-canvas-2d"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="world-canvas-25d"]')).toBeNull();
  });

  it('switches to 2.5D when 2.5D button clicked', () => {
    render(<VirtualWorldPage />);
    const btn = screen.getByText('2.5D');
    fireEvent.click(btn);
    expect(document.querySelector('[data-testid="world-canvas-25d"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="world-canvas-2d"]')).toBeNull();
  });

  it('shows 3D button as locked for free tier (shows Pro badge)', () => {
    render(<VirtualWorldPage />);
    // The locked 3D button should show "Pro" badge
    expect(screen.getByText(/Pro/i)).toBeTruthy();
  });

  it('shows upgrade prompt when locked 3D button is clicked', () => {
    render(<VirtualWorldPage />);
    const btn = screen.getByTitle(/Upgrade to Pro/i);
    fireEvent.click(btn);
    expect(screen.getByText(/requires Pro or Enterprise/i)).toBeTruthy();
  });
});
