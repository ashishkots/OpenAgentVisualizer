export interface XPEvent {
  agent_id: string;
  xp_delta: number;
  reason: string;
  timestamp: string;
}

export interface LevelUp {
  agent_id: string;
  agent_name: string;
  old_level: number;
  new_level: number;
  new_level_name: string;
}

export interface AlertType {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolved: boolean;
  created_at: string;
  extra_data: Record<string, unknown> | null;
  acknowledged?: boolean;
}

export interface LeaderboardEntry {
  agent_id: string;
  agent_name: string;
  total_xp: number;
  level: number;
  task_count?: number;
  cost_efficiency?: number;
  streak_days?: number;
  rank?: number;
  prev_rank?: number;
  achievement_count?: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';
export type LeaderboardCategory = 'xp' | 'tasks' | 'cost_efficiency' | 'streaks';

// 10-level XP system per PRD: required_xp(level) = round(500 * (level - 1) ^ 1.8)
export interface XPLevel {
  level: number;
  name: string;
  requiredXP: number;
  color: string;
  pixiColor: number;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  xp_bonus: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
  agent_id?: string;
}

export interface AchievementUnlock {
  agent_id: string;
  agent_name: string;
  achievement_key: string;
  achievement_name: string;
  xp_bonus: number;
  icon: string;
}

// WebSocket room subscription types
export type WsRoomType = 'workspace' | 'agent' | 'session';

export interface WsRoomSubscription {
  room_type: WsRoomType;
  room_id: string;
}

export interface WsMessage {
  event_type: string;
  sequence?: number;
  timestamp: string;
  room_type?: WsRoomType;
  room_id?: string;
  [key: string]: unknown;
}

// Session replay types
export interface SessionReplayState {
  sessionId: string | null;
  cursorIndex: number;
  isPlaying: boolean;
  speed: number;
  canvasSyncEnabled: boolean;
}

export interface SessionFilters {
  status?: 'active' | 'completed' | 'all';
  dateRange?: { from: string; to: string };
}
