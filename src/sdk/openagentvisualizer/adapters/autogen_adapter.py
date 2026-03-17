from typing import Any
from openagentvisualizer.core.event import OAVEvent


def patch_autogen_agent(agent: Any, tracer: Any, agent_id: str) -> Any:
    """Wraps AutoGen agent.generate_reply to emit OAV events."""
    original = getattr(agent, "generate_reply", None)
    if original is None:
        return agent  # not a compatible agent

    def patched_generate_reply(*args: Any, **kwargs: Any) -> Any:
        tracer._emit(OAVEvent(
            "agent.llm.started",
            tracer.workspace_id,
            agent_id,
            extra_data={"agent_name": getattr(agent, "name", "unknown")},
        ))
        try:
            result = original(*args, **kwargs)
            tracer._emit(OAVEvent("agent.llm.completed", tracer.workspace_id, agent_id))
            return result
        except Exception as exc:
            tracer._emit(OAVEvent(
                "agent.llm.error",
                tracer.workspace_id,
                agent_id,
                extra_data={"error": str(exc)},
            ))
            raise

    agent.generate_reply = patched_generate_reply
    return agent
