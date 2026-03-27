import { Link, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import {
  LayoutDashboard,
  Globe,
  Network,
  Trophy,
  BarChart2,
  Bell,
  Play,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { NotificationLayer } from '../gamification/NotificationLayer';
import { LoadingSpinner } from '../common/LoadingSpinner';

// Lazy load pages
const DashboardPage     = lazy(() => import('../../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const VirtualWorldPage  = lazy(() => import('../../pages/VirtualWorldPage').then(m => ({ default: m.VirtualWorldPage })));
const TopologyPage      = lazy(() => import('../../pages/TopologyPage').then(m => ({ default: m.TopologyPage })));
const LeaderboardPage   = lazy(() => import('../../pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const AnalyticsPage     = lazy(() => import('../../pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AlertsPage        = lazy(() => import('../../pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const SessionsPage      = lazy(() => import('../../pages/SessionsPage').then(m => ({ default: m.SessionsPage })));
const AgentDetailPage   = lazy(() => import('../../pages/AgentDetailPage').then(m => ({ default: m.AgentDetailPage })));
const SettingsPage      = lazy(() => import('../../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/world',      icon: Globe,           label: 'World'       },
  { to: '/topology',   icon: Network,         label: 'Topology'    },
  { to: '/leaderboard',icon: Trophy,          label: 'Leaderboard' },
  { to: '/analytics',  icon: BarChart2,       label: 'Analytics'   },
  { to: '/alerts',     icon: Bell,            label: 'Alerts'      },
  { to: '/sessions',   icon: Play,            label: 'Sessions'    },
] as const;

const BOTTOM_NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/world',       icon: Globe,           label: 'World'     },
  { to: '/topology',    icon: Network,         label: 'Topology'  },
  { to: '/leaderboard', icon: Trophy,          label: 'Board'     },
  { to: '/alerts',      icon: Bell,            label: 'Alerts'    },
] as const;

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('oav_token');
    localStorage.removeItem('oav_workspace');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-oav-bg overflow-hidden">
      {/* Desktop Sidebar */}
      <nav
        className={clsx(
          'hidden md:flex flex-col bg-oav-surface border-r border-oav-border py-4 z-40',
          'transition-all duration-200 ease-in-out shrink-0',
          isExpanded ? 'w-56' : 'w-16',
        )}
        aria-label="Main navigation"
      >
        {/* Logo / collapse toggle */}
        <div className="flex items-center px-3 mb-4">
          <Link
            to="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-oav-accent/20 text-oav-accent font-bold text-sm shrink-0"
            aria-label="OpenAgentVisualizer — go to dashboard"
          >
            OAV
          </Link>
          {isExpanded && (
            <span className="ml-3 text-sm font-semibold text-oav-text truncate">
              OpenAgentVisualizer
            </span>
          )}
          <button
            className="ml-auto text-oav-muted hover:text-oav-text transition-colors"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors',
                  'min-h-[44px] focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                  {
                    'text-oav-accent bg-oav-accent/10 border-l-[3px] border-l-oav-accent': active,
                    'text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover': !active,
                  },
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {isExpanded && (
                  <span className="font-medium truncate">{label}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom: settings + logout */}
        <div className="px-2 flex flex-col gap-1">
          <Link
            to="/settings"
            className={clsx(
              'flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]',
              location.pathname === '/settings'
                ? 'text-oav-accent bg-oav-accent/10'
                : 'text-oav-muted hover:text-oav-text hover:bg-oav-surface-hover',
            )}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 shrink-0" aria-hidden="true" />
            {isExpanded && <span className="font-medium">Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-oav-error hover:bg-oav-error/10 transition-colors min-h-[44px] w-full"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
            {isExpanded && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/dashboard"     element={<DashboardPage />} />
            <Route path="/world"         element={<VirtualWorldPage />} />
            <Route path="/topology"      element={<TopologyPage />} />
            <Route path="/leaderboard"   element={<LeaderboardPage />} />
            <Route path="/analytics"     element={<AnalyticsPage />} />
            <Route path="/alerts"        element={<AlertsPage />} />
            <Route path="/sessions"      element={<SessionsPage />} />
            <Route path="/sessions/:id"  element={<SessionsPage />} />
            <Route path="/agents/:id"    element={<AgentDetailPage />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="*"              element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-oav-surface border-t border-oav-border flex items-center z-40"
        aria-label="Mobile navigation"
      >
        {BOTTOM_NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors min-h-[44px]',
                active ? 'text-oav-accent' : 'text-oav-muted',
              )}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Gamification notification toasts */}
      <NotificationLayer />
    </div>
  );
}
