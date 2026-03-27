import { create } from 'zustand';
import type { WorkspaceInvite, ActivityEntry } from '../types/collaboration';

interface CollaborationStore {
  invites: WorkspaceInvite[];
  activity: ActivityEntry[];
  isActivityOpen: boolean;
  setInvites: (invites: WorkspaceInvite[]) => void;
  addInvite: (invite: WorkspaceInvite) => void;
  removeInvite: (id: string) => void;
  setActivity: (activity: ActivityEntry[]) => void;
  toggleActivity: () => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  invites: [],
  activity: [],
  isActivityOpen: false,

  setInvites: (invites) => set({ invites }),

  addInvite: (invite) =>
    set((s) => ({ invites: [invite, ...s.invites] })),

  removeInvite: (id) =>
    set((s) => ({ invites: s.invites.filter((inv) => inv.id !== id) })),

  setActivity: (activity) => set({ activity }),

  toggleActivity: () => set((s) => ({ isActivityOpen: !s.isActivityOpen })),
}));
