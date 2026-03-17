import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '../agentStore';

describe('agentStore', () => {
  beforeEach(() => useAgentStore.getState().reset());

  it('adds agent to store', () => {
    useAgentStore.getState().upsertAgent({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    expect(useAgentStore.getState().agents['a1'].name).toBe('Bot');
  });

  it('updates agent status', () => {
    useAgentStore.getState().upsertAgent({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    useAgentStore.getState().setAgentStatus('a1', 'working');
    expect(useAgentStore.getState().agents['a1'].status).toBe('working');
  });

  it('reset clears agents', () => {
    useAgentStore.getState().upsertAgent({ id: 'a1', name: 'Bot', status: 'idle' } as any);
    useAgentStore.getState().reset();
    expect(Object.keys(useAgentStore.getState().agents).length).toBe(0);
  });
});
