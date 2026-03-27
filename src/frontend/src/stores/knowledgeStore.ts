import { create } from 'zustand';
import type { KnowledgeGraph, KnowledgeEntity, EntityType } from '../types/knowledge';

interface KnowledgeStore {
  graph: KnowledgeGraph | null;
  selectedEntity: KnowledgeEntity | null;
  searchQuery: string;
  filterType: EntityType | 'all';
  searchResults: KnowledgeEntity[];
  displayedCount: number;

  setGraph: (graph: KnowledgeGraph) => void;
  setSelectedEntity: (entity: KnowledgeEntity | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: EntityType | 'all') => void;
  setSearchResults: (results: KnowledgeEntity[]) => void;
  loadMore: () => void;
  reset: () => void;
}

const PAGE_SIZE = 50;

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  graph: null,
  selectedEntity: null,
  searchQuery: '',
  filterType: 'all',
  searchResults: [],
  displayedCount: PAGE_SIZE,

  setGraph: (graph) => set({ graph }),

  setSelectedEntity: (entity) => set({ selectedEntity: entity }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterType: (type) => set({ filterType: type }),

  setSearchResults: (results) => set({ searchResults: results }),

  loadMore: () => set((s) => ({ displayedCount: s.displayedCount + PAGE_SIZE })),

  reset: () =>
    set({
      graph: null,
      selectedEntity: null,
      searchQuery: '',
      filterType: 'all',
      searchResults: [],
      displayedCount: PAGE_SIZE,
    }),
}));
