from __future__ import annotations
import os
from typing import Dict, Any
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan


class CodexAdapter:
    """Wraps Codex CLI tool call events and sends OTLP spans to OAV."""

    def __init__(self, endpoint: str = "", api_key: str = "", agent_id: str = "codex-session"):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="codex",
        )

    def on_tool_call(self, event: Dict[str, Any]) -> None:
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"tool:{event.get('tool', 'unknown')}",
            input_tokens=event.get("input_tokens", 0),
            output_tokens=event.get("output_tokens", 0),
            latency_ms=float(event.get("duration_ms", 0)),
            model=event.get("model", "codex"),
            cost_usd=0.0,
            source="codex",
            error=event.get("error"),
            extra={"tool_input": str(event.get("input", ""))[:256]},
        ))
