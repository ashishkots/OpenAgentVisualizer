import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import { animateSafe } from '../../canvas/animations/gsapAnimations';

interface SlideInPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: '320' | '360';
  children: React.ReactNode;
  'data-testid'?: string;
}

export function SlideInPanel({
  open,
  onClose,
  title,
  width = '360',
  children,
  'data-testid': testId,
}: SlideInPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop || !mounted) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (open) {
      gsap.set(panel, { x: '100%' });
      gsap.set(backdrop, { opacity: 0, pointerEvents: 'auto' });
      if (reducedMotion) {
        gsap.set(panel, { x: '0%' });
        gsap.set(backdrop, { opacity: 1 });
      } else {
        animateSafe(() => {
          gsap.to(panel, { x: '0%', duration: 0.3, ease: 'power2.out' });
          gsap.to(backdrop, { opacity: 1, duration: 0.2 });
        });
      }
    } else {
      gsap.set(backdrop, { pointerEvents: 'none' });
      if (reducedMotion) {
        setMounted(false);
      } else {
        animateSafe(() => {
          gsap.to(panel, {
            x: '100%',
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => setMounted(false),
          });
          gsap.to(backdrop, { opacity: 0, duration: 0.2 });
        });
      }
    }
  }, [open, mounted]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/30 z-[44] backdrop-blur-[1px]"
        style={{ opacity: 0, pointerEvents: 'none' }}
        onClick={onClose}
        aria-hidden="true"
        data-testid="slide-panel-backdrop"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={clsx(
          'fixed top-0 right-0 h-full z-[45]',
          'bg-oav-surface-elevated border-l border-oav-border shadow-2xl',
          'flex flex-col overflow-hidden',
          width === '360' ? 'w-[360px]' : 'w-80',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        style={{ transform: 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-oav-border shrink-0">
          <h2 className="text-sm font-semibold text-oav-text truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-oav-muted hover:text-oav-text transition-colors p-1 focus-visible:ring-2 focus-visible:ring-oav-accent rounded shrink-0"
            data-testid="slide-panel-close"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {children}
        </div>
      </div>
    </>
  );
}
