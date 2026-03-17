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
  severity: string;
  message: string;
  resolved: boolean;
  created_at: string;
  extra_data: Record<string, unknown> | null;
}

export interface LeaderboardEntry {
  agent_id: string;
  agent_name: string;
  total_xp: number;
  level: number;
}
