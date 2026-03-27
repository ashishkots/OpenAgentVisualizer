import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import { animateSafe } from '../../canvas/animations/gsapAnimations';
import type { SecurityGrade } from '../../types/security';

interface GradeBadgeProps {
  grade: SecurityGrade;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const GRADE_CLASSES: Record<SecurityGrade, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-oav-success/20',   text: 'text-oav-success',   border: 'border-oav-success/40'   },
  B: { bg: 'bg-oav-knowledge/20', text: 'text-oav-knowledge', border: 'border-oav-knowledge/40' },
  C: { bg: 'bg-oav-warning/20',   text: 'text-oav-warning',   border: 'border-oav-warning/40'   },
  D: { bg: 'bg-oav-shield/20',    text: 'text-oav-shield',    border: 'border-oav-shield/40'    },
  F: { bg: 'bg-oav-error/20',     text: 'text-oav-error',     border: 'border-oav-error/40'     },
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', { container: string; text: string }> = {
  sm: { container: 'w-6 h-6',   text: 'text-xs'  },
  md: { container: 'w-8 h-8',   text: 'text-sm'  },
  lg: { container: 'w-12 h-12', text: 'text-lg'  },
};

export function GradeBadge({ grade, size = 'md', animate = false, className }: GradeBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prevGrade = useRef<SecurityGrade>(grade);

  useEffect(() => {
    if (animate && prevGrade.current !== grade && ref.current) {
      animateSafe(() => {
        gsap.timeline()
          .to(ref.current!, { scale: 1.2, duration: 0.2, ease: 'power2.out' })
          .to(ref.current!, { scale: 1.0, duration: 0.2, ease: 'power2.in' });
      });
    }
    prevGrade.current = grade;
  }, [grade, animate]);

  const { bg, text, border } = GRADE_CLASSES[grade] ?? GRADE_CLASSES.F;
  const { container, text: textSize } = SIZE_CLASSES[size];

  return (
    <div
      ref={ref}
      className={clsx(
        'rounded-full flex items-center justify-center font-bold border',
        container,
        bg,
        text,
        border,
        textSize,
        className,
      )}
      aria-label={`Grade ${grade}`}
    >
      {grade}
    </div>
  );
}
