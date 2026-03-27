import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Play,
  Pause,
  SkipBack,
  ChevronDown,
  ChevronRight,
  Video,
} from 'lucide-react';
import { getSessions } from '../services/sessionApi';
import { useSessionReplay } from '../hooks/useSessionReplay';
import { useSessionStore } from '../stores/sessionStore';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState as LegacyEmptyState } from '../components/common/EmptyState';
import { EmptyState } from '../components/ui/EmptyState';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const BREADCRUMB = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sessions' }];
const SPEEDS = [0.5, 1, 2, 5] as const;
type Speed = typeof SPEEDS[number];

function JsonViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="text-xs font-mono p-3 rounded-lg bg-oav-bg overflow-auto max-h-48">
      {JSON.stringify(data, null, 2)
        .split('\n')
        .map((line, i) => {
          // Simple key/value colorization
          const keyMatch = line.match(/^(\s*)(".*?")(: )(.*)(,?)$/);
          if (keyMatch) {
            const [, indent, key, colon, val, comma] = keyMatch;
            const valueClass = val.startsWith('"')
              ? 'text-oav-success'
              : val === 'true' || val === 'false'
                ? 'text-oav-warning'
                : val === 'null'
                  ? 'text-oav-muted'
                  : 'text-oav-purple';
            return (
              <span key={i} className="block">
                {indent}
                <span className="text-oav-accent">{key}</span>
                {colon}
                <span className={valueClass}>{val}</span>
                {comma}
              </span>
            );
          }
          return <span key={i} className="block text-oav-text">{line}</span>;
        })}
    </pre>
  );
}

export function SessionsPage() {
  const { id: paramSessionId } = useParams<{ id: string }>();
  const { selectedSessionId, selectSession } = useSessionStore();
  const activeSessionId = paramSessionId ?? selectedSessionId;

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    staleTime: 30_000,
  });

  const {
    events,
    isLoading: replayLoading,
    cursorIndex,
    isPlaying,
    speed,
    currentEvent,
    play,
    pause,
    seek,
    changeSpeed,
    totalEvents,
  } = useSessionReplay(activeSessionId ?? null);

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [canvasSync, setCanvasSync] = useState(false);

  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      selectSession(sessions[0].id);
    }
  }, [sessions, activeSessionId, selectSession]);

  return (
    <div className="flex flex-col h-full pb-16 md:pb-0">
      <div className="p-6 pb-3 shrink-0 space-y-1">
        <Breadcrumb items={BREADCRUMB} />
        <h1 className="text-xl font-bold text-oav-text">Sessions</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Session list (left panel) */}
        <div className="w-[280px] shrink-0 border-r border-oav-border overflow-y-auto hidden md:block">
          {sessionsLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No sessions yet"
              description="Sessions are recorded when agents run tasks. Start an agent to see sessions here."
              actionLabel="View agents"
              onAction={() => {/* navigate handled via link */}}
            />
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={clsx(
                    'w-full text-left px-4 py-3 border-b border-oav-border transition-colors',
                    isActive
                      ? 'bg-oav-surface-active border-l-2 border-l-oav-accent'
                      : 'hover:bg-oav-surface-hover',
                  )}
                  aria-pressed={isActive}
                >
                  <p className="text-sm font-medium text-oav-text truncate">
                    {session.name ?? `Session ${session.id.slice(0, 8)}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={clsx(
                      'w-2 h-2 rounded-full',
                      session.ended_at ? 'bg-oav-muted' : 'bg-oav-success',
                    )} aria-hidden="true" />
                    <p className="text-xs text-oav-muted">
                      {session.event_count} events ·{' '}
                      {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Session detail (right panel) */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!activeSessionId ? (
            <div className="flex-1 flex items-center justify-center">
              <LegacyEmptyState message="Select a session to view details" />
            </div>
          ) : replayLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Playback controls */}
              <div className="p-4 border-b border-oav-border shrink-0">
                <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => seek(0)}
                      className="w-9 h-9 flex items-center justify-center text-oav-muted hover:text-oav-text transition-colors"
                      aria-label="Skip to start"
                    >
                      <SkipBack className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={isPlaying ? pause : play}
                      className="w-10 h-10 flex items-center justify-center bg-oav-accent rounded-lg text-white hover:bg-oav-accent/80 transition-colors"
                      aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
                    >
                      {isPlaying
                        ? <Pause className="w-5 h-5" aria-hidden="true" />
                        : <Play className="w-5 h-5" aria-hidden="true" />
                      }
                    </button>
                    <div className="flex rounded-lg overflow-hidden border border-oav-border">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          className={clsx(
                            'px-2 py-1 text-xs font-medium transition-colors',
                            speed === s
                              ? 'bg-oav-accent text-white'
                              : 'bg-oav-surface text-oav-muted hover:text-oav-text',
                          )}
                          aria-pressed={speed === s}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-oav-muted ml-auto tabular-nums">
                      {cursorIndex + 1} / {totalEvents}
                    </span>
                    <label className="flex items-center gap-2 text-xs text-oav-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={canvasSync}
                        onChange={(e) => setCanvasSync(e.target.checked)}
                        className="rounded accent-oav-accent"
                      />
                      Canvas sync
                    </label>
                  </div>
                  {/* Scrubber */}
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, totalEvents - 1)}
                    value={cursorIndex}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full"
                    aria-label="Replay position scrubber"
                  />
                </div>
              </div>

              {/* Event timeline */}
              <div className="flex-1 overflow-y-auto p-4">
                {events.length === 0 ? (
                  <LegacyEmptyState message="No events in this session" />
                ) : (
                  <div className="space-y-0">
                    {events.map((ev, i) => {
                      const isCurrent = i === cursorIndex;
                      const isExpanded = expandedEventId === ev.id;
                      return (
                        <div
                          key={ev.id}
                          className={clsx(
                            'border-b border-oav-border py-2',
                            isCurrent && 'border-l-2 border-l-oav-accent bg-oav-accent/5',
                          )}
                        >
                          <div
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setExpandedEventId(isExpanded ? null : ev.id);
                            }}
                            aria-expanded={isExpanded}
                          >
                            <span className="text-xs font-mono text-oav-muted w-20 shrink-0 tabular-nums pt-0.5">
                              {new Date(ev.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-oav-bg text-oav-accent border border-oav-accent/30 shrink-0">
                              {ev.event_type}
                            </span>
                            <span className="text-sm text-oav-text flex-1 truncate">
                              {ev.agent_id ? `Agent: ${ev.agent_id.slice(0, 8)}` : 'System'}
                            </span>
                            {isExpanded
                              ? <ChevronDown className="w-3 h-3 text-oav-muted shrink-0" aria-hidden="true" />
                              : <ChevronRight className="w-3 h-3 text-oav-muted shrink-0" aria-hidden="true" />
                            }
                          </div>
                          {isExpanded && (
                            <div className="mt-2 ml-[92px]">
                              <JsonViewer data={ev.payload} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
