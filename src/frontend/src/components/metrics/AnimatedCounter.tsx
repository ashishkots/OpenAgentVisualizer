import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });

  useEffect(() => {
    gsap.to(obj.current, {
      val: value,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = prefix + obj.current.val.toFixed(decimals) + suffix;
      },
    });
  }, [value, prefix, suffix, decimals]);

  return (
    <span data-testid="counter" ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
