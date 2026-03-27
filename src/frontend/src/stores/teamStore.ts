import { create } from 'zustand';

interface TeamStore {
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  selectedTeamId: null,
  setSelectedTeamId: (id) => set({ selectedTeamId: id }),
}));
