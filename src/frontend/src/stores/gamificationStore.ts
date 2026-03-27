import { create } from 'zustand';
import type {
  Achievement,
  AchievementUnlock,
  LevelUp,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardCategory,
} from '../types/gamification';

interface GamificationStore {
  // Leaderboard state
  leaderboard: LeaderboardEntry[];
  leaderboardPeriod: LeaderboardPeriod;
  leaderboardCategory: LeaderboardCategory;

  // Achievements per agent
  achievements: Record<string, Achievement[]>;

  // Toast queue
  pendingLevelUps: LevelUp[];
  pendingAchievements: AchievementUnlock[];

  // Actions
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setLeaderboardPeriod: (period: LeaderboardPeriod) => void;
  setLeaderboardCategory: (category: LeaderboardCategory) => void;
  setAgentAchievements: (agentId: string, achievements: Achievement[]) => void;
  unlockAchievement: (agentId: string, achievementKey: string) => void;

  // Toast queue management
  enqueueLevelUp: (event: LevelUp) => void;
  dequeueLevelUp: () => void;
  enqueueAchievement: (event: AchievementUnlock) => void;
  dequeueAchievement: () => void;

  reset: () => void;
}

export const useGamificationStore = create<GamificationStore>((set) => ({
  leaderboard: [],
  leaderboardPeriod: 'all_time',
  leaderboardCategory: 'xp',
  achievements: {},
  pendingLevelUps: [],
  pendingAchievements: [],

  setLeaderboard: (entries) => set({ leaderboard: entries }),

  setLeaderboardPeriod: (period) => set({ leaderboardPeriod: period }),

  setLeaderboardCategory: (category) => set({ leaderboardCategory: category }),

  setAgentAchievements: (agentId, achievements) =>
    set((s) => ({
      achievements: { ...s.achievements, [agentId]: achievements },
    })),

  unlockAchievement: (agentId, achievementKey) =>
    set((s) => {
      const existing = s.achievements[agentId] ?? [];
      const updated = existing.map((a) =>
        a.key === achievementKey
          ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() }
          : a
      );
      return { achievements: { ...s.achievements, [agentId]: updated } };
    }),

  enqueueLevelUp: (event) =>
    set((s) => ({ pendingLevelUps: [...s.pendingLevelUps, event] })),

  dequeueLevelUp: () =>
    set((s) => ({ pendingLevelUps: s.pendingLevelUps.slice(1) })),

  enqueueAchievement: (event) =>
    set((s) => ({
      pendingAchievements: [...s.pendingAchievements.slice(-2), event], // max 3
    })),

  dequeueAchievement: () =>
    set((s) => ({ pendingAchievements: s.pendingAchievements.slice(1) })),

  reset: () =>
    set({
      leaderboard: [],
      achievements: {},
      pendingLevelUps: [],
      pendingAchievements: [],
    }),
}));
