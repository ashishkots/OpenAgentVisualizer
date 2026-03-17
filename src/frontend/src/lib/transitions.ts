import { gsap } from 'gsap';

export function pageEnter(el: HTMLElement): void {
  gsap.fromTo(
    el,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out', clearProps: 'all' }
  );
}

export function pageLeave(el: HTMLElement, onComplete: () => void): void {
  gsap.to(el, { opacity: 0, y: -8, duration: 0.15, ease: 'power2.in', onComplete });
}
