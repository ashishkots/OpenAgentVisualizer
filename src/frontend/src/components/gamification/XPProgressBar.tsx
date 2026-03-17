import { xpProgress } from '../../lib/xpLevels';
export function XPProgressBar({ xpTotal }: { xpTotal: number }) {
  const { level, current, required, pct } = xpProgress(xpTotal ?? 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: 'var(--oav-muted)' }}>
        <span>{current} / {required} XP</span>
        <span>Lv {level}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--oav-surface-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct * 100}%`, background: 'var(--oav-accent)', boxShadow: '0 0 6px var(--oav-accent)40' }}
        />
      </div>
    </div>
  );
}
