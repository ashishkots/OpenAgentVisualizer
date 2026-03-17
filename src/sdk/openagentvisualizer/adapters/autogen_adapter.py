from __future__ import annotations
import os
import time
from typing import Any

try:
    from src.integrations.open_source.base import OAVBaseTracer, OAVSpan
except ImportError:  # pragma: no cover
    from openagentvisualizer.core.tracer import OAVBaseTracer, OAVSpan  # type: ignore


def patch_autogen_agent(
    agent: Any,
    agent_id: str,
    endpoint: str = "",
    api_key: str = "",
) -> Any:
    """Wraps AutoGen agent.generate_reply to send OAVSpan traces.

    Spec-compliant signature: patch_autogen_agent(agent, agent_id, endpoint, api_key).
    """
    original = getattr(agent, "generate_reply", None)
    if original is None:
        return agent  # not a compatible agent

    tracer = OAVBaseTracer(
        endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
        api_key=api_key or os.getenv("OAV_API_KEY", ""),
        source="autogen",
    )

    def patched_generate_reply(*args: Any, **kwargs: Any) -> Any:
        start = time.time()
        try:
            result = original(*args, **kwargs)
            latency = (time.time() - start) * 1000
            tracer.send(OAVSpan(
                agent_id=agent_id,
                operation="generate_reply",
                input_tokens=0,
                output_tokens=0,
                latency_ms=latency,
                model=getattr(agent, "llm_config", {}).get("model", "unknown")
                if isinstance(getattr(agent, "llm_config", None), dict)
                else "unknown",
                cost_usd=0.0,
                source="autogen",
            ))
            return result
        except Exception as exc:
            latency = (time.time() - start) * 1000
            tracer.send(OAVSpan(
                agent_id=agent_id,
                operation="generate_reply",
                input_tokens=0,
                output_tokens=0,
                latency_ms=latency,
                model="unknown",
                cost_usd=0.0,
                source="autogen",
                error=str(exc),
            ))
            raise

    agent.generate_reply = patched_generate_reply
    return agent
