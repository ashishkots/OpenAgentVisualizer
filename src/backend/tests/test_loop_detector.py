from app.services.loop_detector import LoopDetector

def test_no_loop_detected_for_unique_calls():
    detector = LoopDetector(threshold=5)
    for i in range(4):
        result = detector.check(agent_id="a1", call_signature=f"unique_{i}")
        assert result is None

def test_loop_detected_at_threshold():
    detector = LoopDetector(threshold=5)
    for _ in range(4):
        detector.check(agent_id="a1", call_signature="same_call")
    result = detector.check(agent_id="a1", call_signature="same_call")
    assert result is not None
    assert result["type"] == "loop_detected"
    assert result["agent_id"] == "a1"
    assert result["repeat_count"] == 5

def test_loop_resets_after_different_call():
    detector = LoopDetector(threshold=5)
    for _ in range(3):
        detector.check(agent_id="a1", call_signature="call_a")
    detector.check(agent_id="a1", call_signature="call_b")
    result = detector.check(agent_id="a1", call_signature="call_a")
    assert result is None  # count reset after different call
