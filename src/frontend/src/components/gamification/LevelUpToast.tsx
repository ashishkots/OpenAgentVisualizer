import { useEffect } from 'react';
interface Props { agentName: string; newLevel: number; onDone: () => void; }
export function LevelUpToast({ agentName, newLevel, onDone }: Props) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-bounce text-center pointer-events-auto">
        <div className="text-6xl mb-2">🎉</div>
        <div className="rounded-xl border px-8 py-4" style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-accent)', boxShadow: '0 0 40px var(--oav-glow)' }}>
          <p className="text-oav-accent font-bold text-xl">LEVEL UP!</p>
          <p className="text-oav-text text-sm mt-1">{agentName} reached <span className="font-bold text-oav-accent">Level {newLevel}</span></p>
        </div>
      </div>
    </div>
  );
}
