import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useInvites, useRevokeInvite } from '../../hooks/useCollaboration';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { InviteModal } from './InviteModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { WorkspaceInvite } from '../../types/collaboration';

function getAvatarColor(email: string): string {
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];
  let hash = 0;
  for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) % COLORS.length;
  return COLORS[Math.abs(hash) % COLORS.length];
}

const ROLE_BADGE: Record<WorkspaceInvite['role'], string> = {
  admin:  'bg-oav-gold/20 text-oav-gold',
  member: 'bg-oav-accent/20 text-oav-accent',
  viewer: 'bg-oav-muted/20 text-oav-muted',
};

const STATUS_BADGE: Record<WorkspaceInvite['status'], string> = {
  pending:  'bg-oav-warning/20 text-oav-warning',
  accepted: 'bg-oav-success/20 text-oav-success',
  declined: 'bg-oav-error/20 text-oav-error',
};

export function MemberList() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const invites = useCollaborationStore((s) => s.invites);
  const { isLoading } = useInvites();
  const { mutate: revokeInvite, isPending: revoking } = useRevokeInvite();

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-oav-text">Workspace Members</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 text-sm text-white bg-oav-accent rounded-lg px-3 py-2 hover:bg-oav-accent/80 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none"
            aria-label="Invite new member"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Invite Member
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : invites.length === 0 ? (
          <div className="bg-oav-surface border border-oav-border rounded-xl p-6 text-center">
            <p className="text-sm text-oav-muted">No invites yet.</p>
            <p className="text-xs text-oav-muted mt-1">Invite team members to collaborate on this workspace.</p>
          </div>
        ) : (
          <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
            {invites.map((invite) => {
              const color = getAvatarColor(invite.email);
              const initials = invite.email.slice(0, 2).toUpperCase();
              return (
                <div
                  key={invite.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-oav-border last:border-0 hover:bg-oav-surface-hover transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-oav-text font-medium truncate">{invite.email}</p>
                    <p className="text-xs text-oav-muted">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span
                    className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                      ROLE_BADGE[invite.role],
                    )}
                  >
                    {invite.role}
                  </span>

                  {/* Status badge */}
                  <span
                    className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                      STATUS_BADGE[invite.status],
                    )}
                  >
                    {invite.status}
                  </span>

                  {/* Revoke */}
                  {invite.status === 'pending' && (
                    <button
                      onClick={() => revokeInvite(invite.id)}
                      disabled={revoking}
                      className="text-oav-muted hover:text-oav-error transition-colors disabled:opacity-50"
                      aria-label={`Revoke invite for ${invite.email}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
    </>
  );
}
