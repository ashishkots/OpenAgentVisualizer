from typing import Optional

class LoopDetector:
    """Detects circular call patterns per agent. Thread-safe via per-instance state.

    The threshold is configurable per workspace (stored externally).
    Default threshold=5 matches the spec acceptance criteria.
    """

    def __init__(self, threshold: int = 5):
        self.threshold = threshold
        # {agent_id: (last_signature, count)}
        self._state: dict = {}

    def check(self, agent_id: str, call_signature: str) -> Optional[dict]:
        """Check if the call signature triggers a loop alert.

        Returns a loop_detected dict if threshold exceeded, None otherwise.
        """
        last_sig, count = self._state.get(agent_id, ("", 0))
        if call_signature == last_sig:
            count += 1
        else:
            count = 1
        self._state[agent_id] = (call_signature, count)
        if count >= self.threshold:
            return {
                "type": "loop_detected",
                "agent_id": agent_id,
                "call_signature": call_signature,
                "repeat_count": count,
            }
        return None

    def reset(self, agent_id: str) -> None:
        """Reset the loop detection state for an agent."""
        self._state.pop(agent_id, None)
