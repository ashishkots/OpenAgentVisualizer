import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const DRAG_CLOSE_THRESHOLD = 100; // px

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // All drag state lives in refs — no re-renders during gesture
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Mount/unmount logic
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

  // Handle closing: animate out then unmount
  useEffect(() => {
    if (!isOpen && mounted) {
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transition = 'transform 0.25s ease-in';
        sheet.style.transform = 'translateY(100%)';
        const id = setTimeout(() => setMounted(false), 260);
        return () => clearTimeout(id);
      } else {
        setMounted(false);
      }
    }
  }, [isOpen, mounted]);

  // Animate in when mounted and isOpen
  useEffect(() => {
    if (!mounted || !isOpen) return;
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;

    // Start off-screen
    sheet.style.transition = 'none';
    sheet.style.transform = 'translateY(100%)';
    backdrop.style.opacity = '0';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      sheet.style.transform = 'translateY(0)';
      backdrop.style.opacity = '1';
    } else {
      // Trigger reflow before animating
      void sheet.offsetHeight;
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
      backdrop.style.transition = 'opacity 0.2s ease-out';
      sheet.style.transform = 'translateY(0)';
      backdrop.style.opacity = '1';
    }
  }, [mounted, isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ---- Drag-to-dismiss handlers ----
  const handleDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    isDragging.current = true;
    const sheet = sheetRef.current;
    if (sheet) sheet.style.transition = 'none';
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging.current || dragStartY.current === null) return;
    const delta = Math.max(0, clientY - dragStartY.current);
    const sheet = sheetRef.current;
    if (sheet) sheet.style.transform = `translateY(${delta}px)`;
  };

  const handleDragEnd = useCallback((clientY: number) => {
    if (!isDragging.current || dragStartY.current === null) return;
    isDragging.current = false;
    const delta = Math.max(0, clientY - dragStartY.current);
    dragStartY.current = null;

    const sheet = sheetRef.current;
    if (delta > DRAG_CLOSE_THRESHOLD) {
      onClose();
    } else {
      // Snap back
      if (sheet) {
        sheet.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)';
        sheet.style.transform = 'translateY(0)';
      }
    }
  }, [onClose]);

  // Pointer events on drag handle
  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleDragStart(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    handleDragMove(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    handleDragEnd(e.clientY);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/50"
        style={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
        data-testid="bottom-sheet-backdrop"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Bottom sheet'}
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-oav-surface-elevated border-t border-oav-border',
          'rounded-t-2xl shadow-2xl',
          'flex flex-col',
          'max-h-[75vh]',
        )}
        style={{ transform: 'translateY(100%)' }}
        data-testid="bottom-sheet"
      >
        {/* Drag handle area */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-hidden="true"
          data-testid="bottom-sheet-handle"
        >
          <div className="w-10 h-1 rounded-full bg-oav-border" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-oav-border shrink-0">
            <h2 className="text-sm font-semibold text-oav-text">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className={clsx(
                'text-oav-muted hover:text-oav-text transition-colors',
                'p-1 rounded focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                'min-h-[44px] min-w-[44px] flex items-center justify-center',
              )}
              data-testid="bottom-sheet-close"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
