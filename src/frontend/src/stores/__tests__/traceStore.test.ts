import { describe, it, expect, beforeEach } from 'vitest';
import { useTraceStore } from '../traceStore';
import type { Trace, Span } from '../../types/trace';

const mockSpan: Span = {
  span_id: 'span1',
  trace_id: 'trace1',
  parent_span_id: null,
  service: 'agent-svc',
  operation: 'process_task',
  start_time_ms: 0,
  duration_ms: 142,
  status: 'OK',
  attributes: { model: 'gpt-4' },
  depth: 0,
  children: [],
};

const mockTrace: Trace = {
  trace_id: 'trace1',
  root_service: 'agent-svc',
  root_operation: 'process_task',
  start_time: '2026-03-27T14:00:00Z',
  duration_ms: 142,
  span_count: 1,
  error_count: 0,
  spans: [mockSpan],
};

describe('useTraceStore', () => {
  beforeEach(() => {
    useTraceStore.getState().reset();
  });

  it('initialises with empty traces', () => {
    expect(useTraceStore.getState().traces).toHaveLength(0);
  });

  it('setTraces updates traces and total', () => {
    useTraceStore.getState().setTraces([mockTrace], 1);
    expect(useTraceStore.getState().traces).toHaveLength(1);
    expect(useTraceStore.getState().total).toBe(1);
  });

  it('setSelectedSpan sets the selected span', () => {
    useTraceStore.getState().setSelectedSpan(mockSpan);
    expect(useTraceStore.getState().selectedSpan?.span_id).toBe('span1');
  });

  it('toggleTraceExpanded adds and removes trace IDs', () => {
    useTraceStore.getState().toggleTraceExpanded('trace1');
    expect(useTraceStore.getState().expandedTraceIds.has('trace1')).toBe(true);

    useTraceStore.getState().toggleTraceExpanded('trace1');
    expect(useTraceStore.getState().expandedTraceIds.has('trace1')).toBe(false);
  });

  it('setSearchParams merges partial params', () => {
    useTraceStore.getState().setSearchParams({ time_range: 'last_24h' });
    expect(useTraceStore.getState().searchParams.time_range).toBe('last_24h');
    // other params unchanged
    expect(useTraceStore.getState().searchParams.page).toBe(1);
  });

  it('reset clears all state', () => {
    useTraceStore.getState().setTraces([mockTrace], 1);
    useTraceStore.getState().reset();
    expect(useTraceStore.getState().traces).toHaveLength(0);
    expect(useTraceStore.getState().total).toBe(0);
  });
});
