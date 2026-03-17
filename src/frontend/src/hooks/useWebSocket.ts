import { useEffect, useRef } from 'react';
import { useAgentStore } from '../stores/agentStore';
import { useAlertStore } from '../stores/alertStore';
import { useMetricsStore } from '../stores/metricsStore';
import type { Agent, AgentStatus } from '../types/agent';
import type { AlertType } from '../types/gamification';

const WS_BASE = typeof window !== 'undefined'
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost/ws';

export function useWebSocket(workspaceId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const destroyedRef = useRef(false);
  const { upsertAgent, setAgentStatus } = useAgentStore();
  const { addAlert } = useAlertStore();
  const { updateLiveMetrics } = useMetricsStore();

  useEffect(() => {
    if (!workspaceId) return;

    destroyedRef.current = false;

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/live?workspace_id=${workspaceId}`);
      wsRef.current = ws;

      ws.onmessage = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data as string) as Record<string, unknown>;
          dispatch(event);
        } catch {
          // ignore malformed
        }
      };

      ws.onerror = () => console.error('[OAV WS] connection error');

      ws.onclose = () => {
        if (destroyedRef.current) return; // don't reconnect after unmount
        setTimeout(() => {
          if (!destroyedRef.current && wsRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, 2000);
      };
    };

    connect();

    return () => {
      destroyedRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [workspaceId]);

  function dispatch(event: Record<string, unknown>) {
    const type = event.event_type as string;
    const agentId = event.agent_id as string;

    if (type === 'agent.state.changed' && agentId) {
      setAgentStatus(agentId, event.status as AgentStatus);
    } else if (type === 'agent.registered' && event.agent) {
      upsertAgent(event.agent as Agent);
    } else if (type === 'alert.created' && event.alert) {
      addAlert(event.alert as AlertType);
    } else if (type?.startsWith('agent.llm.')) {
      updateLiveMetrics(event as { cost_delta: number; tokens_delta: number });
    }
  }
}
