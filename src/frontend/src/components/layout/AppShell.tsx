import { useState, Suspense, lazy } from 'react';
import { Link, useLocation, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useMode } from '../../hooks/useMode';

const VirtualWorldPage = lazy(() => import('../../pages/VirtualWorldPage').then(m => ({ default: m.VirtualWorldPage })));
const DashboardPage    = lazy(() => import('../../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AlertsPage       = lazy(() => import('../../pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const ReplayPage       = lazy(() => import('../../pages/ReplayPage').then(m => ({ default: m.ReplayPage })));
const SettingsPage     = lazy(() => import('../../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const NAV = [
  { to: '/world',     label: 'World',     icon: '⬡' },
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/alerts',    label: 'Alerts',    icon: '⚠' },
  { to: '/replay',    label: 'Replay',    icon: '▶' },
  { to: '/settings',  label: 'Settings',  icon: '⚙' },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { mode, toggle } = useMode();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('oav_token');
    localStorage.removeItem('oav_workspace');
    navigate('/login');
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--oav-bg)' }}>
      {/* Sidebar */}
      <nav
        data-testid="sidebar"
        className={`flex flex-col py-4 border-r transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
        style={{ background: 'var(--oav-surface)', borderColor: 'var(--oav-border)' }}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-3 mb-6">
          {!collapsed && <span className="text-oav-text font-bold text-sm">OAV</span>}
          <button
            aria-label="toggle sidebar"
            onClick={() => setCollapsed(c => !c)}
            className="text-oav-muted hover:text-oav-text text-xs"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 flex flex-col gap-1 px-2">
          {NAV.map(({ to, label, icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${
                  active ? 'text-oav-accent' : 'text-oav-muted hover:text-oav-text'
                }`}
                style={active ? { background: 'var(--oav-selected)' } : undefined}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Mode toggle + logout */}
        <div className="px-2 space-y-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-oav-muted hover:text-oav-text text-sm transition-colors"
          >
            <span className="w-5 text-center">{mode === 'gamified' ? '🎮' : '💼'}</span>
            {!collapsed && <span className="capitalize">{mode}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-oav-error hover:opacity-80 text-sm"
          >
            <span className="w-5 text-center">↩</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-oav-muted text-sm">Loading…</div>}>
          <Routes>
            <Route path="/world"     element={<VirtualWorldPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts"    element={<AlertsPage />} />
            <Route path="/replay"    element={<ReplayPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="*"          element={<Navigate to="/world" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
