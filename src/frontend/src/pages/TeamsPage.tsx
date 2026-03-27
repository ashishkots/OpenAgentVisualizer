import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { TeamCard } from '../components/gamification/TeamCard';
import { useTeams, useCreateTeam } from '../hooks/useTeams';
import type { Team, TeamCreate } from '../types/team';

const BREADCRUMB = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Teams' },
];

const TEAM_ICONS = ['⚡', '🔥', '💎', '🌟', '🚀', '🛡️', '⚔️', '🎯', '🦁', '🐉'];

interface CreateTeamModalProps {
  onClose: () => void;
  isPending: boolean;
  onSubmit: (payload: TeamCreate) => void;
}

function CreateTeamModal({ onClose, isPending, onSubmit }: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(TEAM_ICONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined, icon });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-team-modal-title"
    >
      <div className="bg-oav-surface border border-oav-border rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-oav-border">
          <h2 id="create-team-modal-title" className="text-base font-semibold text-oav-text">
            Create Team
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
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            {/* Team name */}
            <div>
              <label htmlFor="team-name" className="block text-xs font-medium text-oav-muted mb-1.5">
                Team Name <span aria-hidden="true" className="text-oav-error">*</span>
              </label>
              <input
                id="team-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Speed Demons"
                maxLength={100}
                required
                className={clsx(
                  'w-full bg-oav-surface-hover border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text',
                  'placeholder:text-oav-muted/50 focus:outline-none focus:ring-2 focus:ring-oav-accent',
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="team-description" className="block text-xs font-medium text-oav-muted mb-1.5">
                Description
              </label>
              <textarea
                id="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your team's purpose..."
                rows={2}
                maxLength={500}
                className={clsx(
                  'w-full bg-oav-surface-hover border border-oav-border rounded-lg px-3 py-2 text-sm text-oav-text',
                  'placeholder:text-oav-muted/50 focus:outline-none focus:ring-2 focus:ring-oav-accent resize-none',
                )}
              />
            </div>

            {/* Icon picker */}
            <div>
              <p className="text-xs font-medium text-oav-muted mb-2">Team Icon</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select team icon">
                {TEAM_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={clsx(
                      'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                      icon === ic
                        ? 'bg-oav-accent/30 ring-2 ring-oav-accent'
                        : 'bg-oav-surface-hover hover:bg-oav-border',
                    )}
                    aria-pressed={icon === ic}
                    aria-label={`Select icon ${ic}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-oav-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-oav-muted bg-oav-surface-hover hover:bg-oav-border transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className={clsx(
                'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                name.trim() && !isPending
                  ? 'bg-oav-accent text-white hover:bg-oav-accent/80'
                  : 'bg-oav-surface-hover text-oav-muted cursor-not-allowed',
              )}
            >
              {isPending ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TeamsPage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: teams, isLoading } = useTeams();
  const createTeam = useCreateTeam();

  const handleCreate = (payload: TeamCreate) => {
    createTeam.mutate(payload, {
      onSuccess: (team: Team) => {
        setShowCreateModal(false);
        navigate(`/teams/${team.id}`);
      },
    });
  };

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <Breadcrumb items={BREADCRUMB} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-oav-text">Teams</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-oav-accent text-white hover:bg-oav-accent/80 transition-colors min-h-[44px]',
            'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
          )}
          aria-label="Create a new team"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Create Team
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !teams || teams.length === 0 ? (
        <EmptyState
          message="No teams yet. Create a team to group your agents and tackle cooperative challenges together!"
          icon="👥"
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-oav-accent text-white hover:bg-oav-accent/80 transition-colors"
            >
              Create your first team
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => navigate(`/teams/${team.id}`)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          isPending={createTeam.isPending}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
