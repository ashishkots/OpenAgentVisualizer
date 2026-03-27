import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Crown, UserMinus, UserPlus, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { AgentAvatar } from '../components/ui/AgentAvatar';
import { useTeam, useTeamStats, useAddMember, useRemoveMember } from '../hooks/useTeams';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Agent } from '../types/agent';
import { getLevelName } from '../lib/xpLevels';
import type { TeamMember } from '../types/team';

function RoleBadge({ role }: { role: TeamMember['role'] }) {
  if (role === 'leader') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-oav-gold/20 text-oav-gold">
        <Crown className="w-3 h-3" aria-hidden="true" />
        Leader
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-oav-surface-hover text-oav-muted">
      Member
    </span>
  );
}

interface AddMemberModalProps {
  teamId: string;
  existingMemberIds: string[];
  onClose: () => void;
  isPending: boolean;
  onAdd: (agentId: string) => void;
}

function AddMemberModal({ teamId, existingMemberIds, onClose, isPending, onAdd }: AddMemberModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await apiClient.get<Agent[]>('/api/agents');
      return data;
    },
    staleTime: 30_000,
  });

  // Filter to agents not already in the team
  const availableAgents = (agents ?? []).filter(
    (a) => !existingMemberIds.includes(a.id),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-modal-title"
    >
      <div className="bg-oav-surface border border-oav-border rounded-xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-oav-border">
          <h2 id="add-member-modal-title" className="text-base font-semibold text-oav-text">
            Add Member
          </h2>
          <button
            onClick={onClose}
            className="text-oav-muted hover:text-oav-text transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : availableAgents.length === 0 ? (
            <p className="text-sm text-oav-muted text-center py-4">
              All agents are already in this team.
            </p>
          ) : (
            <>
              <label htmlFor="agent-select" className="block text-xs font-medium text-oav-muted mb-1">
                Select Agent
              </label>
              <div className="relative">
                <select
                  id="agent-select"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className={clsx(
                    'w-full appearance-none bg-oav-surface-hover border border-oav-border rounded-lg',
                    'px-3 py-2 pr-10 text-sm text-oav-text focus:outline-none focus:ring-2 focus:ring-oav-accent',
                  )}
                  aria-label="Select agent to add"
                >
                  <option value="">Choose an agent...</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} (Lv {agent.level})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-oav-muted pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-oav-border">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-oav-muted bg-oav-surface-hover hover:bg-oav-border transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedAgentId && onAdd(selectedAgentId)}
            disabled={!selectedAgentId || isPending || availableAgents.length === 0}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              selectedAgentId && !isPending
                ? 'bg-oav-accent text-white hover:bg-oav-accent/80'
                : 'bg-oav-surface-hover text-oav-muted cursor-not-allowed',
            )}
          >
            {isPending ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: stats, isLoading: statsLoading } = useTeamStats(id);
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const breadcrumb = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Teams', href: '/teams' },
    { label: team?.name ?? 'Team' },
  ];

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6">
        <EmptyState message="Team not found" />
      </div>
    );
  }

  const members = team.members ?? [];
  const existingMemberIds = members.map((m) => m.agent_id);

  const handleAddMember = (agentId: string) => {
    if (!id) return;
    addMember.mutate(
      { teamId: id, agentId },
      { onSuccess: () => setShowAddModal(false) },
    );
  };

  const handleRemoveMember = (agentId: string) => {
    if (!id) return;
    removeMember.mutate({ teamId: id, agentId });
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <Breadcrumb items={breadcrumb} />

      {/* Team header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl bg-oav-accent/20 flex items-center justify-center text-2xl shrink-0"
          aria-hidden="true"
        >
          {team.icon || '⚡'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-oav-text">{team.name}</h1>
          {team.description && (
            <p className="text-sm text-oav-muted mt-0.5">{team.description}</p>
          )}
        </div>
      </div>

      {/* Stats panel */}
      {(stats || statsLoading) && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          aria-label="Team statistics"
        >
          {[
            { label: 'Total XP',   value: statsLoading ? '...' : (stats?.total_xp ?? 0).toLocaleString() },
            { label: 'Tasks',      value: statsLoading ? '...' : (stats?.total_tasks ?? 0).toLocaleString() },
            { label: 'Level',      value: statsLoading ? '...' : (stats?.level ?? 1).toString() },
            { label: 'Members',    value: statsLoading ? '...' : (stats?.member_count ?? members.length).toString() },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-oav-surface border border-oav-border rounded-xl p-4 text-center"
            >
              <p className="text-lg font-bold text-oav-text tabular-nums">{value}</p>
              <p className="text-xs text-oav-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Members section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-oav-text">
            Members ({members.length})
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
              'bg-oav-accent text-white hover:bg-oav-accent/80 transition-colors min-h-[36px]',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
            )}
            aria-label="Add a member to this team"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <EmptyState message="No members yet. Add agents to this team." />
        ) : (
          <div className="bg-oav-surface border border-oav-border rounded-xl overflow-hidden">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 px-4 py-3 border-b border-oav-border last:border-0"
              >
                <AgentAvatar
                  name={member.agent_name}
                  level={member.level ?? 1}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-oav-text truncate">{member.agent_name}</p>
                  <p className="text-xs text-oav-muted">
                    {member.level != null ? `Lv ${member.level} · ${getLevelName(member.level)}` : ''}
                    {member.total_xp != null ? ` · ${member.total_xp.toLocaleString()} XP` : ''}
                  </p>
                </div>
                <RoleBadge role={member.role} />
                {member.role !== 'leader' && (
                  <button
                    onClick={() => handleRemoveMember(member.agent_id)}
                    disabled={removeMember.isPending}
                    className={clsx(
                      'p-1.5 rounded-lg text-oav-muted hover:text-oav-error hover:bg-oav-error/10',
                      'transition-colors focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                    )}
                    aria-label={`Remove ${member.agent_name} from team`}
                  >
                    <UserMinus className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && id && (
        <AddMemberModal
          teamId={id}
          existingMemberIds={existingMemberIds}
          onClose={() => setShowAddModal(false)}
          isPending={addMember.isPending}
          onAdd={handleAddMember}
        />
      )}
    </div>
  );
}
