import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { AlertCard } from '../components/alerts/AlertCard';
import { SectionHeader } from '../components/layout/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type Filter = 'all' | 'critical' | 'warning' | 'info';

export function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const alertsArr = Array.isArray(alerts) ? alerts : (alerts as any)?.alerts ?? [];
  const filtered = filter === 'all' ? alertsArr : alertsArr.filter((a: any) => a.severity === filter);

  if (isLoading) return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <SectionHeader title="Alerts" action={<span className="text-oav-muted text-xs">{alertsArr.length} total</span>} />

      <div className="flex gap-2">
        {(['all','critical','warning','info'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${filter === f ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'}`}
            style={filter === f ? { background: 'var(--oav-selected)' } : { background: 'var(--oav-surface-2)' }}>
            {f}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--oav-surface-2)', borderColor: 'var(--oav-border)' }}>
          <span className="text-oav-muted">{selected.size} selected</span>
          <button onClick={() => setSelected(new Set())} className="text-oav-error text-xs hover:opacity-80">Clear</button>
        </div>
      )}

      {filtered.length === 0
        ? <EmptyState message="No alerts" />
        : <div className="space-y-3">
            {filtered.map((a: any) => (
              <AlertCard
                key={a.id}
                alert={a}
                selected={selected.has(a.id)}
                onSelect={() => setSelected(s => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })}
              />
            ))}
          </div>
      }
    </div>
  );
}
