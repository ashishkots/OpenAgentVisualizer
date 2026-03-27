interface Event { id: string; label: string; time: string; type: 'trigger'|'update'|'resolve'; }
const DOT_COLOR = { trigger: 'var(--oav-error)', update: 'var(--oav-warning)', resolve: 'var(--oav-success)' };
export function AlertTimeline({ events }: { events: Event[] }) {
  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: 'var(--oav-border)' }} />
      {events.map(e => (
        <div key={e.id} className="relative">
          <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2" style={{ background: DOT_COLOR[e.type], borderColor: 'var(--oav-bg)' }} />
          <p className="text-oav-text text-sm">{e.label}</p>
          <p className="text-oav-muted text-xs mt-0.5">{new Date(e.time).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
