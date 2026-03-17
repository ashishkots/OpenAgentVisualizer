import { create } from 'zustand';

interface UIStore {
  selectedAgentId: string | null;
  isPanelOpen: boolean;
  zoomLevel: number;
  selectAgent: (id: string | null) => void;
  setZoom: (level: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedAgentId: null,
  isPanelOpen: false,
  zoomLevel: 1,
  selectAgent: (id) => set({ selectedAgentId: id, isPanelOpen: id !== null }),
  setZoom: (level) => set({ zoomLevel: Math.max(0, Math.min(2, level)) }),
}));
