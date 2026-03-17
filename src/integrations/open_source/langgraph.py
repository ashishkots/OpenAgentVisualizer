from __future__ import annotations
import os
import time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan


class OAVLangGraphTracer:
    """LangGraph state-machine tracer — wraps node execution events."""

    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="langgraph",
        )
        self._node_starts: Dict[str, float] = {}

    def on_node_start(self, node_name: str, inputs: Any) -> None:
        self._node_starts[node_name] = time.time()

    def on_node_end(self, node_name: str, outputs: Any, tokens: Optional[Dict] = None) -> None:
        start = self._node_starts.pop(node_name, time.time())
        latency = (time.time() - start) * 1000
        t = tokens or {}
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"node:{node_name}",
            input_tokens=t.get("input", 0),
            output_tokens=t.get("output", 0),
            latency_ms=latency,
            model=t.get("model", "unknown"),
            cost_usd=0.0,
            source="langgraph",
        ))

    def on_node_error(self, node_name: str, error: Exception) -> None:
        start = self._node_starts.pop(node_name, time.time())
        latency = (time.time() - start) * 1000
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"node:{node_name}",
            input_tokens=0,
            output_tokens=0,
            latency_ms=latency,
            model="unknown",
            cost_usd=0.0,
            source="langgraph",
            error=str(error),
        ))
