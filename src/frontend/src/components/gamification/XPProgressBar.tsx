// Thin wrapper — delegates to XPBar ui component for backward compat
import { XPBar } from '../ui/XPBar';

export function XPProgressBar({ xpTotal }: { xpTotal: number }) {
  return <XPBar xpTotal={xpTotal} size="sm" showLabels />;
}
