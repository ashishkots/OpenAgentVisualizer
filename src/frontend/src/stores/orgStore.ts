// Sprint 7 — Organization Zustand store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '../types/organization';

interface OrgStore {
  currentOrgId: string | null;
  orgs: Organization[];
  setCurrentOrgId: (id: string | null) => void;
  setOrgs: (orgs: Organization[]) => void;
  getCurrentOrg: () => Organization | null;
  reset: () => void;
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set, get) => ({
      currentOrgId: null,
      orgs: [],

      setCurrentOrgId: (id) => set({ currentOrgId: id }),

      setOrgs: (orgs) =>
        set((s) => {
          // If no current org is set yet, default to first
          const currentOrgId =
            s.currentOrgId && orgs.some((o) => o.id === s.currentOrgId)
              ? s.currentOrgId
              : orgs[0]?.id ?? null;
          return { orgs, currentOrgId };
        }),

      getCurrentOrg: () => {
        const { currentOrgId, orgs } = get();
        return orgs.find((o) => o.id === currentOrgId) ?? null;
      },

      reset: () => set({ currentOrgId: null, orgs: [] }),
    }),
    {
      name: 'oav-org-store',
      partialize: (s) => ({ currentOrgId: s.currentOrgId }),
    },
  ),
);
