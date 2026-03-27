from typing import Any, Optional
import uuid

from openagentvisualizer.core.event import OAVEvent


def patch_autogen_agent(
    agent: Any,
    tracer: Any,
    agent_id: str,
    session_id: Optional[str] = None,
    parent_agent_id: Optional[str] = None,
) -> Any:
    """Wraps AutoGen agent.generate_reply to emit OAV events.

    Sprint 2 additions:
    - ``session_id`` propagated on every event for session-room WebSocket
      routing and event-replay filtering.
    - ``parent_agent_id`` emitted on the started event to enable
      ``delegates_to`` edge detection in the relationship graph.
    - ``task_id`` generated per invocation so start / completion events can be
      correlated across the backend pipeline.
    - ``total_tokens`` and ``cost_usd`` extracted from AutoGen's usage
      metadata when available, for analytics aggregates and ACH-004.
    """
    original = getattr(agent, "generate_reply", None)
    if original is None:
        return agent  # not a compatible agent

    def patched_generate_reply(*args: Any, **kwargs: Any) -> Any:
        task_id = str(uuid.uuid4())
        started_extra: dict = {
            "task_id": task_id,
            "agent_name": getattr(agent, "name", "unknown"),
        }
        if parent_agent_id:
            started_extra["parent_agent_id"] = parent_agent_id

        tracer._emit(OAVEvent(
            "agent.llm.started",
            tracer.workspace_id,
            agent_id,
            session_id=session_id,
            extra_data=started_extra,
        ))
        try:
            result = original(*args, **kwargs)

            # AutoGen may return a dict with usage info or a plain string.
            total_tokens = 0
            cost_usd = 0.0
            if isinstance(result, dict):
                usage = result.get("usage") or {}
                total_tokens = usage.get("total_tokens", 0)
                cost_usd = usage.get("cost", 0.0)

            tracer._emit(OAVEvent(
                "agent.llm.completed",
                tracer.workspace_id,
                agent_id,
                session_id=session_id,
                extra_data={
                    "task_id": task_id,
                    "total_tokens": total_tokens,
                    "cost_usd": cost_usd,
                },
            ))
            return result
        except Exception as exc:
            tracer._emit(OAVEvent(
                "agent.llm.error",
                tracer.workspace_id,
                agent_id,
                session_id=session_id,
                extra_data={"task_id": task_id, "error": str(exc)},
            ))
            raise

    agent.generate_reply = patched_generate_reply
    return agent
