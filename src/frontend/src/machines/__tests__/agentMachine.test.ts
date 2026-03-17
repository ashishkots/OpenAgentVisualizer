import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { agentMachine } from '../agentMachine';

describe('agentMachine', () => {
  it('starts in idle state', () => {
    const actor = createActor(agentMachine).start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('transitions idle → working on TASK_START', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'TASK_START', taskId: 't1' });
    expect(actor.getSnapshot().value).toBe('working');
  });

  it('transitions working → thinking on LLM_CALL', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'TASK_START', taskId: 't1' });
    actor.send({ type: 'LLM_CALL' });
    expect(actor.getSnapshot().value).toBe('thinking');
  });

  it('transitions working → error on ERROR', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'TASK_START', taskId: 't1' });
    actor.send({ type: 'ERROR', message: 'timeout' });
    expect(actor.getSnapshot().value).toBe('error');
  });

  it('transitions error → idle on RESET', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'ERROR', message: 'fail' });
    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('transitions working → communicating on AGENT_HANDOFF', () => {
    const actor = createActor(agentMachine).start();
    actor.send({ type: 'TASK_START', taskId: 't1' });
    actor.send({ type: 'AGENT_HANDOFF', targetAgentId: 'a2' });
    expect(actor.getSnapshot().value).toBe('communicating');
  });
});
