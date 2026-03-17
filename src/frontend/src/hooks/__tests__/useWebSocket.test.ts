import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';
import { useAgentStore } from '../../stores/agentStore';

// Mock WebSocket
const mockWS = {
  send: vi.fn(),
  close: vi.fn(),
  onmessage: null as any,
  onopen: null as any,
  onerror: null as any,
  onclose: null as any,
  readyState: 1,
};

vi.stubGlobal('WebSocket', vi.fn(() => mockWS));

describe('useWebSocket', () => {
  beforeEach(() => {
    useAgentStore.getState().reset();
    vi.clearAllMocks();
    mockWS.onmessage = null;
    mockWS.onclose = null;
    mockWS.onerror = null;
  });

  it('dispatches agent status update to store on live event', () => {
    renderHook(() => useWebSocket('ws1'));
    // Simulate message from server
    if (mockWS.onmessage) {
      mockWS.onmessage({ data: JSON.stringify({ event_type: 'agent.state.changed', agent_id: 'a1', status: 'working' }) });
    }
    // Note: status only updates if agent already exists in store — seed first
    useAgentStore.getState().upsertAgent({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    if (mockWS.onmessage) {
      mockWS.onmessage({ data: JSON.stringify({ event_type: 'agent.state.changed', agent_id: 'a1', status: 'working' }) });
    }
    expect(useAgentStore.getState().agents['a1']?.status).toBe('working');
  });

  it('does not crash on malformed JSON', () => {
    renderHook(() => useWebSocket('ws1'));
    expect(() => {
      if (mockWS.onmessage) {
        mockWS.onmessage({ data: 'not-json' });
      }
    }).not.toThrow();
  });

  it('does not connect when workspaceId is null', () => {
    renderHook(() => useWebSocket(null));
    expect(global.WebSocket).not.toHaveBeenCalled();
  });
});
