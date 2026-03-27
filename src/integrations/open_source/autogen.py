from __future__ import annotations
import os
import time
from typing import Any, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVAutoGenLogger:
    """AutoGen logger that hooks into agent message events."""
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="autogen",
        )
        self._start: float = 0.0

    def on_agent_action(self, agent_name: str, message: str, tokens: Optional[dict] = None) -> None:
        t = tokens or {}
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"agent_action:{agent_name}",
            input_tokens=t.get("input", 0),
            output_tokens=t.get("output", 0),
            latency_ms=0.0,
            model=t.get("model", "unknown"),
            cost_usd=0.0,
            source="autogen",
        ))
