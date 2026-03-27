import { useOnboardingStore } from '../../stores/onboardingStore';
export function SampleDataBanner() {
  const { sampleDataActive, reset } = useOnboardingStore();
  if (!sampleDataActive) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs border-b"
      style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'var(--oav-border)', color: 'var(--oav-accent)' }}>
      <span>⬡ Using sample data — connect your first agent to see real activity</span>
      <button onClick={reset} className="text-oav-muted hover:text-oav-text ml-4">Dismiss</button>
    </div>
  );
}
