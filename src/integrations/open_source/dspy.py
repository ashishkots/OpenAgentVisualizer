from __future__ import annotations
import os
import time
from typing import Any, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVDSPyLogger:
    """DSPy module logger for OAV tracing."""
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="dspy",
        )
        self._start: float = 0.0

    def on_module_call(self, module_name: str, input_tokens: int, output_tokens: int, model: str, latency_ms: float) -> None:
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"module:{module_name}",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            model=model,
            cost_usd=0.0,
            source="dspy",
        ))
