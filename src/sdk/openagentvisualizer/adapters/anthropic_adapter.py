from typing import Any
from openagentvisualizer.core.event import OAVEvent


def patch_anthropic_client(client: Any, tracer: Any, agent_id: str) -> Any:
    """Wraps Anthropic client.messages.create to emit OAV events."""
    original_create = client.messages.create

    def patched_create(*args: Any, **kwargs: Any) -> Any:
        model = kwargs.get("model", "unknown")
        tracer._emit(OAVEvent(
            "agent.llm.started",
            tracer.workspace_id,
            agent_id,
            extra_data={"model": model},
        ))
        try:
            response = original_create(*args, **kwargs)
            usage = getattr(response, "usage", None)
            tracer._emit(OAVEvent(
                "agent.llm.completed",
                tracer.workspace_id,
                agent_id,
                extra_data={
                    "model": model,
                    "input_tokens": getattr(usage, "input_tokens", 0) if usage else 0,
                    "output_tokens": getattr(usage, "output_tokens", 0) if usage else 0,
                },
            ))
            return response
        except Exception as exc:
            tracer._emit(OAVEvent(
                "agent.llm.error",
                tracer.workspace_id,
                agent_id,
                extra_data={"error": str(exc)},
            ))
            raise

    client.messages.create = patched_create
    return client
