import { useState } from 'react';
import { useSessionReplay } from '../hooks/useSessionReplay';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../services/sessionApi';

export function ReplayPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });

  const { events: _events, isLoading, cursorIndex, isPlaying, speed, currentEvent, play, pause, seek, setSpeed, totalEvents } =
    useSessionReplay(selectedSessionId);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-oav-text">Session Replay</h1>

      {/* Session selector */}
      <div className="bg-oav-surface border border-oav-border rounded-xl p-4">
        <h2 className="text-oav-muted text-sm mb-2">Select Session</h2>
        {sessionsLoading ? (
          <LoadingSpinner />
        ) : sessions.length === 0 ? (
          <EmptyState message="No recorded sessions yet" />
        ) : (
          <select
            className="bg-oav-bg border border-oav-border rounded-lg px-3 py-1.5 text-oav-text text-sm w-full"
            value={selectedSessionId ?? ''}
            onChange={(e) => setSelectedSessionId(e.target.value || null)}
          >
            <option value="">-- Choose session --</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? s.id} ({s.event_count} events)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Playback controls */}
      {selectedSessionId && (
        <div className="bg-oav-surface border border-oav-border rounded-xl p-4 space-y-3">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={isPlaying ? pause : play}
                  className="bg-oav-accent text-white rounded-lg px-4 py-1.5 text-sm"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <select
                  className="bg-oav-bg border border-oav-border rounded text-oav-text text-xs px-2 py-1"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
                <span className="text-oav-muted text-xs">
                  {cursorIndex + 1} / {totalEvents}
                </span>
              </div>

              {/* Timeline scrubber */}
              <input
                type="range"
                min={0}
                max={Math.max(0, totalEvents - 1)}
                value={cursorIndex}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full accent-oav-accent"
              />

              {/* Current event */}
              {currentEvent && (
                <div className="bg-oav-bg rounded-lg p-3 text-xs font-mono text-oav-muted">
                  <span className="text-oav-accent">{currentEvent.event_type}</span>
                  {' · '}
                  {currentEvent.agent_id ? <span className="text-oav-text">{currentEvent.agent_id}</span> : 'system'}
                  {' · '}
                  {new Date(currentEvent.timestamp).toLocaleTimeString()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
