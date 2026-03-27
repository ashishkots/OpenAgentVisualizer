export interface WorkspaceInvite {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  expires_at: string;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
}
