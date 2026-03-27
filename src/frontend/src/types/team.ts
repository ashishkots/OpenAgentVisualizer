export type TeamMemberRole = 'leader' | 'member';

export interface TeamMember {
  id: string;
  team_id: string;
  agent_id: string;
  agent_name: string;
  role: TeamMemberRole;
  joined_at: string;
  level?: number;
  total_xp?: number;
}

export interface TeamStats {
  total_xp: number;
  total_tasks: number;
  level: number;
  member_count: number;
}

export interface Team {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  total_xp?: number;
  level?: number;
  members?: TeamMember[];
}

export interface TeamCreate {
  name: string;
  description?: string;
  icon: string;
}

export type ChallengeGoalType = 'events' | 'tasks' | 'xp';
export type ChallengeStatus = 'active' | 'completed' | 'failed';
export type ChallengeType = 'team' | 'workspace';

export interface Challenge {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  type: ChallengeType;
  goal_type: ChallengeGoalType;
  goal_value: number;
  current_value: number;
  reward_tokens: number;
  reward_xp: number;
  start_at: string;
  end_at: string;
  status: ChallengeStatus;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  contributor_id: string;
  contributor_name?: string;
  contribution: number;
  updated_at: string;
}
