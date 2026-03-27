interface Alert { id: string; title: string; message: string; severity: 'critical'|'warning'|'info'; created_at: string; resolved: boolean; }
const SEV: Record<string, {border: string; label: string}> = {
  critical: { border: 'var(--oav-error)',   label: 'Critical' },
  warning:  { border: 'var(--oav-warning)', label: 'Warning' },
  info:     { border: 'var(--oav-accent)',  label: 'Info' },
};
interface Props { alert: Alert; onResolve?: () => void; selected?: boolean; onSelect?: () => void; }
export function AlertCard({ alert, onResolve, selected, onSelect }: Props) {
  const sev = SEV[alert.severity] ?? SEV.info;
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 transition-all"
      style={{ background: 'var(--oav-surface)', borderColor: selected ? sev.border : 'var(--oav-border)',
        boxShadow: selected ? `0 0 8px ${sev.border}40` : undefined }}>
      {onSelect && <input type="checkbox" checked={!!selected} onChange={onSelect} className="mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: `${sev.border}20`, color: sev.border }}>{sev.label}</span>
          <p className="text-oav-text text-sm font-medium truncate">{alert.title}</p>
        </div>
        <p className="text-oav-muted text-xs">{alert.message}</p>
      </div>
      {!alert.resolved && onResolve && (
        <button onClick={onResolve} className="shrink-0 text-xs px-2 py-1 rounded border text-oav-muted hover:text-oav-text transition-colors"
          style={{ borderColor: 'var(--oav-border)' }}>Resolve</button>
      )}
    </div>
  );
}
