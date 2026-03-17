from typing import Optional

# XP thresholds per level: index = level - 1
# Level 1=Rookie(0), 2=Pro(1000), 3=Expert(3000), 4=Master(7500), 5=Legend(15000)
XP_THRESHOLDS = [0, 1000, 3000, 7500, 15000]
LEVEL_NAMES = ["Rookie", "Pro", "Expert", "Master", "Legend"]

class GamificationService:
    def compute_xp_award(self, task_completed: bool, tokens_used: int, duration_seconds: int) -> int:
        """Calculate XP for a completed task. Minimum 10 XP per task."""
        xp = 0
        if task_completed:
            xp += 100
        # Efficiency bonus: fewer tokens = more XP
        if tokens_used < 500:
            xp += 50
        elif tokens_used < 2000:
            xp += 25
        # Speed bonus
        if duration_seconds < 10:
            xp += 30
        return max(xp, 10)  # minimum 10 XP per task

    def level_from_xp(self, total_xp: int) -> int:
        """Return level (1-5) for a given total XP."""
        level = 1
        for i, threshold in enumerate(XP_THRESHOLDS):
            if total_xp >= threshold:
                level = i + 1
        return level

    def process_xp_gain(self, current_xp: int, xp_delta: int, agent_id: str) -> Optional[dict]:
        """Check if XP gain triggers a level-up. Returns level_up event dict or None."""
        old_level = self.level_from_xp(current_xp)
        new_level = self.level_from_xp(current_xp + xp_delta)
        if new_level > old_level:
            return {
                "type": "level_up",
                "agent_id": agent_id,
                "old_level": old_level,
                "new_level": new_level,
                "level_name": LEVEL_NAMES[new_level - 1],
            }
        return None
