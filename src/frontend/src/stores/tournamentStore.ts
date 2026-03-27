import { create } from 'zustand';
import type { TournamentStatus } from '../types/tournament';

interface TournamentStore {
  activeTab: TournamentStatus;
  setActiveTab: (tab: TournamentStatus) => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  activeTab: 'upcoming',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
