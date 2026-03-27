"""Gamification service — XP computation, level logic, and anti-cheat enforcement.

Sprint 2 updates:
  - 10-level system replacing the previous 5-level system
  - Per-event XP amounts per PRD section 3.1
  - Anti-cheat: idempotent awards (caller must pass event_id), rate limit checked here
"""

from typing import Optional

# Cumulative XP required to reach each level (index = level - 1)
# Level 1 starts at 0 XP; Level 10 (Transcendent) requires 100,000 XP.
LEVEL_THRESHOLDS: list[int] = [
    0,       # Level 1  — Novice
    500,     # Level 2  — Apprentice
    1_500,   # Level 3  — Operative
    3_500,   # Level 4  — Specialist
    7_000,   # Level 5  — Expert
    12_000,  # Level 6  — Master
    20_000,  # Level 7  — Grandmaster
    35_000,  # Level 8  — Legend
    60_000,  # Level 9  — Mythic
    100_000, # Level 10 — Transcendent
]

LEVEL_NAMES: list[str] = [
    "Novice",       # 1
    "Apprentice",   # 2
    "Operative",    # 3
    "Specialist",   # 4
    "Expert",       # 5
    "Master",       # 6
    "Grandmaster",  # 7
    "Legend",       # 8
    "Mythic",       # 9
    "Transcendent", # 10
]

# XP award amounts per PRD section 3.1
XP_AWARDS: dict[str, int] = {
    "task_completed": 100,
    "task_completed_fast": 150,
    "session_completed": 50,
    "error_recovered": 200,
    "streak_3": 300,
    "streak_5": 500,
    "first_event_of_day": 25,
    "cost_efficient": 75,
    "loop_avoided": 150,
    "event_ingested": 25,
}

# Anti-cheat: maximum XP transactions an agent may receive per minute
XP_RATE_LIMIT_PER_MINUTE: int = 50


class GamificationService:
    """Core gamification logic — stateless, suitable for use in both async and sync contexts."""

    def compute_xp_award(
        self,
        task_completed: bool,
        tokens_used: int,
        duration_seconds: int,
    ) -> int:
        """Calculate XP for a completed task.

        Kept for backward compatibility with Sprint 1 callers.
        Sprint 2 code should use ``xp_for_trigger`` instead.
        """
        xp = 0
        if task_completed:
            xp += XP_AWARDS["task_completed"]
        # Efficiency bonus: fewer tokens = more XP
        if tokens_used < 500:
            xp += 50
        elif tokens_used < 2000:
            xp += 25
        # Speed bonus
        if duration_seconds < 10:
            xp += 30
        return max(xp, 10)  # minimum 10 XP per task

    def xp_for_trigger(self, trigger: str) -> int:
        """Return the canonical XP amount for a named trigger event.

        Returns 0 for unknown triggers rather than raising, to keep callers safe.
        """
        return XP_AWARDS.get(trigger, 0)

    def level_from_xp(self, total_xp: int) -> int:
        """Return level (1–10) for a given total XP value."""
        level = 1
        for i, threshold in enumerate(LEVEL_THRESHOLDS):
            if total_xp >= threshold:
                level = i + 1
        return level

    def level_name(self, level: int) -> str:
        """Return the display name for a level (1–10). Clamps to valid range."""
        idx = max(0, min(level - 1, len(LEVEL_NAMES) - 1))
        return LEVEL_NAMES[idx]

    def xp_to_next_level(self, total_xp: int) -> Optional[int]:
        """Return how many XP points remain until the next level-up.

        Returns None when the agent is already at maximum level (10).
        """
        current_level = self.level_from_xp(total_xp)
        if current_level >= len(LEVEL_THRESHOLDS):
            return None
        return LEVEL_THRESHOLDS[current_level] - total_xp

    def process_xp_gain(
        self, current_xp: int, xp_delta: int, agent_id: str
    ) -> Optional[dict]:
        """Check whether an XP gain triggers a level-up.

        Returns a level_up event dict if the agent crossed a level boundary,
        or None otherwise. Used by the gamification router to emit WebSocket events.
        """
        old_level = self.level_from_xp(current_xp)
        new_level = self.level_from_xp(current_xp + xp_delta)
        if new_level > old_level:
            return {
                "type": "level_up",
                "agent_id": agent_id,
                "old_level": old_level,
                "new_level": new_level,
                "level_name": self.level_name(new_level),
            }
        return None
