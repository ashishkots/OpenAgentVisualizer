import { useWorkspace } from '../../hooks/useWorkspace';

export function WorkspaceSwitcher() {
  const ws = useWorkspace();
  if (!ws) return <div className="skeleton h-6 w-24" />;
  return (
    <button
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{ background: 'var(--oav-surface-2)', color: 'var(--oav-text)' }}
    >
      <span className="w-5 h-5 rounded bg-oav-accent text-white flex items-center justify-center text-xs font-bold">
        {ws.name[0].toUpperCase()}
      </span>
      <span className="hidden sm:block max-w-[120px] truncate">{ws.name}</span>
    </button>
  );
}
