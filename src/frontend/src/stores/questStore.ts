import { create } from 'zustand';
import type { QuestType } from '../types/quest';

interface QuestStore {
  activeTab: QuestType;
  setActiveTab: (tab: QuestType) => void;
}

export const useQuestStore = create<QuestStore>((set) => ({
  activeTab: 'daily',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
