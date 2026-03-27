import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MachineManager } from '../MachineManager';

// Mock agentStore to avoid Zustand initialization issues in test env
vi.mock('../../stores/agentStore', () => ({
  useAgentStore: {
    getState: () => ({
      setAgentStatus: vi.fn(),
    }),
  },
}));

describe('MachineManager', () => {
  let manager: MachineManager;
  const stateChanges: Array<{ agentId: string; from: string; to: string }> = [];

  beforeEach(() => {
    stateChanges.length = 0;
    manager = new MachineManager((agentId, from, to) => {
      stateChanges.push({ agentId, from, to });
    });
  });

  it('creates machine for agent', () => {
    manager.create('agent-1');
    expect(manager.has('agent-1')).toBe(true);
  });

  it('is idempotent — does not create duplicate', () => {
    manager.create('agent-1');
    manager.create('agent-1');
    expect(manager.has('agent-1')).toBe(true);
    expect(manager.getActiveAgentIds()).toHaveLength(1);
  });

  it('starts in idle state', () => {
    manager.create('agent-1');
    expect(manager.getState('agent-1')).toBe('idle');
  });

  it('transitions on ACTIVATE event', () => {
    manager.create('agent-1');
    manager.send('agent-1', { type: 'ACTIVATE' });
    expect(manager.getState('agent-1')).toBe('active');
  });

  it('calls onStateChange on transition', () => {
    manager.create('agent-1');
    manager.send('agent-1', { type: 'ACTIVATE' });
    expect(stateChanges).toHaveLength(1);
    expect(stateChanges[0]).toEqual({ agentId: 'agent-1', from: 'idle', to: 'active' });
  });

  it('destroys a machine', () => {
    manager.create('agent-1');
    manager.destroy('agent-1');
    expect(manager.has('agent-1')).toBe(false);
  });

  it('destroyAll clears all machines', () => {
    manager.create('agent-1');
    manager.create('agent-2');
    manager.destroyAll();
    expect(manager.getActiveAgentIds()).toHaveLength(0);
  });

  it('syncToStatus transitions machine to target state', () => {
    manager.create('agent-1');
    manager.syncToStatus('agent-1', 'active');
    expect(manager.getState('agent-1')).toBe('active');
  });

  it('returns null for getState on unknown agent', () => {
    expect(manager.getState('nonexistent')).toBeNull();
  });

  it('does not throw when sending to unknown agent', () => {
    expect(() => manager.send('unknown', { type: 'ACTIVATE' })).not.toThrow();
  });
});
