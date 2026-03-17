import { useEffect, useRef } from 'react';

// GSAP is used dynamically to avoid SSR issues
interface Props {
  agentName: string;
  newLevel: number;
  newLevelName: string;
  onDone: () => void;
}

export function LevelUpToast({ agentName, newLevel, newLevelName, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Dynamically import GSAP to avoid test environment issues
    import('gsap').then(({ default: gsap }) => {
      gsap.fromTo(
        ref.current,
        { y: 40, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.7)',
          onComplete: () => {
            gsap.to(ref.current, {
              opacity: 0,
              delay: 2,
              duration: 0.3,
              onComplete: onDone,
            });
          },
        }
      );
    });
  }, [onDone]);

  return (
    <div
      ref={ref}
      className="fixed bottom-8 right-8 bg-oav-surface border border-oav-border rounded-xl px-6 py-4 shadow-xl z-50"
      style={{ opacity: 0 }}
    >
      <p className="text-oav-text font-bold">Level Up!</p>
      <p className="text-oav-muted text-sm">
        {agentName} reached Level {newLevel} — {newLevelName}
      </p>
    </div>
  );
}
