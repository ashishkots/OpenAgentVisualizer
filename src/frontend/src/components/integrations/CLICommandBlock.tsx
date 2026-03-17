export function CLICommandBlock({ command }: { command: string }) {
  const copy = () => navigator.clipboard.writeText(command);
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs"
      style={{ background: 'var(--oav-surface-2)' }}>
      <span className="text-oav-muted select-none">$</span>
      <code className="text-oav-text flex-1 truncate">{command}</code>
      <button onClick={copy} title="Copy" className="text-oav-muted hover:text-oav-text transition-colors shrink-0">⧉</button>
    </div>
  );
}
