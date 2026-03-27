import { setup, assign, type ActorRefFrom } from 'xstate';

// Sprint 2: 5-state FSM matching backend agent.status field
export type AgentState = 'idle' | 'active' | 'waiting' | 'error' | 'complete';

export interface AgentMachineContext {
  agentId: string;
  currentTaskId: string | null;
  errorMessage: string | null;
  previousState: AgentState | null;
}

export type AgentMachineEvent =
  | { type: 'ACTIVATE'; taskId?: string }
  | { type: 'WAIT' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE' }
  | { type: 'ERROR'; message: string }
  | { type: 'RECOVER' }
  | { type: 'RESET' };

export const agentMachine = setup({
  types: {
    context: {} as AgentMachineContext,
    events: {} as AgentMachineEvent,
    input: {} as { agentId: string },
  },
  actions: {
    notifyStateChange: () => {
      // Side effect notifications are handled by MachineManager subscription
    },
    setPreviousState: assign({
      previousState: (_, params: { state: AgentState }) => params.state,
    }),
  },
}).createMachine({
  id: 'agent',
  initial: 'idle',
  context: ({ input }) => ({
    agentId: input.agentId,
    currentTaskId: null,
    errorMessage: null,
    previousState: null,
  }),
  states: {
    idle: {
      entry: ['notifyStateChange'],
      on: {
        ACTIVATE: {
          target: 'active',
          actions: assign({
            currentTaskId: ({ event }) => event.taskId ?? null,
            previousState: () => 'idle' as AgentState,
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorMessage: ({ event }) => event.message,
            previousState: () => 'idle' as AgentState,
          }),
        },
      },
    },
    active: {
      entry: ['notifyStateChange'],
      on: {
        WAIT: {
          target: 'waiting',
          actions: assign({ previousState: () => 'active' as AgentState }),
        },
        COMPLETE: {
          target: 'complete',
          actions: assign({
            currentTaskId: () => null,
            previousState: () => 'active' as AgentState,
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorMessage: ({ event }) => event.message,
            previousState: () => 'active' as AgentState,
          }),
        },
      },
    },
    waiting: {
      entry: ['notifyStateChange'],
      on: {
        RESUME: {
          target: 'active',
          actions: assign({ previousState: () => 'waiting' as AgentState }),
        },
        COMPLETE: {
          target: 'complete',
          actions: assign({
            currentTaskId: () => null,
            previousState: () => 'waiting' as AgentState,
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorMessage: ({ event }) => event.message,
            previousState: () => 'waiting' as AgentState,
          }),
        },
      },
    },
    error: {
      entry: ['notifyStateChange'],
      on: {
        RECOVER: {
          target: 'active',
          actions: assign({
            errorMessage: () => null,
            previousState: () => 'error' as AgentState,
          }),
        },
        RESET: {
          target: 'idle',
          actions: assign({
            errorMessage: () => null,
            currentTaskId: () => null,
            previousState: () => 'error' as AgentState,
          }),
        },
      },
    },
    complete: {
      entry: ['notifyStateChange'],
      on: {
        RESET: {
          target: 'idle',
          actions: assign({
            currentTaskId: () => null,
            previousState: () => 'complete' as AgentState,
          }),
        },
        ACTIVATE: {
          target: 'active',
          actions: assign({
            currentTaskId: ({ event }) => event.taskId ?? null,
            previousState: () => 'complete' as AgentState,
          }),
        },
      },
    },
  },
});

export type AgentMachineActor = ActorRefFrom<typeof agentMachine>;

// Maps backend event types to FSM events
export function wsEventToFsmEvent(eventType: string, _payload: Record<string, unknown>): AgentMachineEvent | null {
  switch (eventType) {
    case 'agent.task.started':
      return { type: 'ACTIVATE', taskId: _payload.task_id as string };
    case 'agent.task.completed':
    case 'agent.task.complete':
      return { type: 'COMPLETE' };
    case 'agent.waiting':
    case 'agent.llm.waiting':
      return { type: 'WAIT' };
    case 'agent.resumed':
      return { type: 'RESUME' };
    case 'agent.error':
      return { type: 'ERROR', message: (_payload.message as string) ?? 'Unknown error' };
    case 'agent.recovered':
      return { type: 'RECOVER' };
    case 'agent.reset':
      return { type: 'RESET' };
    case 'agent.registered':
      return { type: 'RESET' };
    default:
      return null;
  }
}

// Maps status string (from backend) to an FSM event to force sync
export function statusToFsmEvent(status: string): AgentMachineEvent {
  switch (status) {
    case 'active':   return { type: 'ACTIVATE' };
    case 'waiting':  return { type: 'WAIT' };
    case 'error':    return { type: 'ERROR', message: 'Status sync' };
    case 'complete': return { type: 'COMPLETE' };
    default:         return { type: 'RESET' };
  }
}
