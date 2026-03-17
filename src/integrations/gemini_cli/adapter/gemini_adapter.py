from __future__ import annotations
import os
from typing import Dict, Any
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan


class GeminiAdapter:
    """Hooks into Gemini CLI tool execution lifecycle."""

    def __init__(self, endpoint: str = "", api_key: str = "", agent_id: str = "gemini-session"):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="gemini-cli",
        )

    def on_tool_call(self, event: Dict[str, Any]) -> None:
        tokens = event.get("tokens", {})
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"tool:{event.get('tool_name', 'unknown')}",
            input_tokens=tokens.get("input", 0),
            output_tokens=tokens.get("output", 0),
            latency_ms=float(event.get("latency_ms", 0)),
            model=event.get("model", "gemini"),
            cost_usd=0.0,
            source="gemini-cli",
            error=event.get("error"),
        ))
