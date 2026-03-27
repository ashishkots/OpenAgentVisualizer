import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { agentMachine } from '../agentMachine';

// Sprint 2: 5-state FSM — idle | active | waiting | error | complete
describe('agentMachine (Sprint 2)', () => {
  const makeActor = () =>
    createActor(agentMachine, { input: { agentId: 'test-agent' } }).start();

  it('starts in idle state', () => {
    const actor = makeActor();
    expect(actor.getSnapshot().value).toBe('idle');
    actor.stop();
  });

  it('transitions idle → active on ACTIVATE', () => {
    const actor = makeActor();
    actor.send({ type: 'ACTIVATE', taskId: 't1' });
    expect(actor.getSnapshot().value).toBe('active');
    actor.stop();
  });

  it('transitions idle → error on ERROR', () => {
    const actor = makeActor();
    actor.send({ type: 'ERROR', message: 'timeout' });
    expect(actor.getSnapshot().value).toBe('error');
    actor.stop();
  });

  it('transitions active → waiting on WAIT', () => {
    const actor = makeActor();
    actor.send({ type: 'ACTIVATE' });
    actor.send({ type: 'WAIT' });
    expect(actor.getSnapshot().value).toBe('waiting');
    actor.stop();
  });

  it('transitions active → complete on COMPLETE', () => {
    const actor = makeActor();
    actor.send({ type: 'ACTIVATE' });
    actor.send({ type: 'COMPLETE' });
    expect(actor.getSnapshot().value).toBe('complete');
    actor.stop();
  });

  it('transitions active → error on ERROR', () => {
    const actor = makeActor();
    actor.send({ type: 'ACTIVATE' });
    actor.send({ type: 'ERROR', message: 'fail' });
    expect(actor.getSnapshot().value).toBe('error');
    actor.stop();
  });

  it('transitions waiting → active on RESUME', () => {
    const actor = makeActor();
    actor.send({ type: 'ACTIVATE' });
    actor.send({ type: 'WAIT' });
    actor.send({ type: 'RESUME' });
    expect(actor.getSnapshot().value).toBe('active');
    actor.stop();
  });

  it('transitions error → active on RECOVER', () => {
    const actor = makeActor();
    actor.send({ type: 'ERROR', message: 'fail' });
    actor.send({ type: 'RECOVER' });
    expect(actor.getSnapshot().value).toBe('active');
    actor.stop();
  });

  it('transitions error → idle on RESET', () => {
    const actor = makeActor();
    actor.send({ type: 'ERROR', message: 'fail' });
    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().value).toBe('idle');
    actor.stop();
  });

  it('transitions complete → idle on RESET', () => {
    const actor = makeActor();
    actor.send({ type: 'ACTIVATE' });
    actor.send({ type: 'COMPLETE' });
    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().value).toBe('idle');
    actor.stop();
  });

  it('transitions complete → active on ACTIVATE', () => {
    const actor = makeActor();
    actor.send({ type: 'ACTIVATE' });
    actor.send({ type: 'COMPLETE' });
    actor.send({ type: 'ACTIVATE', taskId: 't2' });
    expect(actor.getSnapshot().value).toBe('active');
    actor.stop();
  });

  it('stores agentId in context', () => {
    const actor = makeActor();
    expect(actor.getSnapshot().context.agentId).toBe('test-agent');
    actor.stop();
  });
});
