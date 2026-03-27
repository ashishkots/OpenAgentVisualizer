from typing import Any, Callable, Optional
import uuid

from openagentvisualizer.core.event import OAVEvent


def patch_openai_client(
    client: Any,
    tracer: Any,
    agent_id: str,
    session_id: Optional[str] = None,
    parent_agent_id: Optional[str] = None,
) -> Any:
    """Wraps OpenAI client.chat.completions.create to emit OAV events.

    Sprint 2 additions:
    - ``session_id`` propagated on every event for session-room WebSocket
      routing and event-replay filtering.
    - ``parent_agent_id`` emitted on the started event to enable
      ``delegates_to`` edge detection in the relationship graph.
    - ``task_id`` generated per invocation for start / completion correlation.
    - ``cost_usd`` estimated from token counts for analytics aggregates and
      the ACH-004 "Penny Pincher" achievement condition.
    """
    original_create = client.chat.completions.create

    # Approximate USD per 1 000 tokens by model prefix.
    _COST_PER_1K: dict = {
        "gpt-4o": 0.005,
        "gpt-4": 0.03,
        "gpt-3.5-turbo": 0.002,
    }

    def _estimate_cost(model: str, total_tokens: int) -> float:
        for prefix, cost in _COST_PER_1K.items():
            if model.startswith(prefix):
                return round(total_tokens * cost / 1000, 6)
        return 0.0

    def patched_create(*args: Any, **kwargs: Any) -> Any:
        model = kwargs.get("model", "unknown")
        task_id = str(uuid.uuid4())
        started_extra: dict = {"task_id": task_id, "model": model}
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
            response = original_create(*args, **kwargs)
            usage = getattr(response, "usage", None)
            prompt_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
            completion_tokens = getattr(usage, "completion_tokens", 0) if usage else 0
            total_tokens = getattr(usage, "total_tokens", 0) if usage else 0
            cost_usd = _estimate_cost(model, total_tokens)

            tracer._emit(OAVEvent(
                "agent.llm.completed",
                tracer.workspace_id,
                agent_id,
                session_id=session_id,
                extra_data={
                    "task_id": task_id,
                    "model": model,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                    "cost_usd": cost_usd,
                },
            ))
            return response
        except Exception as exc:
            tracer._emit(OAVEvent(
                "agent.llm.error",
                tracer.workspace_id,
                agent_id,
                session_id=session_id,
                extra_data={"task_id": task_id, "error": str(exc)},
            ))
            raise

    client.chat.completions.create = patched_create
    return client
