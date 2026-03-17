import { useOnboardingStore } from '../../stores/onboardingStore';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { Workspace } from '../../hooks/useWorkspace';

const STEPS = [
  { title: 'Welcome to OpenAgentVisualizer', body: 'Watch your AI agents come alive in a virtual workspace.' },
  { title: 'Your workspace is ready', body: 'A default workspace has been created for you.' },
  { title: 'Copy your API key', body: 'Use this key to connect agents from your code.' },
  { title: 'Install the SDK', body: 'pip install openagentvisualizer' },
  { title: 'See your first agent', body: 'Loading sample data so you can explore...' },
];

export function OnboardingWizard() {
  const { completed, currentStep, advance, complete, activateSampleData } = useOnboardingStore();
  const { data: ws } = useWorkspace();
  if (completed) return null;

  const isLast = currentStep === STEPS.length;
  const handleNext = () => {
    if (isLast) { activateSampleData(); complete(); }
    else advance();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl border p-8 space-y-6"
        style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}>
        <div className="flex gap-2 justify-center">
          {[1,2,3,4,5].map(s => (
            <div key={s} className="h-1.5 w-8 rounded-full transition-all"
              style={{ background: s <= currentStep ? 'var(--oav-accent)' : 'var(--oav-surface-2)' }} />
          ))}
        </div>
        <div>
          <p className="text-oav-text font-bold text-lg">{STEPS[currentStep - 1].title}</p>
          <p className="text-oav-muted text-sm mt-2">{STEPS[currentStep - 1].body}</p>
          {currentStep === 3 && ws && (
            <div className="mt-3 rounded-lg px-3 py-2 font-mono text-xs"
              style={{ background: 'var(--oav-surface-2)', color: 'var(--oav-accent)' }}>
              {ws.api_key}
            </div>
          )}
        </div>
        <button onClick={handleNext}
          className="w-full py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--oav-accent)', color: '#000' }}>
          {isLast ? 'Explore with sample data →' : 'Next →'}
        </button>
        <button onClick={complete} className="w-full text-xs text-oav-muted hover:text-oav-text transition-colors">
          Skip onboarding
        </button>
      </div>
    </div>
  );
}
