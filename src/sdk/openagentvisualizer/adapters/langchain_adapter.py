from typing import Any, Dict, List, Optional
import uuid

from openagentvisualizer.core.event import OAVEvent

try:
    from langchain_core.callbacks.base import BaseCallbackHandler
except ImportError:
    # Graceful degradation when langchain not installed
    class BaseCallbackHandler:  # type: ignore
        pass


class OAVCallbackHandler(BaseCallbackHandler):
    """LangChain callback handler that emits OAV events.

    Sprint 2 additions:
    - ``session_id`` propagated on every event for session-room WebSocket
      routing and event-replay filtering.
    - ``parent_agent_id`` emitted on task-started events for ``delegates_to``
      relationship-graph edge detection.
    - ``task_id`` forwarded from the run_id kwargs supplied by LangChain so
      events across ``on_llm_start`` / ``on_llm_end`` pairs can be correlated.
    - ``cost_usd`` estimated from token counts for analytics aggregates and
      the ACH-004 "Penny Pincher" achievement condition.
    """

    # Approximate USD cost per 1 000 tokens for common models.
    # Used to populate cost_usd when the underlying client does not provide it
    # directly.  Figures are rough estimates and can be overridden by users.
    _COST_PER_1K: Dict[str, float] = {
        "gpt-4o": 0.005,
        "gpt-4": 0.03,
        "gpt-3.5-turbo": 0.002,
        "claude-3-opus": 0.015,
        "claude-3-sonnet": 0.003,
        "claude-3-haiku": 0.00025,
    }

    def __init__(
        self,
        tracer: Any,
        agent_id: str,
        session_id: Optional[str] = None,
        parent_agent_id: Optional[str] = None,
    ) -> None:
        self._tracer = tracer
        self._agent_id = agent_id
        self._session_id = session_id
        self._parent_agent_id = parent_agent_id
        # run_id (UUID from LangChain) -> task_id mapping so start/end pair up
        self._run_task_ids: Dict[str, str] = {}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _task_id_for_run(self, run_id: Any) -> str:
        """Return a stable task_id for a LangChain run UUID."""
        key = str(run_id) if run_id else ""
        if key not in self._run_task_ids:
            self._run_task_ids[key] = str(uuid.uuid4())
        return self._run_task_ids[key]

    def _estimate_cost(self, model: str, total_tokens: int) -> float:
        for prefix, cost in self._COST_PER_1K.items():
            if model.startswith(prefix):
                return round(total_tokens * cost / 1000, 6)
        return 0.0

    def _emit(self, event_type: str, extra: Dict[str, Any]) -> None:
        self._tracer._emit(OAVEvent(
            event_type,
            self._tracer.workspace_id,
            self._agent_id,
            session_id=self._session_id,
            extra_data=extra,
        ))

    # ------------------------------------------------------------------
    # LLM callbacks
    # ------------------------------------------------------------------

    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        *,
        run_id: Any = None,
        **kwargs: Any,
    ) -> None:
        task_id = self._task_id_for_run(run_id)
        extra: Dict[str, Any] = {
            "task_id": task_id,
            "prompt_count": len(prompts),
            "model": serialized.get("name") or serialized.get("id", ["unknown"])[-1],
        }
        if self._parent_agent_id:
            extra["parent_agent_id"] = self._parent_agent_id
        self._emit("agent.llm.started", extra)

    def on_llm_end(self, response: Any, *, run_id: Any = None, **kwargs: Any) -> None:
        task_id = self._task_id_for_run(run_id)
        usage: Dict[str, Any] = {}
        model = ""
        if hasattr(response, "llm_output") and response.llm_output:
            usage = response.llm_output.get("token_usage", {}) or {}
            model = response.llm_output.get("model_name", "")

        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", 0) or (prompt_tokens + completion_tokens)
        cost_usd = self._estimate_cost(model, total_tokens)

        self._emit("agent.llm.completed", {
            "task_id": task_id,
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "cost_usd": cost_usd,
        })
        # Clean up run mapping
        self._run_task_ids.pop(str(run_id) if run_id else "", None)

    def on_llm_error(self, error: Exception, *, run_id: Any = None, **kwargs: Any) -> None:
        task_id = self._task_id_for_run(run_id)
        self._emit("agent.llm.error", {"task_id": task_id, "error": str(error)})
        self._run_task_ids.pop(str(run_id) if run_id else "", None)

    # ------------------------------------------------------------------
    # Tool callbacks
    # ------------------------------------------------------------------

    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        *,
        run_id: Any = None,
        **kwargs: Any,
    ) -> None:
        task_id = self._task_id_for_run(run_id)
        self._emit("agent.tool.started", {
            "task_id": task_id,
            "tool_name": serialized.get("name", "unknown"),
        })

    def on_tool_end(self, output: str, *, run_id: Any = None, **kwargs: Any) -> None:
        task_id = self._task_id_for_run(run_id)
        self._emit("agent.tool.completed", {"task_id": task_id})
        self._run_task_ids.pop(str(run_id) if run_id else "", None)

    def on_tool_error(self, error: Exception, *, run_id: Any = None, **kwargs: Any) -> None:
        task_id = self._task_id_for_run(run_id)
        self._emit("agent.tool.error", {"task_id": task_id, "error": str(error)})
        self._run_task_ids.pop(str(run_id) if run_id else "", None)
