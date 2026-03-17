from __future__ import annotations
import os
import time
from typing import Any, Dict, List, Union
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

try:
    from langchain_core.callbacks.base import BaseCallbackHandler
    _HAS_LANGCHAIN = True
except ImportError:
    BaseCallbackHandler = object  # type: ignore
    _HAS_LANGCHAIN = False


class OAVCallbackHandler(BaseCallbackHandler):  # type: ignore[misc]
    """LangChain callback handler that sends traces to OpenAgentVisualizer."""

    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        if _HAS_LANGCHAIN:
            super().__init__()
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="langchain",
        )
        self._start_time: float = 0.0
        self._model_name: str = "unknown"

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        self._start_time = time.time()
        self._model_name = serialized.get("name", "unknown")

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        latency = (time.time() - self._start_time) * 1000
        usage = (getattr(response, "llm_output", None) or {}).get("token_usage", {})
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation="llm_call",
            input_tokens=usage.get("prompt_tokens", 0),
            output_tokens=usage.get("completion_tokens", 0),
            latency_ms=latency,
            model=self._model_name,
            cost_usd=0.0,
            source="langchain",
        ))

    def on_llm_error(self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any) -> None:
        latency = (time.time() - self._start_time) * 1000
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation="llm_call",
            input_tokens=0,
            output_tokens=0,
            latency_ms=latency,
            model=self._model_name,
            cost_usd=0.0,
            source="langchain",
            error=str(error),
        ))
