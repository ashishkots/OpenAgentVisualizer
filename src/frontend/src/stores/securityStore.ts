import { create } from 'zustand';
import type {
  ComplianceScore,
  AgentSecurityProfile,
  SecurityViolation,
  ViolationTimelinePoint,
} from '../types/security';

interface SecurityStore {
  complianceScore: ComplianceScore | null;
  agentProfiles: AgentSecurityProfile[];
  violations: SecurityViolation[];
  violationTimeline: ViolationTimelinePoint[];
  selectedAgentId: string | null;

  setComplianceScore: (score: ComplianceScore) => void;
  setAgentProfiles: (profiles: AgentSecurityProfile[]) => void;
  setViolations: (violations: SecurityViolation[]) => void;
  setViolationTimeline: (timeline: ViolationTimelinePoint[]) => void;
  setSelectedAgent: (agentId: string | null) => void;
  appendViolation: (violation: SecurityViolation) => void;
  reset: () => void;
}

export const useSecurityStore = create<SecurityStore>((set) => ({
  complianceScore: null,
  agentProfiles: [],
  violations: [],
  violationTimeline: [],
  selectedAgentId: null,

  setComplianceScore: (score) => set({ complianceScore: score }),

  setAgentProfiles: (profiles) => set({ agentProfiles: profiles }),

  setViolations: (violations) => set({ violations }),

  setViolationTimeline: (timeline) => set({ violationTimeline: timeline }),

  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),

  appendViolation: (violation) =>
    set((s) => ({ violations: [violation, ...s.violations] })),

  reset: () =>
    set({
      complianceScore: null,
      agentProfiles: [],
      violations: [],
      violationTimeline: [],
      selectedAgentId: null,
    }),
}));
