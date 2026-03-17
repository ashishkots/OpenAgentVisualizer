import { xpProgress } from '../../lib/xpLevels';

export function XPProgressBar({ xpTotal }: { xpTotal: number }) {
  const { level, name, color, progress } = xpProgress(xpTotal);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-oav-muted">
        <span style={{ color }}>{name}</span>
        <span>Lv {level}</span>
      </div>
      <div className="h-1.5 bg-oav-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
