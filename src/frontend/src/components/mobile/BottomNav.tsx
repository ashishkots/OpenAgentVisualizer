import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  Bot,
  Bell,
  Menu,
  Trophy,
  BarChart2,
  Play,
  Settings,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

interface TabItem {
  to: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  label: string;
}

const PRIMARY_TABS: TabItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/world',     icon: Globe,           label: 'Canvas'    },
  { to: '/agents',    icon: Bot,             label: 'Agents'    },
  { to: '/alerts',    icon: Bell,            label: 'Alerts'    },
];

const MORE_ITEMS: TabItem[] = [
  { to: '/leaderboard', icon: Trophy,   label: 'Leaderboard' },
  { to: '/analytics',   icon: BarChart2, label: 'Analytics'  },
  { to: '/sessions',    icon: Play,      label: 'Sessions'   },
  { to: '/settings',    icon: Settings,  label: 'Settings'   },
];

function isActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(to + '/');
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some((item) => isActive(location.pathname, item.to));

  const handleMoreItemClick = (to: string) => {
    setMoreOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* "More" upward menu overlay */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-30"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* "More" upward expansion panel */}
      {moreOpen && (
        <div
          className={clsx(
            'md:hidden fixed bottom-14 right-0 left-0 z-40',
            'bg-oav-surface border-t border-oav-border shadow-2xl',
            'flex flex-col py-1',
          )}
          role="menu"
          aria-label="More navigation options"
        >
          {MORE_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = isActive(location.pathname, to);
            return (
              <button
                key={to}
                role="menuitem"
                onClick={() => handleMoreItemClick(to)}
                className={clsx(
                  'flex items-center gap-3 px-5 py-3 text-sm transition-colors',
                  'min-h-[44px] focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-inset focus-visible:outline-none',
                  active
                    ? 'text-oav-accent bg-oav-accent/10'
                    : 'text-oav-text hover:bg-oav-surface-hover',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden={true} />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
        className={clsx(
          'md:hidden fixed bottom-0 left-0 right-0 z-40',
          'bg-oav-surface border-t border-oav-border',
          'flex items-stretch',
          'min-h-[56px]',
        )}
        aria-label="Mobile navigation"
      >
        {PRIMARY_TABS.map(({ to, icon: Icon, label }) => {
          const active = isActive(location.pathname, to);
          return (
            <button
              key={to}
              onClick={() => {
                setMoreOpen(false);
                navigate(to);
              }}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2',
                'text-[10px] font-medium transition-colors',
                'min-h-[44px] min-w-[44px]',
                'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-inset focus-visible:outline-none',
                active ? 'text-oav-accent' : 'text-oav-muted',
              )}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden={true} />
              {active && (
                <span
                  className="absolute bottom-0 h-[2px] w-8 rounded-full bg-oav-accent"
                  aria-hidden="true"
                />
              )}
              <span>{label}</span>
            </button>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative',
            'text-[10px] font-medium transition-colors',
            'min-h-[44px] min-w-[44px]',
            'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:ring-inset focus-visible:outline-none',
            moreOpen || isMoreActive ? 'text-oav-accent' : 'text-oav-muted',
          )}
          aria-label="More navigation options"
          aria-expanded={moreOpen}
          aria-haspopup="menu"
        >
          {moreOpen ? (
            <X className="w-5 h-5" aria-hidden={true} />
          ) : (
            <Menu className="w-5 h-5" aria-hidden={true} />
          )}
          {(moreOpen || isMoreActive) && (
            <span
              className="absolute bottom-0 h-[2px] w-8 rounded-full bg-oav-accent"
              aria-hidden="true"
            />
          )}
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
