"""Tests for the gamification service and API (backwards-compatible + Sprint 2)."""

from app.services.gamification_service import GamificationService, LEVEL_THRESHOLDS


def test_xp_award_increases_total():
    svc = GamificationService()
    result = svc.compute_xp_award(task_completed=True, tokens_used=500, duration_seconds=30)
    assert result > 0


def test_level_calculation_level_1():
    svc = GamificationService()
    assert svc.level_from_xp(0) == 1


def test_level_calculation_level_2():
    svc = GamificationService()
    # Level 2 threshold is 500
    assert svc.level_from_xp(LEVEL_THRESHOLDS[1]) == 2


def test_level_calculation_level_5():
    svc = GamificationService()
    # Level 5 threshold is 7000
    assert svc.level_from_xp(LEVEL_THRESHOLDS[4]) == 5


def test_level_calculation_level_10():
    svc = GamificationService()
    # Level 10 threshold is 100000
    assert svc.level_from_xp(LEVEL_THRESHOLDS[9]) == 10


def test_level_up_event_emitted():
    svc = GamificationService()
    # Agent at 490 XP receiving 20 XP crosses the level 2 threshold (500)
    event = svc.process_xp_gain(current_xp=490, xp_delta=20, agent_id="a1")
    assert event is not None
    assert event["type"] == "level_up"
    assert event["old_level"] == 1
    assert event["new_level"] == 2


def test_no_level_up_when_within_same_level():
    svc = GamificationService()
    event = svc.process_xp_gain(current_xp=0, xp_delta=100, agent_id="a1")
    assert event is None


def test_level_up_level_name_is_correct():
    svc = GamificationService()
    event = svc.process_xp_gain(current_xp=490, xp_delta=20, agent_id="a1")
    assert event["level_name"] == "Apprentice"
