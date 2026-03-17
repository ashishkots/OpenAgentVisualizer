from __future__ import annotations
import os
import time
from typing import Any

try:
    from src.integrations.open_source.base import OAVBaseTracer, OAVSpan
except ImportError:  # pragma: no cover
    from openagentvisualizer.core.tracer import OAVBaseTracer, OAVSpan  # type: ignore


def patch_crewai_agent(
    agent: Any,
    agent_id: str,
    endpoint: str = "",
    api_key: str = "",
) -> Any:
    """Monkey-patches CrewAI agent.execute_task to send OAVSpan traces.

    Spec-compliant signature: patch_crewai_agent(agent, agent_id, endpoint, api_key).
    """
    tracer = OAVBaseTracer(
        endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
        api_key=api_key or os.getenv("OAV_API_KEY", ""),
        source="crewai",
    )
    original = agent.execute_task

    def patched(task: Any, *args: Any, **kwargs: Any) -> Any:
        start = time.time()
        try:
            result = original(task, *args, **kwargs)
            latency = (time.time() - start) * 1000
            tracer.send(OAVSpan(
                agent_id=agent_id,
                operation="task_execute",
                input_tokens=0,
                output_tokens=0,
                latency_ms=latency,
                model="unknown",
                cost_usd=0.0,
                source="crewai",
            ))
            return result
        except Exception as exc:
            latency = (time.time() - start) * 1000
            tracer.send(OAVSpan(
                agent_id=agent_id,
                operation="task_execute",
                input_tokens=0,
                output_tokens=0,
                latency_ms=latency,
                model="unknown",
                cost_usd=0.0,
                source="crewai",
                error=str(exc),
            ))
            raise

    agent.execute_task = patched
    return agent
