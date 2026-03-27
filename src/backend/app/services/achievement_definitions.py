"""Static achievement definitions for OpenAgentVisualizer.

Each AchievementDef is immutable configuration. The actual earned records live
in the ``achievements`` database table (app.models.achievement.Achievement).
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class AchievementDef:
    id: str
    name: str
    description: str
    condition_summary: str
    xp_bonus: int
    icon: str


# Order matters for display only — evaluation uses the dict key
ACHIEVEMENT_DEFS: dict[str, AchievementDef] = {
    "ACH-001": AchievementDef(
        id="ACH-001",
        name="First Steps",
        description="Agent completes its first task",
        condition_summary="task_count >= 1",
        xp_bonus=50,
        icon="footprint",
    ),
    "ACH-002": AchievementDef(
        id="ACH-002",
        name="Centurion",
        description="Agent completes 100 tasks",
        condition_summary="task_count >= 100",
        xp_bonus=500,
        icon="shield",
    ),
    "ACH-003": AchievementDef(
        id="ACH-003",
        name="Speed Demon",
        description="Agent completes 10 tasks with latency under 1 second",
        condition_summary="fast_task_count >= 10",
        xp_bonus=300,
        icon="lightning",
    ),
    "ACH-004": AchievementDef(
        id="ACH-004",
        name="Penny Pincher",
        description="Agent completes 50 tasks under median cost for that task type",
        condition_summary="cheap_task_count >= 50",
        xp_bonus=400,
        icon="coin",
    ),
    "ACH-005": AchievementDef(
        id="ACH-005",
        name="Iron Will",
        description="Agent recovers from an error state 10 times",
        condition_summary="error_recovery_count >= 10",
        xp_bonus=350,
        icon="anvil",
    ),
    "ACH-006": AchievementDef(
        id="ACH-006",
        name="Marathon Runner",
        description="Agent accumulates 24 or more hours of total session time",
        condition_summary="total_session_hours >= 24",
        xp_bonus=500,
        icon="clock",
    ),
    "ACH-007": AchievementDef(
        id="ACH-007",
        name="Team Player",
        description="Agent appears in 5 or more relationship edges in the agent graph",
        condition_summary="relationship_edge_count >= 5",
        xp_bonus=250,
        icon="handshake",
    ),
    "ACH-008": AchievementDef(
        id="ACH-008",
        name="Perfect Streak",
        description="Agent completes 10 consecutive tasks without encountering an error",
        condition_summary="max_streak >= 10",
        xp_bonus=600,
        icon="star",
    ),
    "ACH-009": AchievementDef(
        id="ACH-009",
        name="Night Owl",
        description="Agent completes 50 tasks between 22:00 and 06:00 UTC",
        condition_summary="night_task_count >= 50",
        xp_bonus=200,
        icon="moon",
    ),
    "ACH-010": AchievementDef(
        id="ACH-010",
        name="Trailblazer",
        description="First agent in the workspace to reach Level 5",
        condition_summary="first_to_level_5",
        xp_bonus=1000,
        icon="flag",
    ),
}
