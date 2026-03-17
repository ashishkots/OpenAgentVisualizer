import { create } from 'zustand';
import type { AlertType } from '../types/gamification';

interface AlertStore {
  alerts: AlertType[];
  addAlert: (alert: AlertType) => void;
  resolveAlert: (alertId: string) => void;
  setAlerts: (alerts: AlertType[]) => void;
  reset: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
  resolveAlert: (alertId) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)),
    })),
  setAlerts: (alerts) => set({ alerts }),
  reset: () => set({ alerts: [] }),
}));
