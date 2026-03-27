import { createActor } from 'xstate';
import {
  agentMachine,
  type AgentMachineEvent,
  type AgentState,
  wsEventToFsmEvent,
  statusToFsmEvent,
} from './agentMachine';
import { useAgentStore } from '../stores/agentStore';

export type StateChangeCallback = (
  agentId: string,
  from: AgentState,
  to: AgentState,
) => void;

/**
 * MachineManager — singleton that owns all XState actor instances (ADR-002).
 * Lives outside React. The Zustand agentStore holds serialized state values.
 * The canvas reads from the store; WebSocket events feed transitions here.
 */
export class MachineManager {
  private actors: Map<string, ReturnType<typeof createActor<typeof agentMachine>>> = new Map();
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();
  private onStateChange: StateChangeCallback | null;

  constructor(onStateChange?: StateChangeCallback) {
    this.onStateChange = onStateChange ?? null;
  }

  /** Create and start a machine for an agent. Idempotent. */
  create(agentId: string, initialStatus?: AgentState): void {
    if (this.actors.has(agentId)) return;

    const actor = createActor(agentMachine, {
      input: { agentId },
    });

    const sub = actor.subscribe((snapshot) => {
      const stateValue = snapshot.value as AgentState;
      useAgentStore.getState().setAgentStatus(agentId, stateValue);
    });

    this.actors.set(agentId, actor);
    this.subscriptions.set(agentId, sub);
    actor.start();

    // Sync to initial status if not idle
    if (initialStatus && initialStatus !== 'idle') {
      this.syncToStatus(agentId, initialStatus);
    }
  }

  /** Force-sync machine state to match a status string (e.g. from initial API load). */
  syncToStatus(agentId: string, status: string): void {
    const actor = this.actors.get(agentId);
    if (!actor) return;
    const current = actor.getSnapshot().value as AgentState;
    if (current === status) return;
    const event = statusToFsmEvent(status);
    this.send(agentId, event);
  }

  /** Send a typed FSM event to a specific agent's machine. */
  send(agentId: string, event: AgentMachineEvent): void {
    const actor = this.actors.get(agentId);
    if (!actor) return;
    const prevState = actor.getSnapshot().value as AgentState;
    actor.send(event);
    const newState = actor.getSnapshot().value as AgentState;
    if (prevState !== newState && this.onStateChange) {
      this.onStateChange(agentId, prevState, newState);
    }
  }

  /**
   * Dispatch a raw WebSocket event to the correct machine.
   * Looks up agentId from event, maps event_type to FSM event.
   */
  dispatchWsEvent(wsEvent: Record<string, unknown>): void {
    const agentId = wsEvent.agent_id as string | undefined;
    const eventType = wsEvent.event_type as string | undefined;
    if (!agentId || !eventType) return;

    // Ensure machine exists
    if (!this.actors.has(agentId)) {
      this.create(agentId);
    }

    // Map status_change events directly
    if (eventType === 'agent.state.changed' && wsEvent.status) {
      this.syncToStatus(agentId, wsEvent.status as string);
      return;
    }

    const fsmEvent = wsEventToFsmEvent(eventType, wsEvent);
    if (fsmEvent) {
      this.send(agentId, fsmEvent);
    }
  }

  /** Get current state for an agent. */
  getState(agentId: string): AgentState | null {
    const actor = this.actors.get(agentId);
    if (!actor) return null;
    return actor.getSnapshot().value as AgentState;
  }

  /** Stop and clean up a single agent machine. */
  destroy(agentId: string): void {
    this.subscriptions.get(agentId)?.unsubscribe();
    this.subscriptions.delete(agentId);
    this.actors.get(agentId)?.stop();
    this.actors.delete(agentId);
  }

  /** Stop all machines. Called on WorldCanvas unmount. */
  destroyAll(): void {
    for (const id of [...this.actors.keys()]) {
      this.destroy(id);
    }
  }

  /** Return all active agent IDs. */
  getActiveAgentIds(): string[] {
    return [...this.actors.keys()];
  }

  /** Check if a machine exists for an agent. */
  has(agentId: string): boolean {
    return this.actors.has(agentId);
  }
}

// Module-level singleton instance
export const machineManager = new MachineManager();
