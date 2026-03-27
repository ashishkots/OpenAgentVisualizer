import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Award } from 'lucide-react';
import type { AchievementUnlock } from '../../types/gamification';

interface Props {
  event: AchievementUnlock;
  onDismiss: () => void;
}

export function AchievementToast({ event, onDismiss }: Props) {
  const toastRef = useRef<HTMLDivElement>(null);

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

    const timer = setTimeout(() => {
      if (!el) return;
      gsap.to(el, {
        y: 10,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: onDismiss,
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      ref={toastRef}
      className="flex items-start gap-3 w-80 max-w-[90vw] bg-oav-surface border border-oav-gold/40 rounded-xl p-4 shadow-xl"
      role="alert"
      aria-live="polite"
    >
      <div className="w-10 h-10 rounded-lg bg-oav-gold/10 border border-oav-gold/30 flex items-center justify-center shrink-0">
        <Award className="w-5 h-5 text-oav-gold" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-oav-gold font-medium mb-0.5">Achievement Unlocked</p>
        <p className="text-sm font-semibold text-oav-text">{event.achievement_name}</p>
        <p className="text-xs text-oav-muted">+{event.xp_bonus} XP bonus awarded</p>
      </div>
    </div>
  );
}
