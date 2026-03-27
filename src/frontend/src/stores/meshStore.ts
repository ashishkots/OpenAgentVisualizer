import { create } from 'zustand';
import type { MeshTopology, MeshNode } from '../types/mesh';

interface MeshStore {
  topology: MeshTopology | null;
  selectedNodeId: string | null;
  liveUpdateNodeIds: Set<string>; // nodes that recently updated (for pulse)
  liveUpdateEdgeIds: Set<string>; // edges that recently updated (for flash)
  period: '1h' | '24h' | '7d';

  setTopology: (topology: MeshTopology) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setPeriod: (period: '1h' | '24h' | '7d') => void;
  triggerNodeUpdate: (nodeId: string) => void;
  triggerEdgeUpdate: (edgeId: string) => void;
  reset: () => void;
}

export const useMeshStore = create<MeshStore>((set, get) => ({
  topology: null,
  selectedNodeId: null,
  liveUpdateNodeIds: new Set(),
  liveUpdateEdgeIds: new Set(),
  period: '1h',

  setTopology: (topology) => set({ topology }),

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setPeriod: (period) => set({ period }),

  triggerNodeUpdate: (nodeId) => {
    const updated = new Set(get().liveUpdateNodeIds);
    updated.add(nodeId);
    set({ liveUpdateNodeIds: updated });
    // Clear after animation duration
    setTimeout(() => {
      const s = new Set(get().liveUpdateNodeIds);
      s.delete(nodeId);
      set({ liveUpdateNodeIds: s });
    }, 700);
  },

  triggerEdgeUpdate: (edgeId) => {
    const updated = new Set(get().liveUpdateEdgeIds);
    updated.add(edgeId);
    set({ liveUpdateEdgeIds: updated });
    setTimeout(() => {
      const s = new Set(get().liveUpdateEdgeIds);
      s.delete(edgeId);
      set({ liveUpdateEdgeIds: s });
    }, 400);
  },

  reset: () =>
    set({
      topology: null,
      selectedNodeId: null,
      liveUpdateNodeIds: new Set(),
      liveUpdateEdgeIds: new Set(),
      period: '1h',
    }),
}));
