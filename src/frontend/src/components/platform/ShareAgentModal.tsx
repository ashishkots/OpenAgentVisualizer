// Sprint 7 — Share agent cross-workspace modal

import { useState } from 'react';
import { X, Share2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useShareAgent } from '../../hooks/useOrganizations';
import { useOrgStore } from '../../stores/orgStore';
import type { SharedAgentPermission } from '../../types/organization';

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface OrgWorkspace {
  id: string;
  name: string;
  slug: string;
}

interface ShareAgentModalProps {
  /** Pre-select a specific agent (skip agent picker). */
  agentId?: string;
  agentName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareAgentModal({ agentId, agentName, onClose, onSuccess }: ShareAgentModalProps) {
  const currentOrgId = useOrgStore((s) => s.currentOrgId);

  const [selectedAgentId, setSelectedAgentId] = useState(agentId ?? '');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState('');
  const [permission, setPermission] = useState<SharedAgentPermission>('read');
  const [error, setError] = useState('');

  const shareAgentMutation = useShareAgent(selectedAgentId);

  // Load agents (for agent picker when agentId not provided)
  const { data: agents = [] } = useQuery({
    queryKey: ['agents-list'],
    queryFn: async () => {
      const { data } = await apiClient.get<Agent[]>('/api/agents');
      return data;
    },
    enabled: !agentId,
  });

  // Load org workspaces (target)
  const { data: workspaces = [] } = useQuery({
    queryKey: ['orgs', currentOrgId, 'workspaces'],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgWorkspace[]>(`/api/v1/orgs/${currentOrgId}/workspaces`);
      return data;
    },
    enabled: !!currentOrgId,
  });

  const currentWorkspaceId = localStorage.getItem('oav_workspace') ?? '';
  const targetWorkspaces = workspaces.filter((w) => w.id !== currentWorkspaceId);

  const handleShare = async () => {
    if (!selectedAgentId) { setError('Please select an agent.'); return; }
    if (!targetWorkspaceId) { setError('Please select a target workspace.'); return; }
    setError('');
    try {
      await shareAgentMutation.mutateAsync({ target_workspace_id: targetWorkspaceId, permissions: permission });
      onSuccess?.();
      onClose();
    } catch {
      setError('Failed to share agent. It may already be shared with this workspace.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-agent-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-oav-surface border border-oav-border rounded-xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-oav-accent" aria-hidden="true" />
            <h3 id="share-agent-title" className="text-base font-semibold text-oav-text">
              Share Agent
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-oav-muted hover:text-oav-text transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent rounded"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Agent picker (if not pre-selected) */}
          {!agentId && (
            <div>
              <label htmlFor="share-agent-select" className="block text-xs text-oav-muted mb-1">
                Agent
              </label>
              <select
                id="share-agent-select"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              >
                <option value="">Select an agent...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Displaying pre-selected agent name */}
          {agentId && agentName && (
            <div className="bg-oav-bg rounded-lg px-3 py-2">
              <p className="text-xs text-oav-muted mb-0.5">Agent</p>
              <p className="text-sm font-medium text-oav-text">{agentName}</p>
            </div>
          )}

          {/* Target workspace */}
          <div>
            <label htmlFor="share-workspace-select" className="block text-xs text-oav-muted mb-1">
              Target Workspace
            </label>
            {targetWorkspaces.length === 0 ? (
              <p className="text-xs text-oav-muted bg-oav-bg rounded-lg px-3 py-2">
                No other workspaces in your organization. Add workspaces in Organization Settings.
              </p>
            ) : (
              <select
                id="share-workspace-select"
                value={targetWorkspaceId}
                onChange={(e) => setTargetWorkspaceId(e.target.value)}
                className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
              >
                <option value="">Select a workspace...</option>
                {targetWorkspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Permissions */}
          <fieldset>
            <legend className="text-xs text-oav-muted mb-2">Permissions</legend>
            <div className="flex gap-3">
              {(['read', 'write'] as const).map((p) => (
                <label
                  key={p}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors flex-1',
                    permission === p
                      ? 'border-oav-accent bg-oav-accent/5 text-oav-accent'
                      : 'border-oav-border text-oav-muted hover:border-oav-accent/40',
                  )}
                >
                  <input
                    type="radio"
                    name="share-permission"
                    value={p}
                    checked={permission === p}
                    onChange={() => setPermission(p)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium capitalize">{p}</span>
                  <span className="text-xs ml-auto">
                    {p === 'read' ? 'View only' : 'View + events'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Error */}
          {error && (
            <p role="alert" className="text-sm text-oav-error">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-oav-muted border border-oav-border rounded-lg px-4 py-2 hover:text-oav-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={shareAgentMutation.isPending || targetWorkspaces.length === 0}
            className="flex items-center gap-2 text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 disabled:opacity-50 transition-colors"
            aria-label="Share agent"
          >
            {shareAgentMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            )}
            <Share2 className="w-4 h-4" aria-hidden="true" />
            Share Agent
          </button>
        </div>
      </div>
    </div>
  );
}
