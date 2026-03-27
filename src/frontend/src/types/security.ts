// Sprint 3 — Security / OpenShield types

export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityViolation {
  id: string;
  agent_id: string;
  timestamp: string;
  description: string;
  severity: ViolationSeverity;
  remediation: string;
}

export interface AgentSecurityProfile {
  agent_id: string;
  agent_name: string;
  agent_level: number;
  grade: SecurityGrade;
  score: number;
  score_breakdown: {
    data_privacy: number;
    policy_compliance: number;
    access_control: number;
  };
  violation_count: number;
  last_violation_at: string | null;
  recent_violations: SecurityViolation[];
}

export interface ComplianceScore {
  workspace_score: number;
  workspace_grade: SecurityGrade;
  pii_exposure_count: number;
  violation_count_24h: number;
  active_threat_count: number;
  last_updated_at: string;
}

export interface SecurityGrades {
  agents: AgentSecurityProfile[];
}

export interface ViolationTimelinePoint {
  hour: number;
  violations: number;
  maxSeverity: ViolationSeverity | null;
}
