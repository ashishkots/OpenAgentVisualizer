export type TournamentType = 'speed' | 'accuracy' | 'cost_efficiency';
export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface Tournament {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  type: TournamentType;
  start_at: string;
  end_at: string;
  entry_fee: number;
  prize_pool: number;
  status: TournamentStatus;
  created_at: string;
  entry_count?: number;
  is_entered?: boolean;
}

export interface TournamentEntry {
  id: string;
  tournament_id: string;
  agent_id: string;
  agent_name: string;
  score: number;
  rank: number | null;
  prize_awarded: number | null;
  entered_at: string;
}

export interface Season {
  id: string;
  workspace_id: string;
  name: string;
  number: number;
  start_at: string;
  end_at: string;
  status: 'active' | 'completed';
  days_remaining: number;
}

export interface SeasonalXP {
  season_id: string;
  agent_id: string;
  agent_name: string;
  xp: number;
  rank: number;
}
