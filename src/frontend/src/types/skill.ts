export interface SkillNode {
  id: string;
  tree_id: string;
  name: string;
  description: string;
  parent_id: string | null;
  level_required: number;
  cost: number;
  stat_bonus: Record<string, number>;
  icon: string;
  tier: number;
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  nodes: SkillNode[];
}

export interface AgentSkill {
  id: string;
  agent_id: string;
  node_id: string;
  unlocked_at: string;
}

export type SkillNodeState = 'locked' | 'available' | 'unlocked';
