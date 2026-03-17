from typing import Any, Dict, List, Optional
from openagentvisualizer.core.event import OAVEvent

try:
    from langchain_core.callbacks.base import BaseCallbackHandler
except ImportError:
    # Graceful degradation when langchain not installed
    class BaseCallbackHandler:  # type: ignore
        pass


class OAVCallbackHandler(BaseCallbackHandler):
    def __init__(self, tracer, agent_id: str):
        self._tracer = tracer
        self._agent_id = agent_id

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        self._tracer._emit(OAVEvent(
            "agent.llm.started",
            self._tracer.workspace_id,
            self._agent_id,
            extra_data={"prompt_count": len(prompts)},
        ))

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        usage = {}
        if hasattr(response, "llm_output") and response.llm_output:
            usage = response.llm_output.get("token_usage", {}) or {}
        self._tracer._emit(OAVEvent(
            "agent.llm.completed",
            self._tracer.workspace_id,
            self._agent_id,
            extra_data={
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
        ))

    def on_llm_error(self, error: Exception, **kwargs: Any) -> None:
        self._tracer._emit(OAVEvent(
            "agent.llm.error",
            self._tracer.workspace_id,
            self._agent_id,
            extra_data={"error": str(error)},
        ))

    def on_tool_start(self, serialized: Dict[str, Any], input_str: str, **kwargs: Any) -> None:
        self._tracer._emit(OAVEvent(
            "agent.tool.started",
            self._tracer.workspace_id,
            self._agent_id,
            extra_data={"tool_name": serialized.get("name", "unknown")},
        ))

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        self._tracer._emit(OAVEvent(
            "agent.tool.completed",
            self._tracer.workspace_id,
            self._agent_id,
        ))

    def on_tool_error(self, error: Exception, **kwargs: Any) -> None:
        self._tracer._emit(OAVEvent(
            "agent.tool.error",
            self._tracer.workspace_id,
            self._agent_id,
            extra_data={"error": str(error)},
        ))
