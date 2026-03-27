import { clsx } from 'clsx';
import { useQuests, useClaimQuest } from '../hooks/useQuests';
import { useQuestStore } from '../stores/questStore';
import { QuestCard } from '../components/gamification/QuestCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import type { QuestType } from '../types/quest';

const TABS: { id: QuestType; label: string }[] = [
  { id: 'daily',  label: 'Daily'  },
  { id: 'weekly', label: 'Weekly' },
  { id: 'epic',   label: 'Epic'   },
];

export function QuestsPage() {
  const activeTab = useQuestStore((s) => s.activeTab);
  const setActiveTab = useQuestStore((s) => s.setActiveTab);

  const { data: quests = [], isLoading } = useQuests({ type: activeTab });
  const { mutate: claimQuest, isPending: isClaiming, variables: claimingId } = useClaimQuest();

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-oav-text">Quests</h1>
        <p className="text-oav-muted text-sm mt-1">
          Complete quests to earn XP and tokens.
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-oav-border">
        <div className="flex gap-1" role="tablist" aria-label="Quest types">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`quest-panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                'border-b-2 -mb-px focus-visible:ring-2 focus-visible:ring-oav-accent focus-visible:outline-none',
                activeTab === id
                  ? 'border-oav-accent text-oav-accent'
                  : 'border-transparent text-oav-muted hover:text-oav-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quest grid */}
      <div
        role="tabpanel"
        id={`quest-panel-${activeTab}`}
        aria-label={`${activeTab} quests`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : quests.length === 0 ? (
          <EmptyState
            message={`No ${activeTab} quests available right now. Check back later.`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClaim={(id) => claimQuest(id)}
                isClaiming={isClaiming && claimingId === quest.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
