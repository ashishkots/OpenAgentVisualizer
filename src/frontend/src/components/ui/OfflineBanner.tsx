import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * OfflineBanner — displays a fixed top banner when the browser loses network
 * connectivity. Listens to the `online` / `offline` window events and reads
 * the initial state from `navigator.onLine`.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={clsx(
        'fixed top-0 left-0 right-0 z-[70]',
        'flex items-center justify-center gap-2 px-4 py-2',
        'bg-oav-warning text-oav-bg text-sm font-medium',
        'animate-[offline-banner-in_0.3s_ease-out_forwards]',
      )}
      data-testid="offline-banner"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>You are offline. Some features may be unavailable.</span>
    </div>
  );
}
