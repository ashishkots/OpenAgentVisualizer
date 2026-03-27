// Sprint 7 — Organization / Multi-Org types

export type OrgPlan = 'free' | 'pro' | 'enterprise';
export type OrgRole = 'owner' | 'admin' | 'member';
export type SharedAgentPermission = 'read' | 'write';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: OrgPlan;
  created_by: string;
  created_at: string;
}

export interface OrgCreate {
  name: string;
  slug: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  email: string;
  name: string;
  role: OrgRole;
  joined_at: string;
}

export interface OrgWorkspace {
  id: string;
  name: string;
  slug: string;
  org_id: string;
  created_at: string;
}

export interface OrgAnalytics {
  total_agents: number;
  total_events: number;
  total_xp: number;
  active_workspaces: number;
  workspace_breakdown: Array<{
    workspace_id: string;
    workspace_name: string;
    agents: number;
    events: number;
    xp: number;
  }>;
}

export interface SharedAgent {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_status: string;
  source_workspace_id: string;
  source_workspace_name: string;
  target_workspace_id: string;
  target_workspace_name: string;
  permissions: SharedAgentPermission;
  shared_by: string;
  created_at: string;
}

export interface ShareAgentInput {
  target_workspace_id: string;
  permissions: SharedAgentPermission;
}
