// ReplayPage is deprecated in Sprint 2 — replaced by SessionsPage (/sessions)
import { Navigate } from 'react-router-dom';

export function ReplayPage() {
  return <Navigate to="/sessions" replace />;
}
