from __future__ import annotations
import os
import time
from typing import Any

try:
    from src.integrations.open_source.base import OAVBaseTracer, OAVSpan
except ImportError:  # pragma: no cover
    from openagentvisualizer.core.tracer import OAVBaseTracer, OAVSpan  # type: ignore


def patch_openai_client(
    client: Any,
    agent_id: str,
    endpoint: str = "",
    api_key: str = "",
) -> Any:
    """Wraps OpenAI client.chat.completions.create to send OAVSpan traces.

    Spec-compliant signature: patch_openai_client(client, agent_id, endpoint, api_key).
    """
    tracer = OAVBaseTracer(
        endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
        api_key=api_key or os.getenv("OAV_API_KEY", ""),
        source="openai",
    )
    original_create = client.chat.completions.create

    def patched_create(*args: Any, **kwargs: Any) -> Any:
        model = kwargs.get("model", "unknown")
        start = time.time()
        try:
            response = original_create(*args, **kwargs)
            latency = (time.time() - start) * 1000
            usage = getattr(response, "usage", None)
            tracer.send(OAVSpan(
                agent_id=agent_id,
                operation="llm_call",
                input_tokens=getattr(usage, "prompt_tokens", 0) if usage else 0,
                output_tokens=getattr(usage, "completion_tokens", 0) if usage else 0,
                latency_ms=latency,
                model=model,
                cost_usd=0.0,
                source="openai",
            ))
            return response
        except Exception as exc:
            latency = (time.time() - start) * 1000
            tracer.send(OAVSpan(
                agent_id=agent_id,
                operation="llm_call",
                input_tokens=0,
                output_tokens=0,
                latency_ms=latency,
                model=model,
                cost_usd=0.0,
                source="openai",
                error=str(exc),
            ))
            raise

    client.chat.completions.create = patched_create
    return client
