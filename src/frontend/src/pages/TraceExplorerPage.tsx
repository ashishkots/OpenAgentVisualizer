import { Fragment, useState, useCallback } from 'react';
import { AlertCircle, ChevronDown, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SlideInPanel } from '../components/ui/SlideInPanel';
import { IntegrationStatusBadge } from '../components/ui/IntegrationStatusBadge';
import { FallbackBanner } from '../components/ui/FallbackBanner';
import { TraceWaterfall } from '../components/traces/TraceWaterfall';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useTraces } from '../hooks/useTraces';
import { useTraceStore } from '../stores/traceStore';
import { useIntegrationStore } from '../stores/integrationStore';
import type { Span, TraceSearchParams } from '../types/trace';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Trace Explorer' },
];

const TIME_RANGE_OPTIONS = [
  { value: 'last_1h', label: 'Last 1h' },
  { value: 'last_24h', label: 'Last 24h' },
  { value: 'last_7d', label: 'Last 7d' },
] as const;

export function TraceExplorerPage() {
  const traceStatus = useIntegrationStore((s) => s.getStatus('opentrace'));

  const {
    searchParams,
    setSearchParams,
    expandedTraceIds,
    toggleTraceExpanded,
    selectedSpan,
    setSelectedSpan,
    traces,
    total,
  } = useTraceStore();

  const { isLoading, isError } = useTraces(searchParams);

  // Local form state
  const [draftParams, setDraftParams] = useState<Partial<TraceSearchParams>>({});

  const handleSearch = useCallback(() => {
    setSearchParams({ ...draftParams, page: 1 });
  }, [draftParams, setSearchParams]);

  const openTraceBaseUrl = useIntegrationStore(
    (s) => s.configs.opentrace?.base_url ?? '#',
  );

  return (
    <div className="p-6 space-y-4 max-w-full pb-20 md:pb-6" data-testid="trace-explorer-page">
      <Breadcrumb items={BREADCRUMB} />
      <h1 className="text-xl font-bold text-oav-text">Trace Explorer</h1>

      {/* Fallback banner */}
      {(isError || traceStatus === 'disconnected') && (
        <FallbackBanner
          productName="OpenTrace"
          fallbackDescription="Showing locally ingested spans only."
        />
      )}

      {/* Search bar */}
      <div className="bg-oav-surface border border-oav-border rounded-xl p-4" data-testid="trace-search-bar">
        <div className="flex flex-wrap items-end gap-3">
          {/* Time range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-oav-muted">Time Range</label>
            <div className="inline-flex rounded-lg overflow-hidden border border-oav-border bg-oav-bg">
              {TIME_RANGE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDraftParams((p) => ({ ...p, time_range: value }))}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    (draftParams.time_range ?? searchParams.time_range) === value
                      ? 'bg-oav-accent text-white'
                      : 'text-oav-muted hover:text-oav-text',
                  )}
                  data-testid={`time-range-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Min duration */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-oav-muted">Min Duration</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                placeholder="0"
                className="bg-oav-bg border border-oav-border rounded-lg px-3 py-1.5 text-xs text-oav-text w-20 h-[30px] tabular-nums focus:border-oav-accent focus:ring-1 focus:ring-oav-accent focus:outline-none pr-7"
                onChange={(e) =>
                  setDraftParams((p) => ({
                    ...p,
                    min_duration_ms: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                data-testid="min-duration-input"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-oav-muted pointer-events-none">
                ms
              </span>
            </div>
          </div>

          {/* Errors only */}
          <div className="flex items-center gap-2 pb-0.5">
            <input
              type="checkbox"
              id="errors-only"
              className="w-4 h-4 rounded border-oav-border bg-oav-bg accent-oav-error cursor-pointer"
              onChange={(e) => setDraftParams((p) => ({ ...p, errors_only: e.target.checked }))}
              data-testid="errors-only-checkbox"
            />
            <label
              htmlFor="errors-only"
              className="text-xs text-oav-muted cursor-pointer hover:text-oav-text transition-colors"
            >
              Errors only
            </label>
          </div>

          <button
            onClick={handleSearch}
            className="bg-oav-accent text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-oav-accent/90 transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-offset-2 focus-visible:ring-offset-oav-surface disabled:opacity-50 disabled:cursor-not-allowed h-[30px]"
            data-testid="search-button"
          >
            Search
          </button>
        </div>
      </div>

      {/* Integration status bar */}
      <div className="bg-oav-surface/50 border border-oav-border rounded-lg px-4 py-2 text-xs flex items-center gap-2">
        <span className="text-oav-muted">OpenTrace:</span>
        <IntegrationStatusBadge status={traceStatus} />
      </div>

      {/* Trace list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-oav-bg/50 border-b border-oav-border">
                <th className="w-8" />
                <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-3 py-2">
                  Trace ID
                </th>
                <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-3 py-2 hidden sm:table-cell">
                  Root Service
                </th>
                <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-3 py-2">
                  Operation
                </th>
                <th className="text-right text-xs text-oav-muted uppercase tracking-wider font-medium px-3 py-2">
                  Duration
                </th>
                <th className="text-right text-xs text-oav-muted uppercase tracking-wider font-medium px-3 py-2 hidden md:table-cell">
                  Spans
                </th>
                <th className="text-left text-xs text-oav-muted uppercase tracking-wider font-medium px-3 py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oav-border/50">
              {traces.map((trace) => {
                const isExpanded = expandedTraceIds.has(trace.trace_id);
                return (
                  <Fragment key={trace.trace_id}>
                    <tr
                      className={clsx(
                        'cursor-pointer hover:bg-oav-surface-hover transition-colors',
                        trace.error_count > 0 && 'border-l-2 border-l-oav-error',
                      )}
                      onClick={() => toggleTraceExpanded(trace.trace_id)}
                      data-testid="trace-row"
                    >
                      <td className="w-8 pl-3">
                        <ChevronDown
                          className={clsx(
                            'w-4 h-4 text-oav-muted transition-transform duration-200',
                            isExpanded && 'rotate-180',
                          )}
                          aria-hidden="true"
                        />
                      </td>
                      <td className="text-xs font-mono text-oav-accent truncate max-w-[120px] px-3 py-3">
                        {trace.trace_id.substring(0, 8)}...
                      </td>
                      <td className="text-xs text-oav-muted px-3 py-3 hidden sm:table-cell">
                        {trace.root_service}
                      </td>
                      <td className="text-xs text-oav-text px-3 py-3">{trace.root_operation}</td>
                      <td className="text-xs text-oav-text tabular-nums text-right px-3 py-3">
                        {trace.duration_ms}ms
                      </td>
                      <td className="text-xs text-oav-text tabular-nums text-right px-3 py-3 hidden md:table-cell">
                        {trace.span_count}
                      </td>
                      <td className="px-3 py-3">
                        {trace.error_count > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-oav-error/20 text-oav-error text-xs font-medium">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" />
                            {trace.error_count}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded waterfall row */}
                    {isExpanded && (
                      <tr key={`${trace.trace_id}-waterfall`}>
                        <td colSpan={7} className="p-0 border-t border-oav-border/50">
                          <div className="px-4 py-3 bg-oav-bg/60">
                            <TraceWaterfall
                              trace={trace}
                              onSpanClick={(span) => setSelectedSpan(span)}
                              selectedSpanId={selectedSpan?.span_id}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {traces.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-oav-muted">
                    No traces found. Try adjusting your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="border-t border-oav-border px-4 py-2 flex items-center justify-between text-xs text-oav-muted">
            <span>
              Showing {((searchParams.page - 1) * searchParams.page_size) + 1}–
              {Math.min(searchParams.page * searchParams.page_size, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                disabled={searchParams.page <= 1}
                onClick={() => setSearchParams({ page: searchParams.page - 1 })}
                className="px-2 py-1 rounded-md hover:bg-oav-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="prev-page"
              >
                ← Prev
              </button>
              <button
                disabled={searchParams.page * searchParams.page_size >= total}
                onClick={() => setSearchParams({ page: searchParams.page + 1 })}
                className="px-2 py-1 rounded-md hover:bg-oav-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="next-page"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Span detail panel */}
      <SlideInPanel
        open={!!selectedSpan}
        onClose={() => setSelectedSpan(null)}
        title={selectedSpan ? `${selectedSpan.service}/${selectedSpan.operation}` : ''}
        width="360"
        data-testid="span-detail-panel"
      >
        {selectedSpan && (
          <div className="space-y-4">
            {/* Span header */}
            <div className="flex items-start gap-3 pb-4 border-b border-oav-border">
              <div
                className={clsx(
                  'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0',
                  selectedSpan.status === 'ERROR' ? 'bg-oav-error' : 'bg-oav-trace',
                )}
              />
              <div>
                <p className="text-sm font-semibold text-oav-text">
                  {selectedSpan.service}/{selectedSpan.operation}
                </p>
                <p className="text-xs text-oav-muted mt-0.5">
                  {selectedSpan.duration_ms}ms · {selectedSpan.status}
                </p>
              </div>
            </div>

            {/* Metadata table */}
            <dl className="space-y-2 text-xs">
              {[
                { label: 'Trace ID', value: selectedSpan.trace_id, mono: true },
                { label: 'Span ID', value: selectedSpan.span_id, mono: true },
                { label: 'Parent', value: selectedSpan.parent_span_id ?? '—', mono: true },
                { label: 'Service', value: selectedSpan.service, mono: false },
                { label: 'Status', value: selectedSpan.status, mono: false, isStatus: true },
              ].map(({ label, value, mono, isStatus }) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-oav-muted w-24 shrink-0">{label}</dt>
                  <dd
                    className={clsx(
                      mono && 'font-mono break-all text-oav-text',
                      !mono && !isStatus && 'text-oav-text',
                      isStatus && (value === 'ERROR' ? 'text-oav-error font-medium' : 'text-oav-success font-medium'),
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Attributes */}
            {Object.keys(selectedSpan.attributes ?? {}).length > 0 && (
              <div>
                <h3 className="text-xs text-oav-muted uppercase tracking-wider font-medium mb-2">
                  Attributes
                </h3>
                <div className="bg-oav-bg rounded-lg p-3 space-y-1">
                  {Object.entries(selectedSpan.attributes).slice(0, 10).map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="text-oav-accent font-mono shrink-0">{key}:</span>
                      <span className="text-oav-success font-mono break-all">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External link */}
            <a
              href={`${openTraceBaseUrl}/traces/${selectedSpan.trace_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-oav-accent hover:underline"
              data-testid="view-in-opentrace"
            >
              View in OpenTrace
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        )}
      </SlideInPanel>
    </div>
  );
}
