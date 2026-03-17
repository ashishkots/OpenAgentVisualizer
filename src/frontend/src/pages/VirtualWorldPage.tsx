import { useState } from 'react';
import { WorldCanvas } from '../canvas/WorldCanvas';
import { ThreeCanvas } from '../canvas/three/ThreeCanvas';
import { PixelStreamingEmbed } from '../components/canvas/PixelStreamingEmbed';
import { useWorkspace } from '../hooks/useWorkspace';

type CanvasMode = '2d' | '2.5d' | '3d';

export function VirtualWorldPage() {
  const [mode, setMode] = useState<CanvasMode>('2d');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { workspaceId, tier } = useWorkspace();
  const canUse3D = tier === 'pro' || tier === 'team' || tier === 'enterprise';
  const signallingUrl = (import.meta as any).env?.VITE_PS_SIGNALLING_URL ?? '';

  return (
    <div className="w-full h-full flex flex-col bg-[var(--oav-bg)]">
      {/* Mode toggle bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--oav-border)] shrink-0">
        <span className="text-xs text-[var(--oav-muted)] mr-2">View:</span>
        {(['2d', '2.5d'] as CanvasMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              mode === m
                ? 'bg-[var(--oav-accent)]/15 text-[var(--oav-accent)]'
                : 'text-[var(--oav-muted)] hover:text-[var(--oav-text)]'
            }`}
          >
            {m === '2d' ? '2D' : '2.5D'}
          </button>
        ))}
        {/* 3D — locked for non-Pro */}
        {canUse3D ? (
          <button
            onClick={() => setMode('3d')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              mode === '3d'
                ? 'bg-[var(--oav-accent)]/15 text-[var(--oav-accent)]'
                : 'text-[var(--oav-muted)] hover:text-[var(--oav-text)]'
            }`}
          >
            3D
          </button>
        ) : (
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="text-xs px-3 py-1.5 rounded-lg text-[var(--oav-muted)]/60 hover:text-[var(--oav-muted)] cursor-pointer flex items-center gap-1"
            title="Upgrade to Pro for UE5 3D view"
          >
            3D
            <span className="bg-[var(--oav-accent)]/20 text-[var(--oav-accent)] text-[10px] px-1 rounded">Pro</span>
          </button>
        )}
      </div>

      {/* Upgrade prompt banner */}
      {showUpgradePrompt && !canUse3D && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--oav-accent)]/10 border-b border-[var(--oav-accent)]/20 shrink-0">
          <span className="text-xs text-[var(--oav-text)]">
            UE5 3D view requires Pro or Enterprise. Upgrade to unlock real-time 3D and Pixel Streaming.
          </span>
          <button
            onClick={() => setShowUpgradePrompt(false)}
            className="ml-auto text-xs text-[var(--oav-muted)] hover:text-[var(--oav-text)]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Canvas area — mount/unmount (NOT show/hide) to prevent WebGL context leaks */}
      <div className="flex-1 relative overflow-hidden">
        {mode === '2d' && (
          <WorldCanvas workspaceId={workspaceId ?? ''} />
        )}
        {mode === '2.5d' && (
          <ThreeCanvas workspaceId={workspaceId ?? ''} />
        )}
        {mode === '3d' && canUse3D && (
          <PixelStreamingEmbed signallingUrl={signallingUrl} workspaceId={workspaceId ?? ''} />
        )}
      </div>
    </div>
  );
}
