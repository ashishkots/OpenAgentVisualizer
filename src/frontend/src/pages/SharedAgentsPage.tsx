// Sprint 7 — Shared agents page

import { useState } from 'react';
import { Share2, Trash2, Clock, Building2, Lock, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ShareAgentModal } from '../components/platform/ShareAgentModal';
import { useSharedAgents, useRevokeShare } from '../hooks/useOrganizations';
import type { SharedAgentPermission } from '../types/organization';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Shared Agents' },
];

const PERMISSION_BADGES: Record<SharedAgentPermission, { label: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; className: string }> = {
  read:  { label: 'Read',  icon: Lock,  className: 'bg-oav-border/50 text-oav-muted'        },
  write: { label: 'Write', icon: Edit3, className: 'bg-oav-accent/15 text-oav-accent'        },
};

export function SharedAgentsPage() {
  const { data: sharedAgents = [], isLoading } = useSharedAgents();
  const revokeShareMutation = useRevokeShare();

  const [showShareModal, setShowShareModal] = useState(false);

  const handleRevoke = async (id: string, agentName: string) => {
    if (!window.confirm(`Revoke sharing for agent "${agentName}"?`)) return;
    try {
      await revokeShareMutation.mutateAsync(id);
    } catch {
      // silent
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6 pb-20 md:pb-6" data-testid="shared-agents-page">
      <Breadcrumb items={BREADCRUMB} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6 text-oav-accent" aria-hidden="true" />
          <h1 className="text-xl font-bold text-oav-text">Shared Agents</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 transition-colors min-h-[44px]"
          aria-label="Share an agent"
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
          Share Agent
        </button>
      </div>

      <p className="text-sm text-oav-muted">
        Agents shared with this workspace from other workspaces in your organization, and agents
        you have shared with other workspaces.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : sharedAgents.length === 0 ? (
        <EmptyState message="No shared agents. Share agents across workspaces in your organization to collaborate." />
      ) : (
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
          <ul aria-label="Shared agents list">
            {sharedAgents.map((sa) => {
              const badge = PERMISSION_BADGES[sa.permissions];
              const BadgeIcon = badge.icon;
              const isInbound = sa.target_workspace_id === (localStorage.getItem('oav_workspace') ?? '');

              return (
                <li
                  key={sa.id}
                  className="flex items-start gap-4 px-4 py-4 border-b border-oav-border last:border-0"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-oav-text">{sa.agent_name}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-oav-muted">
                      {/* Direction */}
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {isInbound
                          ? <>From <span className="text-oav-text font-medium">{sa.source_workspace_name}</span></>
                          : <>To <span className="text-oav-text font-medium">{sa.target_workspace_name}</span></>}
                      </span>

                      {/* Timestamp */}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {formatDistanceToNow(new Date(sa.created_at), { addSuffix: true })}
                      </span>

                      {/* Direction label */}
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 rounded text-xs font-medium',
                          isInbound
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-blue-500/10 text-blue-400',
                        )}
                      >
                        {isInbound ? 'Inbound' : 'Outbound'}
                      </span>
                    </div>
                  </div>

                  {/* Permission badge */}
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                      badge.className,
                    )}
                  >
                    <BadgeIcon className="w-3 h-3" aria-hidden={true} />
                    {badge.label}
                  </span>

                  {/* Revoke */}
                  <button
                    type="button"
                    onClick={() => handleRevoke(sa.id, sa.agent_name)}
                    disabled={revokeShareMutation.isPending}
                    className="text-oav-muted hover:text-oav-error transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent rounded shrink-0 disabled:opacity-50"
                    aria-label={`Revoke sharing for ${sa.agent_name}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showShareModal && (
        <ShareAgentModal
          onClose={() => setShowShareModal(false)}
          onSuccess={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
