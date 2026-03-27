import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

const TOUR_STORAGE_KEY = 'oav-tour-completed';

// ------------------------------------------------------------------
// Tour stops definition
// ------------------------------------------------------------------
interface TourStop {
  target: string; // data-tour attribute selector
  title: string;
  description: string;
}

const TOUR_STOPS: TourStop[] = [
  {
    target: 'sidebar-nav',
    title: 'Navigation',
    description: 'Jump between views: Dashboard, 2D World, Topology, Leaderboard and more.',
  },
  {
    target: 'agent-grid',
    title: 'Agent Grid',
    description: 'All your registered agents at a glance. Click any card to inspect it.',
  },
  {
    target: 'canvas-view',
    title: 'Live Canvas',
    description: 'Watch agents move through your virtual world in real time.',
  },
  {
    target: 'leaderboard-nav',
    title: 'Leaderboard',
    description: 'See which agents earned the most XP. Gamify your team.',
  },
  {
    target: 'alerts-nav',
    title: 'Alerts',
    description: 'Critical and warning alerts surface here so nothing slips through.',
  },
  {
    target: 'settings-nav',
    title: 'Settings',
    description: 'Manage API keys, integrations, workspace members and more.',
  },
];

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------
interface TourContextValue {
  startTour: () => void;
  isTourActive: boolean;
}

const TourContext = createContext<TourContextValue>({
  startTour: () => undefined,
  isTourActive: false,
});

export function useTour() {
  return useContext(TourContext);
}

// ------------------------------------------------------------------
// Tooltip
// ------------------------------------------------------------------
interface TooltipPos {
  top: number;
  left: number;
  arrowSide: 'top' | 'bottom' | 'left' | 'right';
}

function computePosition(rect: DOMRect): TooltipPos {
  const TIP_WIDTH = 280;
  const TIP_HEIGHT = 120; // rough estimate
  const OFFSET = 12;

  // Prefer placing below
  if (rect.bottom + TIP_HEIGHT + OFFSET < window.innerHeight) {
    return {
      top: rect.bottom + OFFSET,
      left: Math.min(
        Math.max(rect.left + rect.width / 2 - TIP_WIDTH / 2, 8),
        window.innerWidth - TIP_WIDTH - 8,
      ),
      arrowSide: 'top',
    };
  }
  // Otherwise above
  return {
    top: rect.top - TIP_HEIGHT - OFFSET,
    left: Math.min(
      Math.max(rect.left + rect.width / 2 - TIP_WIDTH / 2, 8),
      window.innerWidth - TIP_WIDTH - 8,
    ),
    arrowSide: 'bottom',
  };
}

interface TourTooltipProps {
  stop: TourStop;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}

function TourTooltip({ stop, index, total, onNext, onSkip }: TourTooltipProps) {
  const [pos, setPos] = useState<TooltipPos | null>(null);

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${stop.target}"]`);
    if (!el) {
      setPos({ top: window.innerHeight / 2 - 80, left: window.innerWidth / 2 - 140, arrowSide: 'top' });
      return;
    }
    const rect = el.getBoundingClientRect();
    setPos(computePosition(rect));

    // Highlight target
    el.classList.add('ring-2', 'ring-oav-accent', 'ring-offset-2', 'ring-offset-oav-bg', 'rounded-lg', 'z-[51]', 'relative');
    return () => {
      el.classList.remove('ring-2', 'ring-oav-accent', 'ring-offset-2', 'ring-offset-oav-bg', 'rounded-lg', 'z-[51]', 'relative');
    };
  }, [stop]);

  if (!pos) return null;

  const isLast = index === total - 1;

  return (
    <div
      className="fixed z-[55] w-[280px] bg-oav-surface border border-oav-border rounded-xl shadow-2xl p-4 animate-fade-in-up"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label={`Tour step ${index + 1}: ${stop.title}`}
    >
      {/* Arrow */}
      {pos.arrowSide === 'top' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-2 overflow-hidden">
          <div className="w-3 h-3 bg-oav-surface border-l border-t border-oav-border rotate-45 translate-y-1.5 translate-x-0" />
        </div>
      )}
      {pos.arrowSide === 'bottom' && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-2 overflow-hidden rotate-180">
          <div className="w-3 h-3 bg-oav-surface border-l border-t border-oav-border rotate-45 translate-y-1.5" />
        </div>
      )}

      {/* Close */}
      <button
        onClick={onSkip}
        className="absolute top-2 right-2 text-oav-muted hover:text-oav-text transition-colors"
        aria-label="Skip tour"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {/* Content */}
      <p className="text-sm font-semibold text-oav-text pr-6">{stop.title}</p>
      <p className="text-xs text-oav-muted mt-1 leading-relaxed">{stop.description}</p>

      {/* Progress dots */}
      <div className="flex items-center gap-1 mt-3">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={clsx(
              'h-1 rounded-full transition-all duration-200',
              i === index ? 'w-4 bg-oav-accent' : 'w-1.5 bg-oav-border',
            )}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <button
          onClick={onSkip}
          className="text-xs text-oav-muted hover:text-oav-text transition-colors"
        >
          Skip tour
        </button>
        <button
          onClick={onNext}
          className="text-xs font-semibold text-white bg-oav-accent rounded-lg px-3 py-1.5 hover:bg-oav-accent/80 transition-colors min-h-[32px]"
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------
export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStop, setCurrentStop] = useState(0);

  const startTour = useCallback(() => {
    if (localStorage.getItem(TOUR_STORAGE_KEY) === 'true') return;
    setCurrentStop(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    if (currentStop < TOUR_STOPS.length - 1) {
      setCurrentStop((s) => s + 1);
    } else {
      setIsActive(false);
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }
  }, [currentStop]);

  const skip = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  // Handle Escape key to skip
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isActive, skip]);

  const tooltipRef = useRef<HTMLDivElement>(null);

  return (
    <TourContext.Provider value={{ startTour, isTourActive: isActive }}>
      {children}

      {isActive && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-[54] bg-black/30"
            aria-hidden="true"
            onClick={skip}
          />
          <div ref={tooltipRef}>
            <TourTooltip
              stop={TOUR_STOPS[currentStop]}
              index={currentStop}
              total={TOUR_STOPS.length}
              onNext={next}
              onSkip={skip}
            />
          </div>
        </>
      )}
    </TourContext.Provider>
  );
}
