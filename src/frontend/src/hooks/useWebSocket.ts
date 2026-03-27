import { useEffect, useRef, useCallback } from 'react';
import { useAgentStore } from '../stores/agentStore';
import { useAlertStore } from '../stores/alertStore';
import { useMetricsStore } from '../stores/metricsStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { machineManager } from '../machines/MachineManager';
import type { Agent } from '../types/agent';
import type { AlertType, LevelUp, AchievementUnlock } from '../types/gamification';

const WS_BASE =
  typeof window !== 'undefined'
    ? `ws://${window.location.host}/ws`
    : 'ws://localhost/ws';

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;

export type WsRoomType = 'workspace' | 'agent' | 'session';

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribe: (roomType: WsRoomType, roomId: string) => void;
  unsubscribe: (roomType: WsRoomType, roomId: string) => void;
}

/**
 * useWebSocket — room-based WebSocket client (ADR-003).
 * Supports workspace, agent, and session room subscriptions.
 * Feeds events to MachineManager for FSM transitions.
 * Reconnects with missed-message recovery via sequence counters.
 */
export function useWebSocket(workspaceId: string | null): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const destroyedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const lastSequenceRef = useRef<number>(0);
  const activeRooms = useRef<Set<string>>(new Set());

  const { upsertAgent, setAgentStatus } = useAgentStore();
  const { addAlert } = useAlertStore();
  const { updateLiveMetrics } = useMetricsStore();
  const { enqueueLevelUp, enqueueAchievement } = useGamificationStore();

  const subscribe = useCallback((roomType: WsRoomType, roomId: string) => {
    const key = `${roomType}:${roomId}`;
    activeRooms.current.add(key);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', room: `${roomType}:${roomId}` }));
    }
  }, []);

  const unsubscribe = useCallback((roomType: WsRoomType, roomId: string) => {
    const key = `${roomType}:${roomId}`;
    activeRooms.current.delete(key);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'unsubscribe', room: `${roomType}:${roomId}` }));
    }
  }, []);

  const resubscribeAll = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    for (const key of activeRooms.current) {
      const [roomType, ...rest] = key.split(':');
      const roomId = rest.join(':');
      wsRef.current.send(JSON.stringify({
        action: 'subscribe',
        room: `${roomType}:${roomId}`,
        // Request missed messages since last sequence
        since_sequence: lastSequenceRef.current,
      }));
    }
  }, []);

  const dispatch = useCallback((event: Record<string, unknown>) => {
    const type = event.event_type as string;
    const agentId = event.agent_id as string | undefined;
    const seq = event.sequence as number | undefined;

    if (seq !== undefined) {
      lastSequenceRef.current = Math.max(lastSequenceRef.current, seq);
    }

    // Feed to MachineManager for FSM transitions
    machineManager.dispatchWsEvent(event);

    switch (type) {
      case 'agent.registered':
        if (event.agent) upsertAgent(event.agent as Agent);
        break;

      case 'agent.state.changed':
        if (agentId && event.status) {
          setAgentStatus(agentId, event.status as Agent['status']);
        }
        break;

      case 'alert.created':
        if (event.alert) addAlert(event.alert as AlertType);
        break;

      case 'agent.llm.completed':
      case 'agent.llm.call':
        if (event.cost_delta !== undefined) {
          updateLiveMetrics({
            cost_delta: event.cost_delta as number,
            tokens_delta: (event.tokens_delta as number) ?? 0,
          });
        }
        break;

      case 'agent.level_up':
        if (agentId && event.new_level !== undefined) {
          enqueueLevelUp({
            agent_id: agentId,
            agent_name: (event.agent_name as string) ?? '',
            old_level: (event.old_level as number) ?? 0,
            new_level: event.new_level as number,
            new_level_name: (event.new_level_name as string) ?? '',
          } as LevelUp);
        }
        break;

      case 'agent.achievement_unlocked':
        if (agentId && event.achievement_key) {
          enqueueAchievement({
            agent_id: agentId,
            agent_name: (event.agent_name as string) ?? '',
            achievement_key: event.achievement_key as string,
            achievement_name: (event.achievement_name as string) ?? '',
            xp_bonus: (event.xp_bonus as number) ?? 0,
            icon: (event.icon as string) ?? 'Award',
          } as AchievementUnlock);
        }
        break;

      default:
        // Unknown event — ignore
        break;
    }
  }, [upsertAgent, setAgentStatus, addAlert, updateLiveMetrics, enqueueLevelUp, enqueueAchievement]);

  useEffect(() => {
    if (!workspaceId) return;

    destroyedRef.current = false;

    const connect = () => {
      if (destroyedRef.current) return;
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;

      const ws = new WebSocket(`${WS_BASE}/live?workspace_id=${workspaceId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
        reconnectAttemptsRef.current = 0;
        // Auto-subscribe to workspace room
        ws.send(JSON.stringify({ action: 'subscribe', room: `workspace:${workspaceId}` }));
        resubscribeAll();
      };

      ws.onmessage = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data as string) as Record<string, unknown>;
          dispatch(event);
        } catch {
          // ignore malformed
        }
      };

      ws.onerror = () => {
        console.error('[OAV WS] connection error');
        isConnectedRef.current = false;
      };

      ws.onclose = () => {
        isConnectedRef.current = false;
        if (destroyedRef.current) return;
        reconnectAttemptsRef.current++;
        const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttemptsRef.current, 30_000);
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      destroyedRef.current = true;
      isConnectedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [workspaceId, dispatch, resubscribeAll]);

  return {
    isConnected: isConnectedRef.current,
    subscribe,
    unsubscribe,
  };
}
