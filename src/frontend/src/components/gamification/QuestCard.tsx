import { CheckCircle2, Circle, Coins, Star, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import type { Quest, AgentQuestProgress, QuestType } from '../../types/quest';

interface QuestCardProps {
  quest: Quest;
  progress?: AgentQuestProgress;
  onClaim?: (questId: string) => void;
  isClaiming?: boolean;
}

const TYPE_BADGE: Record<QuestType, string> = {
  daily:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  weekly: 'bg-oav-purple/20 text-purple-400 border-oav-purple/30',
  epic:   'bg-oav-gold/20 text-oav-gold border-oav-gold/30',
};

const TYPE_LABEL: Record<QuestType, string> = {
  daily:  'Daily',
  weekly: 'Weekly',
  epic:   'Epic',
};

export function QuestCard({ quest, progress, onClaim, isClaiming }: QuestCardProps) {
  const totalSteps = quest.steps.length;
  const currentStep = progress?.current_step ?? 0;
  const isComplete = progress?.completed ?? false;
  const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <article
      className={clsx(
        'bg-oav-surface border rounded-xl p-4 flex flex-col gap-3 transition-colors',
        isComplete
          ? 'border-oav-success/40 shadow-sm'
          : 'border-oav-border hover:border-oav-border/80',
      )}
      aria-label={`Quest: ${quest.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={clsx(
                'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border',
                TYPE_BADGE[quest.type],
              )}
            >
              {TYPE_LABEL[quest.type]}
            </span>
            {isComplete && (
              <span className="text-[10px] font-semibold text-oav-success uppercase tracking-wide">
                Complete
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-oav-text truncate">{quest.name}</h3>
          <p className="text-xs text-oav-muted mt-0.5 line-clamp-2">{quest.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-oav-muted">
            {currentStep} / {totalSteps} steps
          </span>
          <span className="text-xs font-medium text-oav-text">{progressPct}%</span>
        </div>
        <div
          className="h-1.5 rounded-full bg-oav-border overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Quest progress: ${progressPct}%`}
        >
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              isComplete ? 'bg-oav-success' : 'bg-oav-accent',
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step Checklist */}
      {quest.steps.length > 0 && (
        <ul className="space-y-1" aria-label="Quest steps">
          {quest.steps.map((step, idx) => {
            const done = idx < currentStep || (isComplete && idx < totalSteps);
            return (
              <li key={idx} className="flex items-start gap-2">
                {done ? (
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-oav-success shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    className="w-3.5 h-3.5 text-oav-muted shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={clsx(
                    'text-xs',
                    done ? 'text-oav-muted line-through' : 'text-oav-text',
                  )}
                >
                  {step.description}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Rewards + Claim */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-oav-border">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-oav-xp font-medium">
            <Zap className="w-3 h-3" aria-hidden="true" />
            +{quest.xp_reward.toLocaleString()} XP
          </span>
          <span className="flex items-center gap-1 text-xs text-oav-gold font-medium">
            <Coins className="w-3 h-3" aria-hidden="true" />
            +{quest.currency_reward.toLocaleString()}
          </span>
        </div>
        {onClaim && (
          <button
            onClick={() => onClaim(quest.id)}
            disabled={!isComplete || isClaiming}
            aria-label={
              isComplete ? `Claim rewards for ${quest.name}` : `${quest.name} — not yet complete`
            }
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              'focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
              isComplete && !isClaiming
                ? 'bg-oav-success text-white hover:bg-oav-success/80'
                : 'bg-oav-border text-oav-muted cursor-not-allowed',
            )}
          >
            <Star className="w-3 h-3" aria-hidden="true" />
            {isClaiming ? 'Claiming...' : 'Claim'}
          </button>
        )}
      </div>
    </article>
  );
}
