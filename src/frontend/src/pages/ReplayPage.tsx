import { useState } from 'react';
import { useSessionReplay } from '../hooks/useSessionReplay';
import { SectionHeader } from '../components/layout/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';

export function ReplayPage() {
  const { sessions, isLoading } = useSessionReplay();
  const [speed, setSpeed] = useState<0.5|1|2|4>(1);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <SectionHeader title="Session Replay" />

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? null : sessions.length === 0
          ? <EmptyState message="No sessions recorded yet" />
          : sessions.map((s: any) => (
            <div key={s.id} className="rounded-xl border px-4 py-3 flex items-center justify-between cursor-pointer hover:border-oav-accent transition-colors"
              style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
              <div>
                <p className="text-oav-text text-sm font-medium">{s.agent_name ?? 'Session'}</p>
                <p className="text-oav-muted text-xs">{new Date(s.started_at).toLocaleString()} · {s.event_count} events</p>
              </div>
              <button className="text-xs px-3 py-1 rounded-lg border text-oav-accent transition-colors"
                style={{ borderColor: 'var(--oav-accent)' }}>Replay</button>
            </div>
          ))
        }
      </div>

      <div className="rounded-xl border px-6 py-4 space-y-3" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
        <input type="range" min={0} max={100} value={cursor} onChange={e => setCursor(+e.target.value)}
          className="w-full" />
        <div className="flex items-center justify-between">
          <button onClick={() => setPlaying(p => !p)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'var(--oav-accent)', color: '#000' }}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <div className="flex gap-1">
            {([0.5,1,2,4] as const).map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${speed === s ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'}`}
                style={speed === s ? { background: 'var(--oav-selected)' } : undefined}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
