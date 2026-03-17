import { setup, assign } from 'xstate';

export const agentMachine = setup({
  types: {
    events: {} as
      | { type: 'TASK_START'; taskId: string }
      | { type: 'LLM_CALL' }
      | { type: 'TOOL_CALL'; toolName: string }
      | { type: 'AGENT_HANDOFF'; targetAgentId: string }
      | { type: 'TASK_COMPLETE'; xpAwarded: number }
      | { type: 'ERROR'; message: string }
      | { type: 'RESET' },
    context: {} as {
      currentTaskId: string | null;
      errorMessage: string | null;
    },
  },
}).createMachine({
  id: 'agent',
  initial: 'idle',
  context: { currentTaskId: null, errorMessage: null },
  states: {
    idle: {
      on: {
        TASK_START: {
          target: 'working',
          actions: assign({
            currentTaskId: ({ event }) => event.taskId,
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorMessage: ({ event }) => event.message,
          }),
        },
      },
    },
    working: {
      on: {
        LLM_CALL: 'thinking',
        TOOL_CALL: 'working',
        AGENT_HANDOFF: 'communicating',
        TASK_COMPLETE: {
          target: 'idle',
          actions: assign({
            currentTaskId: () => null,
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorMessage: ({ event }) => event.message,
          }),
        },
      },
    },
    thinking: {
      on: {
        TASK_COMPLETE: 'idle',
        TOOL_CALL: 'working',
        AGENT_HANDOFF: 'communicating',
        ERROR: 'error',
      },
    },
    communicating: {
      on: {
        TASK_COMPLETE: 'idle',
        LLM_CALL: 'thinking',
        ERROR: 'error',
      },
    },
    error: {
      on: {
        RESET: {
          target: 'idle',
          actions: assign({
            errorMessage: () => null,
          }),
        },
      },
    },
  },
});
