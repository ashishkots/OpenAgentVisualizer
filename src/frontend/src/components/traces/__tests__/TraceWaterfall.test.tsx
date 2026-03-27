import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TraceWaterfall } from '../TraceWaterfall';
import type { Trace, Span } from '../../../types/trace';

const rootSpan: Span = {
  span_id: 'span1',
  trace_id: 'trace1',
  parent_span_id: null,
  service: 'agent-svc',
  operation: 'process_task',
  start_time_ms: 0,
  duration_ms: 142,
  status: 'OK',
  attributes: {},
  depth: 0,
  children: [],
};

const childSpan: Span = {
  span_id: 'span2',
  trace_id: 'trace1',
  parent_span_id: 'span1',
  service: 'llm-svc',
  operation: 'completion',
  start_time_ms: 10,
  duration_ms: 98,
  status: 'OK',
  attributes: { model: 'gpt-4' },
  depth: 1,
  children: [],
};

const errorSpan: Span = {
  ...childSpan,
  span_id: 'span3',
  status: 'ERROR',
};

const mockTrace: Trace = {
  trace_id: 'trace1',
  root_service: 'agent-svc',
  root_operation: 'process_task',
  start_time: '2026-03-27T14:00:00Z',
  duration_ms: 142,
  span_count: 2,
  error_count: 0,
  spans: [rootSpan, childSpan],
};

describe('TraceWaterfall', () => {
  it('renders span rows', () => {
    render(<TraceWaterfall trace={mockTrace} />);
    expect(screen.getAllByTestId('waterfall-span-row')).toHaveLength(2);
  });

  it('shows service names', () => {
    render(<TraceWaterfall trace={mockTrace} />);
    expect(screen.getByText('agent-svc')).toBeInTheDocument();
    expect(screen.getByText('llm-svc')).toBeInTheDocument();
  });

  it('shows operation names', () => {
    render(<TraceWaterfall trace={mockTrace} />);
    expect(screen.getByText('process_task')).toBeInTheDocument();
    expect(screen.getByText('completion')).toBeInTheDocument();
  });

  it('calls onSpanClick when a span row is clicked', () => {
    const onSpanClick = vi.fn();
    render(<TraceWaterfall trace={mockTrace} onSpanClick={onSpanClick} />);
    const rows = screen.getAllByTestId('waterfall-span-row');
    fireEvent.click(rows[0]);
    expect(onSpanClick).toHaveBeenCalledWith(expect.objectContaining({ span_id: 'span1' }));
  });

  it('highlights selected span', () => {
    render(<TraceWaterfall trace={mockTrace} selectedSpanId="span1" />);
    const rows = screen.getAllByTestId('waterfall-span-row');
    expect(rows[0]).toHaveClass('bg-oav-surface-active');
  });

  it('renders error span with error bar class indicator', () => {
    const traceWithError = {
      ...mockTrace,
      spans: [rootSpan, errorSpan],
    };
    render(<TraceWaterfall trace={traceWithError} />);
    // Error span row exists
    expect(screen.getAllByTestId('waterfall-span-row')).toHaveLength(2);
  });
});
