import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode } from '../types/preferences';

interface ModeStore {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggle: () => void;
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set) => ({
      mode: 'gamified',
      setMode: (mode) => {
        document.documentElement.setAttribute('data-mode', mode);
        set({ mode });
        const apiBase = import.meta.env?.VITE_API_URL ?? 'http://localhost:8000';
        const apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('oav_token') ?? '' : '';
        if (apiKey) {
          fetch(`${apiBase}/api/users/me/preferences`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ mode }),
          }).catch(() => {});
        }
      },
      toggle: () => {
        const current = useModeStore.getState().mode;
        useModeStore.getState().setMode(current === 'gamified' ? 'professional' : 'gamified');
      },
    }),
    { name: 'oav-mode' }
  )
);
