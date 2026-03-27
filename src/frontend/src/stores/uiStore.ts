import { create } from 'zustand';

interface UIStore {
  selectedAgentId: string | null;
  isPanelOpen: boolean;
  isSidebarExpanded: boolean;
  zoomLevel: number;
  breadcrumb: { label: string; href?: string }[];
  selectAgent: (id: string | null) => void;
  setZoom: (level: number) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setBreadcrumb: (crumbs: { label: string; href?: string }[]) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedAgentId: null,
  isPanelOpen: false,
  isSidebarExpanded: false,
  zoomLevel: 1,
  breadcrumb: [],

  selectAgent: (id) =>
    set({ selectedAgentId: id, isPanelOpen: id !== null }),

  setZoom: (level) =>
    set({ zoomLevel: Math.max(0.25, Math.min(4, level)) }),

  setSidebarExpanded: (expanded) =>
    set({ isSidebarExpanded: expanded }),

  setBreadcrumb: (crumbs) =>
    set({ breadcrumb: crumbs }),
}));
