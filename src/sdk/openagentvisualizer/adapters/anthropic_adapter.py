from typing import Any, Optional
import uuid

from openagentvisualizer.core.event import OAVEvent


def patch_anthropic_client(
    client: Any,
    tracer: Any,
    agent_id: str,
    session_id: Optional[str] = None,
    parent_agent_id: Optional[str] = None,
) -> Any:
    """Wraps Anthropic client.messages.create to emit OAV events.

    Sprint 2 additions:
    - ``session_id`` propagated on every event for session-room WebSocket
      routing and event-replay filtering.
    - ``parent_agent_id`` emitted on the started event to enable
      ``delegates_to`` edge detection in the relationship graph.
    - ``task_id`` generated per invocation for start / completion correlation.
    - ``total_tokens`` and ``cost_usd`` computed from Anthropic usage for
      analytics aggregates and the ACH-004 "Penny Pincher" achievement.
    """
    original_create = client.messages.create

    # Approximate USD per 1 000 tokens by model prefix.
    _COST_PER_1K: dict = {
        "claude-3-opus": 0.015,
        "claude-3-5-sonnet": 0.003,
        "claude-3-sonnet": 0.003,
        "claude-3-haiku": 0.00025,
        "claude-2": 0.008,
    }

    def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
        for prefix, cost in _COST_PER_1K.items():
            if model.startswith(prefix):
                # Anthropic charges input and output at different rates;
                # use a blended approximation here (output is typically 3x
                # more expensive — callers can override by passing cost_usd
                # explicitly in future SDK versions).
                total = input_tokens + output_tokens
                return round(total * cost / 1000, 6)
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
            input_tokens = getattr(usage, "input_tokens", 0) if usage else 0
            output_tokens = getattr(usage, "output_tokens", 0) if usage else 0
            total_tokens = input_tokens + output_tokens
            cost_usd = _estimate_cost(model, input_tokens, output_tokens)

            tracer._emit(OAVEvent(
                "agent.llm.completed",
                tracer.workspace_id,
                agent_id,
                session_id=session_id,
                extra_data={
                    "task_id": task_id,
                    "model": model,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
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

    client.messages.create = patched_create
    return client
