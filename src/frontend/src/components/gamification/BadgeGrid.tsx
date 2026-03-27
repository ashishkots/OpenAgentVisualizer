interface Badge { id: string; name: string; icon: string; unlocked: boolean; }
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {badges.map(b => (
        <div key={b.id} title={b.name}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-opacity ${b.unlocked ? 'opacity-100' : 'opacity-30 grayscale'}`}
          style={{ background: 'var(--oav-surface-2)' }}>
          <span className="text-2xl">{b.icon}</span>
          <span className="text-oav-muted text-[10px] leading-tight">{b.name}</span>
        </div>
      ))}
    </div>
  );
}
