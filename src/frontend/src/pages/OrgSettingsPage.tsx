// Sprint 7 — Organization settings page

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  UserCheck,
  Crown,
  Shield,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  useOrg,
  useOrgMembers,
  useAddOrgMember,
  useRemoveOrgMember,
  useOrgWorkspaces,
  useUpdateOrg,
} from '../hooks/useOrganizations';
import { useOrgStore } from '../stores/orgStore';
import type { OrgRole } from '../types/organization';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Organization Settings' },
];

const ROLE_BADGES: Record<OrgRole, { label: string; className: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> }> = {
  owner:  { label: 'Owner',  className: 'bg-yellow-500/15 text-yellow-400', icon: Crown  },
  admin:  { label: 'Admin',  className: 'bg-oav-accent/15 text-oav-accent', icon: Shield },
  member: { label: 'Member', className: 'bg-oav-border/50 text-oav-muted',  icon: UserCheck },
};

const ROLE_OPTIONS: OrgRole[] = ['admin', 'member'];

export function OrgSettingsPage() {
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const { data: org, isLoading: orgLoading } = useOrg(currentOrgId);
  const { data: members = [], isLoading: membersLoading } = useOrgMembers(currentOrgId);
  const { data: workspaces = [], isLoading: wsLoading } = useOrgWorkspaces(currentOrgId);
  const updateOrgMutation = useUpdateOrg(currentOrgId ?? '');
  const addMemberMutation = useAddOrgMember(currentOrgId ?? '');
  const removeMemberMutation = useRemoveOrgMember(currentOrgId ?? '');

  const [orgName, setOrgName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    if (org) setOrgName(org.name);
  }, [org]);

  const handleSaveName = async () => {
    if (!orgName.trim()) return;
    try {
      await updateOrgMutation.mutateAsync({ name: orgName.trim() });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      // silent
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return; }
    try {
      await addMemberMutation.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}.`);
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch {
      setInviteError('Failed to invite member. They may already be in this organization.');
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this organization?`)) return;
    try {
      await removeMemberMutation.mutateAsync(userId);
    } catch {
      // silent
    }
  };

  const planBadgeClass: Record<string, string> = {
    free:       'bg-oav-border/50 text-oav-muted',
    pro:        'bg-oav-accent/15 text-oav-accent',
    enterprise: 'bg-yellow-500/15 text-yellow-400',
  };

  if (!currentOrgId) {
    return (
      <div className="p-6">
        <EmptyState message="No organization selected. Select or create an organization using the switcher in the header." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-8 pb-20 md:pb-6" data-testid="org-settings-page">
      <Breadcrumb items={BREADCRUMB} />
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-oav-accent" aria-hidden="true" />
        <h1 className="text-xl font-bold text-oav-text">Organization Settings</h1>
      </div>

      {/* General */}
      <section aria-labelledby="org-general-heading">
        <h2 id="org-general-heading" className="text-base font-semibold text-oav-text mb-3">
          General
        </h2>
        <div className="bg-oav-surface border border-oav-border rounded-xl p-5 space-y-4">
          {orgLoading ? (
            <LoadingSpinner />
          ) : org ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label htmlFor="org-name" className="block text-xs text-oav-muted mb-1">
                    Organization Name
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={updateOrgMutation.isPending}
                  className="mt-5 text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 disabled:opacity-50 transition-colors shrink-0"
                >
                  {updateOrgMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : nameSaved ? 'Saved!' : 'Save'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-oav-muted mb-1">Slug</p>
                  <code className="text-xs font-mono text-oav-accent">{org.slug}</code>
                </div>
                <div className="ml-auto">
                  <p className="text-xs text-oav-muted mb-1">Plan</p>
                  <span
                    className={clsx(
                      'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
                      planBadgeClass[org.plan] ?? 'bg-oav-border/50 text-oav-muted',
                    )}
                  >
                    {org.plan}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-oav-muted">Unable to load organization details.</p>
          )}
        </div>
      </section>

      {/* Members */}
      <section aria-labelledby="org-members-heading">
        <h2 id="org-members-heading" className="text-base font-semibold text-oav-text mb-3">
          Members
        </h2>
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
          {/* Invite form */}
          <form onSubmit={handleInvite} className="p-4 border-b border-oav-border space-y-3">
            <div className="flex gap-2 flex-wrap">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 min-w-0 bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent"
                aria-label="Invite email"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                className="bg-oav-bg border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent shrink-0"
                aria-label="Invite role"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="flex items-center gap-1.5 text-sm text-white bg-oav-accent rounded-lg px-4 py-2 hover:bg-oav-accent/80 disabled:opacity-50 transition-colors shrink-0"
                aria-label="Invite member"
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="w-4 h-4" aria-hidden="true" />
                )}
                Invite
              </button>
            </div>
            {inviteError && <p role="alert" className="text-xs text-oav-error">{inviteError}</p>}
            {inviteSuccess && <p role="status" className="text-xs text-oav-success">{inviteSuccess}</p>}
          </form>

          {/* Member list */}
          {membersLoading ? (
            <div className="p-4"><LoadingSpinner /></div>
          ) : members.length === 0 ? (
            <div className="p-4 text-sm text-center text-oav-muted">No members yet.</div>
          ) : (
            <ul aria-label="Organization members">
              {members.map((member) => {
                const badge = ROLE_BADGES[member.role];
                const BadgeIcon = badge.icon;
                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-oav-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-oav-text truncate">{member.name || member.email}</p>
                      <p className="text-xs text-oav-muted truncate">{member.email}</p>
                    </div>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                        badge.className,
                      )}
                    >
                      <BadgeIcon className="w-3 h-3" aria-hidden={true} />
                      {badge.label}
                    </span>
                    {member.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(member.user_id, member.name || member.email)}
                        disabled={removeMemberMutation.isPending}
                        className="text-oav-muted hover:text-oav-error transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent rounded"
                        aria-label={`Remove ${member.name || member.email}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Workspaces */}
      <section aria-labelledby="org-workspaces-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="org-workspaces-heading" className="text-base font-semibold text-oav-text">
            Workspaces
          </h2>
          <a
            href="/settings?tab=workspace"
            className="flex items-center gap-1.5 text-xs text-oav-accent hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Manage in Settings
          </a>
        </div>
        <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
          {wsLoading ? (
            <div className="p-4"><LoadingSpinner /></div>
          ) : workspaces.length === 0 ? (
            <div className="p-4 text-sm text-center text-oav-muted">No workspaces in this organization.</div>
          ) : (
            <ul aria-label="Organization workspaces">
              {workspaces.map((ws) => (
                <li
                  key={ws.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-oav-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-oav-text">{ws.name}</p>
                    <p className="text-xs font-mono text-oav-muted">{ws.slug}</p>
                  </div>
                  <span className="text-xs text-oav-muted">
                    {new Date(ws.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
