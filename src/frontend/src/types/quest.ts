export type QuestType = 'daily' | 'weekly' | 'epic';

export interface QuestStep {
  description: string;
  condition_type: string;
  condition_value: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  type: QuestType;
  steps: QuestStep[];
  xp_reward: number;
  currency_reward: number;
  icon: string;
  active: boolean;
  reset_hours: number | null;
  created_at: string;
}

export interface AgentQuestProgress {
  id: string;
  agent_id: string;
  quest_id: string;
  current_step: number;
  completed: boolean;
  completed_at: string | null;
  last_reset_at: string | null;
  quest: Quest;
}
