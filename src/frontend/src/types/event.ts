export interface LiveEvent {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface OTLPSpan {
  span_id: string;
  trace_id: string;
  parent_span_id: string | null;
  workspace_id: string;
  service_name: string;
  operation_name: string;
  status_code: string;
  duration_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  model: string | null;
  start_time: string;
  attributes: Record<string, unknown>;
}
