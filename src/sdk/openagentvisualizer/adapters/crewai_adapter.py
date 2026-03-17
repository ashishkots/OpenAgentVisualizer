from typing import Any
from openagentvisualizer.core.event import OAVEvent


def patch_crewai_agent(agent: Any, tracer: Any, agent_id: str) -> Any:
    """Monkey-patches CrewAI agent.execute_task to emit OAV events."""
    original = agent.execute_task

    def patched(task: Any, *args: Any, **kwargs: Any) -> Any:
        tracer._emit(OAVEvent(
            "agent.task.started",
            tracer.workspace_id,
            agent_id,
            extra_data={"task": str(task)[:200]},
        ))
        try:
            result = original(task, *args, **kwargs)
            tracer._emit(OAVEvent("agent.task.completed", tracer.workspace_id, agent_id))
            return result
        except Exception as exc:
            tracer._emit(OAVEvent(
                "agent.task.failed",
                tracer.workspace_id,
                agent_id,
                extra_data={"error": str(exc)},
            ))
            raise

    agent.execute_task = patched
    return agent
