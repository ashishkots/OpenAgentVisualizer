// Sprint 3 — UE5 Pixel Streaming types

export type UE5ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'fallback'
  | 'error';

export type CameraMode = 'free' | 'overview' | 'follow_agent';

export interface PixelStreamConfig {
  signaling_url: string;
  enabled: boolean;
  timeout_ms: number;
}

export type UE5MessageType =
  | 'agent_selected'
  | 'agent_deselected'
  | 'camera_mode_changed'
  | 'agent_moved'
  | 'agent_status_changed'
  | 'world_stats'
  | 'ping'
  | 'pong';

export interface UE5Message {
  type: UE5MessageType;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface UE5StreamStats {
  fps: number | null;
  ping_ms: number | null;
  agent_count: number;
  camera_mode: CameraMode;
}
