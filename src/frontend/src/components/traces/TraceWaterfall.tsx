import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { clsx } from 'clsx';
import { animateSafe } from '../../canvas/animations/gsapAnimations';
import type { Trace, Span } from '../../types/trace';

function getSpanBarClass(span: Span, avgDuration: number): string {
  if (span.status === 'ERROR') return 'bg-oav-error';
  if (span.duration_ms > avgDuration * 2) return 'bg-oav-warning';
  if (!span.parent_span_id) return 'bg-gradient-to-r from-oav-trace to-oav-trace/60';
  const svc = span.service.toLowerCase();
  if (/db|pg|redis|cache/.test(svc)) return 'bg-oav-purple';
  if (/llm|openai|claude|gpt/.test(svc)) return 'bg-oav-knowledge';
  return 'bg-oav-trace';
}

function flattenSpans(spans: Span[]): Span[] {
  const flat: Span[] = [];
  function walk(children: Span[], depth: number) {
    for (const span of children) {
      flat.push({ ...span, depth });
      if (span.children?.length) walk(span.children, depth + 1);
    }
  }
  walk(spans, 0);
  return flat;
}

function buildSpanTree(spans: Span[]): Span[] {
  const map = new Map<string, Span & { children: Span[] }>();
  const roots: (Span & { children: Span[] })[] = [];
  for (const span of spans) {
    map.set(span.span_id, { ...span, children: [] });
  }
  for (const [, span] of map) {
    if (span.parent_span_id && map.has(span.parent_span_id)) {
      map.get(span.parent_span_id)!.children.push(span);
    } else {
      roots.push(span);
    }
  }
  return roots;
}

interface TraceWaterfallProps {
  trace: Trace;
  onSpanClick?: (span: Span) => void;
  selectedSpanId?: string | null;
}

export function TraceWaterfall({ trace, onSpanClick, selectedSpanId }: TraceWaterfallProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      animateSafe(() => {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, scaleY: 0, transformOrigin: 'top' },
          { opacity: 1, scaleY: 1, duration: 0.2, ease: 'power2.out' },
        );
      });
    }
  }, []);

  const allSpans = trace.spans ?? [];
  const tree = buildSpanTree(allSpans);
  const flat = flattenSpans(tree);
  const avgDuration = allSpans.length > 0
    ? allSpans.reduce((s, sp) => s + sp.duration_ms, 0) / allSpans.length
    : 1;

  // Auto-calculate tick interval for 5–8 ticks
  const tickCount = Math.min(8, Math.max(5, Math.floor(trace.duration_ms / 100)));
  const tickInterval = trace.duration_ms / tickCount;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(i * tickInterval));

  return (
    <div
      ref={containerRef}
      className="bg-oav-bg rounded-lg border border-oav-border/50 overflow-x-auto"
      data-testid="trace-waterfall"
    >
      {/* Time axis ruler */}
      <div className="relative h-6 border-b border-oav-border mb-1 flex items-end text-[10px] text-oav-muted font-mono select-none">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute bottom-0 border-l border-oav-border/50 h-2 pl-0.5"
            style={{ left: `calc(180px + 4px + ${(tick / trace.duration_ms) * 100}% * (100% - 180px - 64px - 8px) / 100%)` }}
          >
            {tick}ms
          </span>
        ))}
      </div>

      {/* Span rows */}
      {flat.map((span) => {
        const startPct = (span.start_time_ms / trace.duration_ms) * 100;
        const widthPct = Math.max((span.duration_ms / trace.duration_ms) * 100, 0);
        const barClass = getSpanBarClass(span, avgDuration);
        const isSelected = span.span_id === selectedSpanId;

        return (
          <div
            key={span.span_id}
            className={clsx(
              'flex items-center py-1 pr-4 cursor-pointer transition-colors duration-100 group relative',
              'hover:bg-oav-surface-hover',
              isSelected && 'bg-oav-surface-active',
              span.depth > 0 && 'waterfall-span-child',
            )}
            style={{ paddingLeft: `calc(8px + ${Math.min(span.depth, 8)} * 24px)` }}
            onClick={() => onSpanClick?.(span)}
            role="button"
            tabIndex={0}
            aria-label={`Span: ${span.service}/${span.operation}, ${span.duration_ms}ms`}
            onKeyDown={(e) => e.key === 'Enter' && onSpanClick?.(span)}
            data-testid="waterfall-span-row"
          >
            {/* Service + operation label */}
            <div className="w-[180px] shrink-0 mr-3">
              <span className="text-xs font-mono text-oav-muted truncate block leading-tight">
                {span.service}
              </span>
              <span className="text-xs font-medium text-oav-text truncate block leading-tight">
                {span.operation}
              </span>
            </div>

            {/* Bar track */}
            <div className="flex-1 relative h-6">
              <div
                className={clsx(
                  'absolute h-6 rounded-sm flex items-center overflow-hidden min-w-[3px]',
                  barClass,
                  'group-hover:brightness-110 transition-all duration-150',
                )}
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  minWidth: '3px',
                }}
              />
            </div>

            {/* Duration label */}
            <div className="w-[60px] shrink-0 text-right text-xs text-oav-muted font-mono tabular-nums ml-2">
              {span.duration_ms}ms
            </div>
          </div>
        );
      })}
    </div>
  );
}
