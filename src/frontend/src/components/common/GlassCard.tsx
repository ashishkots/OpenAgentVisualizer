interface Props { children: React.ReactNode; className?: string; onClick?: () => void; }
export function GlassCard({ children, className = '', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition-colors ${className}`}
      style={{ background: 'var(--oav-glass-bg)', borderColor: 'var(--oav-glass-border)', backdropFilter: 'blur(8px)' }}
    >
      {children}
    </div>
  );
}
