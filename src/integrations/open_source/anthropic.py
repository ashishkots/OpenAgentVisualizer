from __future__ import annotations
import os
import time
from typing import Any, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVAnthropicTracer:
    """Anthropic SDK tracer — wraps client.messages.create calls."""
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="anthropic",
        )

    def on_message(self, model: str, input_tokens: int, output_tokens: int, latency_ms: float) -> None:
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation="message",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            model=model,
            cost_usd=0.0,
            source="anthropic",
        ))
