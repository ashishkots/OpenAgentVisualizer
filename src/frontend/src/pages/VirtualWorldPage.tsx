import { useState } from 'react';
import { WorldCanvas } from '../canvas/WorldCanvas';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWorkspace } from '../hooks/useWorkspace';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { SampleDataBanner } from '../components/onboarding/SampleDataBanner';
import { useOnboardingStore } from '../stores/onboardingStore';

type CanvasMode = '2D' | '2.5D' | '3D';

export function VirtualWorldPage() {
  const [mode, setMode] = useState<CanvasMode>('2D');
  const workspaceId = localStorage.getItem('oav_workspace') ?? '';
  const { data: ws } = useWorkspace();
  const { completed } = useOnboardingStore();
  const canUse3D = ws?.tier === 'pro' || ws?.tier === 'enterprise';

  useWebSocket(workspaceId || null);

  return (
    <div className="flex flex-col h-full">
      <SampleDataBanner />

      {/* Mode toggle bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'var(--oav-border)' }}>
        {(['2D', '2.5D', '3D'] as CanvasMode[]).map(m => {
          const locked = m === '3D' && !canUse3D;
          return (
            <button
              key={m}
              onClick={() => !locked && setMode(m)}
              disabled={locked}
              title={locked ? 'Upgrade to Pro for 3D mode' : undefined}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={mode === m ? { background: 'var(--oav-selected)' } : undefined}
            >
              {m}
              {locked && <span className="ml-1 opacity-60" aria-label="locked">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Canvas area — only one renderer mounted at a time */}
      <div className="flex-1 relative">
        {mode === '2D' && workspaceId && <WorldCanvas workspaceId={workspaceId} />}
        {mode === '2.5D' && (
          <div className="w-full h-full flex items-center justify-center text-oav-muted text-sm">
            Three.js 2.5D — Task C1
          </div>
        )}
        {mode === '3D' && canUse3D && (
          <div className="w-full h-full flex items-center justify-center text-oav-muted text-sm">
            UE5 Pixel Streaming — Task C5
          </div>
        )}
      </div>

      {/* Onboarding wizard (modal overlay) */}
      {!completed && <OnboardingWizard />}
    </div>
  );
}
