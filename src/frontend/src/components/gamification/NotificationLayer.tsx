import { useGamificationStore } from '../../stores/gamificationStore';
import { LevelUpToast } from './LevelUpToast';
import { AchievementToast } from './AchievementToast';

/**
 * NotificationLayer — fixed overlay for gamification toasts.
 * Lives at the bottom-right of the viewport, z-[60].
 * Dequeues events from gamificationStore.
 */
export function NotificationLayer() {
  const {
    pendingLevelUps,
    pendingAchievements,
    dequeueLevelUp,
    dequeueAchievement,
  } = useGamificationStore();

  const currentLevelUp = pendingLevelUps[0] ?? null;
  const currentAchievements = pendingAchievements.slice(0, 3);

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      {currentLevelUp && (
        <div className="pointer-events-auto">
          <LevelUpToast
            key={`${currentLevelUp.agent_id}-${currentLevelUp.new_level}`}
            event={currentLevelUp}
            onDismiss={dequeueLevelUp}
          />
        </div>
      )}
      {currentAchievements.map((ach) => (
        <div key={`${ach.agent_id}-${ach.achievement_key}`} className="pointer-events-auto">
          <AchievementToast
            event={ach}
            onDismiss={dequeueAchievement}
          />
        </div>
      ))}
    </div>
  );
}
