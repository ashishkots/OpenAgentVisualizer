from __future__ import annotations
import os
import time
from typing import Any, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

try:
    from llama_index.core.callbacks.base_handler import BaseCallbackHandler
    _HAS_LLAMA = True
    _BASE = BaseCallbackHandler
except ImportError:
    _BASE = object  # type: ignore
    _HAS_LLAMA = False

class OAVLlamaIndexCallback(_BASE):  # type: ignore[misc]
    """LlamaIndex callback for OAV tracing."""
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="llamaindex",
        )
        self._start: float = 0.0

    def on_event_start(self, event_type: Any, payload: Optional[dict] = None, **kwargs: Any) -> str:
        self._start = time.time()
        return ""

    def on_event_end(self, event_type: Any, payload: Optional[dict] = None, **kwargs: Any) -> None:
        p = payload or {}
        chunks = p.get("chunks", [])
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=str(event_type),
            input_tokens=0,
            output_tokens=len(chunks),
            latency_ms=(time.time() - self._start) * 1000,
            model=p.get("model", "unknown"),
            cost_usd=0.0,
            source="llamaindex",
        ))
