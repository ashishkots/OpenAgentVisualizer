from app.services.gamification_service import GamificationService, XP_THRESHOLDS

def test_xp_award_increases_total():
    svc = GamificationService()
    result = svc.compute_xp_award(task_completed=True, tokens_used=500, duration_seconds=30)
    assert result > 0

def test_level_calculation():
    svc = GamificationService()
    assert svc.level_from_xp(0) == 1
    assert svc.level_from_xp(XP_THRESHOLDS[1]) == 2   # Pro
    assert svc.level_from_xp(XP_THRESHOLDS[4]) == 5   # Legend

def test_level_up_event_emitted():
    svc = GamificationService()
    event = svc.process_xp_gain(current_xp=990, xp_delta=20, agent_id="a1")
    assert event is not None
    assert event["type"] == "level_up"
