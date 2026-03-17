from __future__ import annotations
import os
import time
from typing import Any, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVSmolagentsCallback:
    """Smolagents (HuggingFace) callback for OAV tracing."""
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="smolagents",
        )
        self._start: float = 0.0

    def on_step(self, step_number: int, agent: Any = None) -> None:
        self._start = time.time()

    def on_step_end(self, step_number: int, output: Any = None, tokens: Optional[dict] = None) -> None:
        t = tokens or {}
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"step:{step_number}",
            input_tokens=t.get("input", 0),
            output_tokens=t.get("output", 0),
            latency_ms=(time.time() - self._start) * 1000,
            model=t.get("model", "unknown"),
            cost_usd=0.0,
            source="smolagents",
        ))
