import { useEffect, useRef } from 'react';
import { useAgentStore } from '../stores/agentStore';
import { useAlertStore } from '../stores/alertStore';
import { useMetricsStore } from '../stores/metricsStore';

const WS_BASE = typeof window !== 'undefined'
  ? `ws://${window.location.host}/ws`
  : 'ws://localhost/ws';

export function useWebSocket(workspaceId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { upsertAgent, setAgentStatus } = useAgentStore();
  const { addAlert } = useAlertStore();
  const { updateLiveMetrics } = useMetricsStore();

  useEffect(() => {
    if (!workspaceId) return;

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
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, 2000);
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [workspaceId]);

  function dispatch(event: Record<string, unknown>) {
    const type = event.event_type as string;
    const agentId = event.agent_id as string;

    if (type === 'agent.state.changed' && agentId) {
      setAgentStatus(agentId, event.status as any);
    } else if (type === 'agent.registered') {
      upsertAgent(event.agent as any);
    } else if (type === 'alert.created') {
      addAlert(event.alert as any);
    } else if (type?.startsWith('agent.llm.')) {
      updateLiveMetrics(event as any);
    }
  }
}
