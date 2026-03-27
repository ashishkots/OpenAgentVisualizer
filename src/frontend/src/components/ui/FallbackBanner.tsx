import { useRef } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { gsap } from 'gsap';
import { animateSafe } from '../../canvas/animations/gsapAnimations';

type BannerVariant = 'warning' | '3d';

interface FallbackBannerProps {
  productName: string;
  fallbackDescription?: string;
  variant?: BannerVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function FallbackBanner({
  productName,
  fallbackDescription,
  variant = 'warning',
  dismissible = false,
  onDismiss,
  className,
}: FallbackBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    animateSafe(() => {
      gsap.to(bannerRef.current, {
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: onDismiss,
      });
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDismiss?.();
    }
  };

  if (variant === '3d') {
    return (
      <div
        ref={bannerRef}
        className={clsx('relative z-30 mx-4 mt-4 mb-0', className)}
        role="status"
        aria-live="polite"
        data-testid="fallback-banner-3d"
      >
        <div className="flex items-start gap-3 bg-oav-3d/10 border border-oav-3d/30 rounded-xl px-4 py-3 text-sm">
          <Info className="w-4 h-4 text-oav-3d shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <span className="text-oav-text">3D viewer unavailable — showing 2D view.</span>
            <a
              href="/settings?tab=integrations"
              className="ml-2 text-oav-3d hover:underline font-medium text-xs"
            >
              Configure 3D →
            </a>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="text-oav-muted hover:text-oav-text transition-colors shrink-0 p-0.5 focus-visible:ring-2 focus-visible:ring-oav-accent rounded"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={bannerRef}
      className={clsx(
        'flex items-start gap-3 bg-oav-warning/10 border border-oav-warning/30 rounded-xl px-4 py-3 text-sm',
        className,
      )}
      role="alert"
      data-testid="fallback-banner"
    >
      <AlertTriangle className="w-4 h-4 text-oav-warning shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-oav-text font-medium">{productName} connection unavailable.</p>
        {fallbackDescription && (
          <p className="text-oav-muted text-xs mt-0.5">{fallbackDescription}</p>
        )}
        <a
          href="/settings?tab=integrations"
          className="text-oav-warning text-xs hover:underline mt-1 inline-block font-medium"
        >
          Configure {productName} →
        </a>
      </div>
    </div>
  );
}
