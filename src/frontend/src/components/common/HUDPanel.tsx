interface Props { children: React.ReactNode; className?: string; }
export function HUDPanel({ children, className = '' }: Props) {
  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
      style={{
        background: 'var(--oav-surface)',
        borderColor: 'var(--oav-border)',
        boxShadow: '0 0 12px var(--oav-glow)',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}
    >
      {children}
    </div>
  );
}
