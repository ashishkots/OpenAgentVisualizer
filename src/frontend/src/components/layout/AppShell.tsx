import { Link, useNavigate } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy import pages to avoid circular deps
const VirtualWorldPage = lazy(() => import('../../pages/VirtualWorldPage').then(m => ({ default: m.VirtualWorldPage })));
const DashboardPage = lazy(() => import('../../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AlertsPage = lazy(() => import('../../pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const ReplayPage = lazy(() => import('../../pages/ReplayPage').then(m => ({ default: m.ReplayPage })));

export function AppShell() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('oav_token');
    localStorage.removeItem('oav_workspace');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-oav-bg">
      {/* Sidebar */}
      <nav className="w-16 bg-oav-surface border-r border-oav-border flex flex-col items-center py-4 gap-4">
        <Link to="/world" className="text-oav-muted hover:text-oav-text text-xs">World</Link>
        <Link to="/dashboard" className="text-oav-muted hover:text-oav-text text-xs">Dash</Link>
        <Link to="/alerts" className="text-oav-muted hover:text-oav-text text-xs">Alerts</Link>
        <Link to="/replay" className="text-oav-muted hover:text-oav-text text-xs">Replay</Link>
        <button onClick={handleLogout} className="text-oav-error text-xs mt-auto">Logout</button>
      </nav>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-oav-muted">Loading...</div>}>
          <Routes>
            <Route path="/world" element={<VirtualWorldPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/replay" element={<ReplayPage />} />
            <Route path="*" element={<Navigate to="/world" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
