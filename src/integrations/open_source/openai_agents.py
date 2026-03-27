from __future__ import annotations
import os
import time
from typing import Any, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

try:
    from agents import AgentHooks
    _BASE = AgentHooks
except ImportError:
    _BASE = object  # type: ignore

class OAVOpenAITracer(_BASE):  # type: ignore[misc]
    """OpenAI Agents SDK hooks for OAV telemetry."""
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="openai-agents",
        )
        self._start: float = 0.0

    def on_tool_start(self, context: Any, agent: Any, tool: Any) -> None:
        self._start = time.time()

    def on_tool_end(self, context: Any, agent: Any, tool: Any, result: str) -> None:
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"tool:{getattr(tool, 'name', 'unknown')}",
            input_tokens=0,
            output_tokens=0,
            latency_ms=(time.time() - self._start) * 1000,
            model="unknown",
            cost_usd=0.0,
            source="openai-agents",
        ))
