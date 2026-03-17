import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock agentStore
vi.mock('../../../stores/agentStore', () => ({
  useAgentStore: vi.fn((selector: (s: any) => any) => selector({ agents: {} })),
}));

import { PixelStreamingEmbed } from '../PixelStreamingEmbed';

describe('PixelStreamingEmbed', () => {
  it('renders fallback with setup instruction when no signallingUrl provided', () => {
    render(<PixelStreamingEmbed signallingUrl="" workspaceId="ws-1" />);
    // Must show docker compose command
    expect(screen.getByText(/docker compose.*--profile pro/i)).toBeTruthy();
  });

  it('renders iframe container when signallingUrl is provided', () => {
    const { container } = render(<PixelStreamingEmbed signallingUrl="ws://localhost:8888" workspaceId="ws-1" />);
    const psContainer = container.querySelector('[data-ps-container]');
    expect(psContainer).toBeTruthy();
  });
});

import { PixelStreamingBridge } from '../PixelStreamingBridge';

describe('PixelStreamingBridge', () => {
  it('encodeAgentState returns valid JSON with correct shape', () => {
    const bridge = new PixelStreamingBridge();
    const state = { id: 'a1', name: 'Agent', status: 'working', xp: 100, position: { x: 2, y: 3 } };
    const json = bridge.encodeAgentState(state as any);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('agent_update');
    expect(parsed.agent_id).toBe('a1');
    expect(parsed.status).toBe('working');
  });

  it('encodeEvent returns valid JSON with correct shape', () => {
    const bridge = new PixelStreamingBridge();
    const json = bridge.encodeEvent('level_up', 'a1', { xp: 500 });
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('level_up');
    expect(parsed.agent_id).toBe('a1');
  });
});
