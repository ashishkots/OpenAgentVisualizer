import { clsx } from 'clsx';
import { xpProgress } from '../../lib/xpLevels';

interface Props {
  xpTotal: number;
  size?: 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

export function XPBar({ xpTotal, size = 'sm', showLabels = false, className }: Props) {
  const { level, progress, currentXP, nextLevelXP, isMaxLevel } = xpProgress(xpTotal);
  const isGold = level >= 5;
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  const fillGradient = isMaxLevel
    ? 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)'
    : isGold
      ? 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)'
      : 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)';

  const fillWidth = isMaxLevel ? '100%' : `${Math.min(100, Math.max(0, progress * 100))}%`;

  return (
    <div className={clsx('w-full', className)}>
      {showLabels && (
        <div className="flex justify-between text-xs text-oav-muted mb-1">
          <span>{isMaxLevel ? 'MAX' : `${currentXP} XP`}</span>
          {!isMaxLevel && <span>{nextLevelXP} XP</span>}
        </div>
      )}
      <div
        className={clsx('w-full bg-oav-bg rounded-full overflow-hidden', heightClass)}
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isMaxLevel ? 'Maximum level reached' : `XP progress: ${Math.round(progress * 100)}%`}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out')}
          style={{ width: fillWidth, background: fillGradient }}
        />
      </div>
    </div>
  );
}
