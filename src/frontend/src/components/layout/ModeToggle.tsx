import { useMode } from '../../hooks/useMode';

export function ModeToggle() {
  const { mode, toggle } = useMode();
  return (
    <button
      onClick={toggle}
      title={`Switch to ${mode === 'gamified' ? 'professional' : 'gamified'} mode`}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
      style={{ borderColor: 'var(--oav-border)', background: 'var(--oav-surface-2)', color: 'var(--oav-text)' }}
    >
      <span>{mode === 'gamified' ? '🎮' : '💼'}</span>
      <span className="capitalize hidden sm:block">{mode}</span>
    </button>
  );
}
