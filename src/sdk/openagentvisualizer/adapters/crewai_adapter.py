from typing import Any, Optional
import time
import uuid

from openagentvisualizer.core.event import OAVEvent


def patch_crewai_agent(
    agent: Any,
    tracer: Any,
    agent_id: str,
    session_id: Optional[str] = None,
    parent_agent_id: Optional[str] = None,
) -> Any:
    """Monkey-patches CrewAI agent.execute_task to emit OAV events.

    Sprint 2 additions:
    - ``session_id`` emitted on every event for session-room WebSocket routing
      and event-replay filtering.
    - ``parent_agent_id`` emitted on the task-started event to enable
      ``delegates_to`` edge detection in the relationship graph.
    - ``duration_seconds`` and ``cost_usd`` populated on completion for
      analytics aggregates and ACH-003 / ACH-004 achievement conditions.
    - ``task_id`` generated per invocation so start / completion events can
      be correlated across the backend pipeline.
    """
    original = agent.execute_task

    def patched(task: Any, *args: Any, **kwargs: Any) -> Any:
        task_id = str(uuid.uuid4())
        started_extra: dict = {
            "task_id": task_id,
            "task": str(task)[:200],
        }
        if parent_agent_id:
            started_extra["parent_agent_id"] = parent_agent_id

        tracer._emit(OAVEvent(
            "agent.task.started",
            tracer.workspace_id,
            agent_id,
            session_id=session_id,
            extra_data=started_extra,
        ))
        start = time.perf_counter()
        try:
            result = original(task, *args, **kwargs)
            elapsed = time.perf_counter() - start
            tracer._emit(OAVEvent(
                "agent.task.completed",
                tracer.workspace_id,
                agent_id,
                session_id=session_id,
                extra_data={
                    "task_id": task_id,
                    "duration_seconds": elapsed,
                    # cost_usd is not available from CrewAI directly; the LLM
                    # adapter (e.g. OAVCallbackHandler) should be registered
                    # alongside this patch to capture per-token costs.
                    "cost_usd": 0.0,
                },
            ))
            return result
        except Exception as exc:
            tracer._emit(OAVEvent(
                "agent.task.failed",
                tracer.workspace_id,
                agent_id,
                session_id=session_id,
                extra_data={"task_id": task_id, "error": str(exc)},
            ))
            raise

    agent.execute_task = patched
    return agent
