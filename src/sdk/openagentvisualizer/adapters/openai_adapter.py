from typing import Any, Callable, Optional
from openagentvisualizer.core.event import OAVEvent


def patch_openai_client(client: Any, tracer: Any, agent_id: str) -> Any:
    """Wraps OpenAI client.chat.completions.create to emit OAV events."""
    original_create = client.chat.completions.create

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
                    "prompt_tokens": getattr(usage, "prompt_tokens", 0) if usage else 0,
                    "completion_tokens": getattr(usage, "completion_tokens", 0) if usage else 0,
                    "total_tokens": getattr(usage, "total_tokens", 0) if usage else 0,
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

    client.chat.completions.create = patched_create
    return client
