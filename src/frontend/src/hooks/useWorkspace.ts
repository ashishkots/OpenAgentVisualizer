import { useEffect, useState } from 'react';

interface WorkspaceInfo {
  workspaceId: string;
  name: string;
  tier: 'free' | 'team' | 'pro' | 'enterprise';
  agentCount: number;
}

const DEFAULT: WorkspaceInfo = {
  workspaceId: 'default',
  name: 'Default Workspace',
  tier: 'free',
  agentCount: 0,
};

export function useWorkspace(): WorkspaceInfo {
  const [info, setInfo] = useState<WorkspaceInfo>(DEFAULT);

  useEffect(() => {
    const endpoint = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000';
    const apiKey = localStorage.getItem('oav_api_key') ?? '';
    // The backend router uses /api/workspaces/{workspace_id} (not /api/workspaces/me).
    // We use /api/workspaces/default as the always-available starting point.
    fetch(`${endpoint}/api/workspaces/default`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setInfo({
          workspaceId: data.workspace_id ?? 'default',
          name: data.name ?? 'Default Workspace',
          tier: data.tier ?? 'free',
          agentCount: data.agent_count ?? 0,
        });
      })
      .catch(() => {
        /* Use defaults if backend unreachable */
      });
  }, []);

  return info;
}
