export interface CostSummary {
  total_cost_usd: number;
  daily_cost_usd: number;
  weekly_cost_usd: number;
  period_start: string;
  period_end: string;
}

export interface TokenUsage {
  agent_id: string;
  agent_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
}

export interface LiveMetricDelta {
  agent_id: string;
  tokens_delta: number;
  cost_delta: number;
}
