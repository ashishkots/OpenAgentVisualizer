import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';
import { useAgentStore } from '../../stores/agentStore';

// Mock machineManager to avoid XState in tests
vi.mock('../../machines/MachineManager', () => ({
  machineManager: {
    create: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    destroyAll: vi.fn(),
    dispatchWsEvent: vi.fn(),
    send: vi.fn(),
    syncToStatus: vi.fn(),
  },
}));

// Mock WebSocket
const mockWS = {
  send: vi.fn(),
  close: vi.fn(),
  onmessage: null as ((e: { data: string }) => void) | null,
  onopen: null as (() => void) | null,
  onerror: null as (() => void) | null,
  onclose: null as (() => void) | null,
  readyState: 1,
};

vi.stubGlobal('WebSocket', vi.fn(() => mockWS));

describe('useWebSocket (Sprint 2)', () => {
  beforeEach(() => {
    useAgentStore.getState().reset();
    vi.clearAllMocks();
    mockWS.onmessage = null;
    mockWS.onopen = null;
    mockWS.onclose = null;
    mockWS.onerror = null;
  });

  it('does not connect when workspaceId is null', () => {
    renderHook(() => useWebSocket(null));
    expect(vi.mocked(globalThis.WebSocket)).not.toHaveBeenCalled();
  });

  it('connects when workspaceId is provided', () => {
    renderHook(() => useWebSocket('ws1'));
    expect(vi.mocked(globalThis.WebSocket)).toHaveBeenCalledOnce();
  });

  it('dispatches agent status update to store on agent.state.changed event', () => {
    renderHook(() => useWebSocket('ws1'));
    useAgentStore.getState().upsertAgent({
      id: 'a1',
      workspace_id: 'ws1',
      name: 'Bot',
      role: 'assistant',
      framework: 'test',
      avatar_id: 'av1',
      status: 'idle',
      level: 1,
      xp_total: 0,
      total_tokens: 0,
      total_cost_usd: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    if (mockWS.onmessage) {
      mockWS.onmessage({
        data: JSON.stringify({
          event_type: 'agent.state.changed',
          agent_id: 'a1',
          status: 'active',
        }),
      });
    }
    expect(useAgentStore.getState().agents['a1']?.status).toBe('active');
  });

  it('does not crash on malformed JSON', () => {
    renderHook(() => useWebSocket('ws1'));
    expect(() => {
      if (mockWS.onmessage) {
        mockWS.onmessage({ data: 'not-json' });
      }
    }).not.toThrow();
  });

  it('returns subscribe and unsubscribe functions', () => {
    const { result } = renderHook(() => useWebSocket('ws1'));
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
  });

  it('sends correct subscribe message format (NC-002 fix)', () => {
    const { result } = renderHook(() => useWebSocket('ws1'));

    // Simulate WebSocket open
    if (mockWS.onopen) {
      mockWS.onopen();
    }

    // Test subscribe call
    result.current.subscribe('agent', 'agent123');

    // Check that the message uses the correct format: { action: 'subscribe', room: 'agent:agent123' }
    expect(mockWS.send).toHaveBeenCalledWith(
      JSON.stringify({ action: 'subscribe', room: 'agent:agent123' })
    );
  });

  it('sends correct unsubscribe message format (NC-002 fix)', () => {
    const { result } = renderHook(() => useWebSocket('ws1'));

    // Simulate WebSocket open
    if (mockWS.onopen) {
      mockWS.onopen();
    }

    // Test unsubscribe call
    result.current.unsubscribe('session', 'session456');

    // Check that the message uses the correct format: { action: 'unsubscribe', room: 'session:session456' }
    expect(mockWS.send).toHaveBeenCalledWith(
      JSON.stringify({ action: 'unsubscribe', room: 'session:session456' })
    );
  });
});
