import { Users, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { AgentAvatar } from '../ui/AgentAvatar';
import { getLevelColor } from '../../lib/xpLevels';
import type { Team } from '../../types/team';

interface Props {
  team: Team;
  onClick?: (team: Team) => void;
}

const MAX_AVATARS_SHOWN = 4;

export function TeamCard({ team, onClick }: Props) {
  const members = team.members ?? [];
  const shownMembers = members.slice(0, MAX_AVATARS_SHOWN);
  const overflowCount = members.length - MAX_AVATARS_SHOWN;
  const level = team.level ?? 1;
  const levelColor = getLevelColor(level);
  const memberCount = team.member_count ?? members.length;

  return (
    <article
      className={clsx(
        'bg-oav-surface border border-oav-border rounded-xl p-5 flex flex-col gap-4',
        'hover:border-oav-accent/40 transition-colors',
        onClick && 'cursor-pointer',
      )}
      onClick={() => onClick?.(team)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(team); }}
      aria-label={`Team: ${team.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-oav-accent/20 flex items-center justify-center text-lg shrink-0"
            aria-hidden="true"
          >
            {team.icon || '⚡'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-oav-text truncate">{team.name}</p>
            {team.description && (
              <p className="text-xs text-oav-muted line-clamp-1">{team.description}</p>
            )}
          </div>
        </div>

        {/* Level badge */}
        <span
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
          style={{
            borderColor: `${levelColor}40`,
            backgroundColor: `${levelColor}15`,
            color: levelColor,
          }}
        >
          <Star className="w-3 h-3" aria-hidden="true" />
          Lv {level}
        </span>
      </div>

      {/* Member avatars */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2" aria-label={`${memberCount} team members`}>
          {shownMembers.map((member) => (
            <AgentAvatar
              key={member.agent_id}
              name={member.agent_name}
              level={member.level ?? 1}
              size="sm"
              className="ring-2 ring-oav-surface"
            />
          ))}
          {overflowCount > 0 && (
            <div
              className="w-9 h-9 rounded-full bg-oav-surface-hover border-2 border-oav-surface flex items-center justify-center text-xs font-medium text-oav-muted"
              aria-label={`and ${overflowCount} more`}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between pt-3 border-t border-oav-border text-xs text-oav-muted">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
        </div>
        {(team.total_xp ?? 0) > 0 && (
          <span className="font-medium text-oav-text tabular-nums">
            {(team.total_xp ?? 0).toLocaleString()} XP
          </span>
        )}
      </div>
    </article>
  );
}
