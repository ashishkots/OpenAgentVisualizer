import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { AgentAvatar } from '../ui/AgentAvatar';
import { getLevelName } from '../../lib/xpLevels';
import { triggerScreenFlash } from '../../canvas/animations/gsapAnimations';
import type { LevelUp } from '../../types/gamification';

interface Props {
  event: LevelUp;
  onDismiss: () => void;
}

export function LevelUpToast({ event, onDismiss }: Props) {
  const toastRef = useRef<HTMLDivElement>(null);
  const isTranscendent = event.new_level >= 10;

  useEffect(() => {
    const el = toastRef.current;
    if (!el) return;

    gsap.from(el, {
      y: 20,
      scale: 0.8,
      opacity: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });

    if (isTranscendent) {
      triggerScreenFlash();
    }

    const timer = setTimeout(() => {
      if (!el) return;
      gsap.to(el, {
        y: 10,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: onDismiss,
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss, isTranscendent]);

  const levelTitle = getLevelName(event.new_level);

  return (
    <div
      ref={toastRef}
      className="flex items-center gap-4 w-80 max-w-[90vw] bg-oav-surface border border-oav-gold/60 rounded-xl p-4 shadow-xl"
      role="alert"
      aria-live="polite"
    >
      <AgentAvatar
        name={event.agent_name}
        level={event.new_level}
        size="md"
      />
      <div>
        <p className="text-xs text-oav-gold font-medium uppercase tracking-wide mb-0.5">
          Level Up!
        </p>
        <p className="text-sm font-bold text-oav-text">{event.agent_name}</p>
        <p className="text-xs text-oav-muted">
          Reached Level {event.new_level} — {levelTitle}
        </p>
      </div>
    </div>
  );
}
