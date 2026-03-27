// Sprint 3 — Trace / OpenTrace types

export type SpanStatus = 'OK' | 'ERROR' | 'UNSET';

export interface Span {
  span_id: string;
  trace_id: string;
  parent_span_id: string | null;
  service: string;
  operation: string;
  start_time_ms: number; // ms offset from trace start
  duration_ms: number;
  status: SpanStatus;
  attributes: Record<string, string>;
  depth: number; // computed client-side
  children: Span[]; // populated client-side
}

export interface Trace {
  trace_id: string;
  root_service: string;
  root_operation: string;
  start_time: string;
  duration_ms: number;
  span_count: number;
  error_count: number;
  spans: Span[];
}

export interface TraceSearchParams {
  time_range: 'last_1h' | 'last_24h' | 'last_7d' | 'custom';
  start?: string;
  end?: string;
  agent_id?: string;
  service?: string;
  min_duration_ms?: number;
  errors_only?: boolean;
  page: number;
  page_size: number;
}

export interface TraceListResponse {
  traces: Trace[];
  total: number;
  page: number;
  page_size: number;
}

export interface WaterfallData {
  trace: Trace;
  root_spans: Span[]; // spans with depth=0
  all_spans: Span[]; // flat list sorted by start_time
}
