import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '../agentStore';
import type { Agent } from '../../types/agent';

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

describe('agentStore (Sprint 2)', () => {
  beforeEach(() => useAgentStore.getState().reset());

  it('adds agent to store', () => {
    useAgentStore.getState().upsertAgent(mockAgent);
    expect(useAgentStore.getState().agents['a1'].name).toBe('TestBot');
  });

  it('updates agent status with Sprint 2 statuses', () => {
    useAgentStore.getState().upsertAgent(mockAgent);
    useAgentStore.getState().setAgentStatus('a1', 'active');
    expect(useAgentStore.getState().agents['a1'].status).toBe('active');

    useAgentStore.getState().setAgentStatus('a1', 'waiting');
    expect(useAgentStore.getState().agents['a1'].status).toBe('waiting');

    useAgentStore.getState().setAgentStatus('a1', 'complete');
    expect(useAgentStore.getState().agents['a1'].status).toBe('complete');
  });

  it('does not crash when setting status for non-existent agent', () => {
    expect(() => useAgentStore.getState().setAgentStatus('nonexistent', 'active')).not.toThrow();
  });

  it('reset clears all state', () => {
    useAgentStore.getState().upsertAgent(mockAgent);
    useAgentStore.getState().setSelectedAgent('a1');
    useAgentStore.getState().reset();
    expect(Object.keys(useAgentStore.getState().agents).length).toBe(0);
    expect(useAgentStore.getState().selectedAgentId).toBeNull();
  });

  it('getFilteredAgents returns all agents when filter is all', () => {
    useAgentStore.getState().upsertAgent(mockAgent);
    useAgentStore.getState().upsertAgent({ ...mockAgent, id: 'a2', status: 'active' });
    const filtered = useAgentStore.getState().getFilteredAgents();
    expect(filtered).toHaveLength(2);
  });

  it('getFilteredAgents filters by status', () => {
    useAgentStore.getState().upsertAgent(mockAgent);
    useAgentStore.getState().upsertAgent({ ...mockAgent, id: 'a2', status: 'active' });
    useAgentStore.getState().setFilterStatus('active');
    const filtered = useAgentStore.getState().getFilteredAgents();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('a2');
  });
});
