import { useEffect } from 'react';
import { useModeStore } from '../stores/modeStore';

export function useMode() {
  const { mode, setMode, toggle } = useModeStore();
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);
  return { mode, setMode, toggle };
}
