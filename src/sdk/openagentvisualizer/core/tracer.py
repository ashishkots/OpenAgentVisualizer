import functools
import asyncio
import inspect
import time
import uuid
from typing import Any, Callable, Optional

from openagentvisualizer.core.event import OAVEvent
from openagentvisualizer.core.ring_buffer import RingBuffer
from openagentvisualizer.core.pii_redactor import redact


class OAVTracer:
    def __init__(
        self,
        api_key: str,
        workspace_id: str = "",
        endpoint: str = "http://localhost:8000",
        export: bool = True,
        buffer_capacity: int = 1000,
    ):
        self.api_key = api_key
        self.workspace_id = workspace_id or self._extract_workspace_from_key(api_key)
        self.endpoint = endpoint
        self._export = export
        self.buffer = RingBuffer(capacity=buffer_capacity)
        self._exporter = None
        if export:
            self._init_exporter()

    def _extract_workspace_from_key(self, key: str) -> str:
        parts = key.split("_")
        return parts[1] if len(parts) >= 3 else "default"

    def _init_exporter(self):
        try:
            from openagentvisualizer.exporters.otlp_exporter import OTLPExporter
            self._exporter = OTLPExporter(api_key=self.api_key, endpoint=self.endpoint)
        except ImportError:
            pass

    def agent(
        self,
        name: str,
        role: str = "agent",
        agent_id: Optional[str] = None,
        session_id: Optional[str] = None,
        parent_agent_id: Optional[str] = None,
    ):
        """Decorator that wraps a function as a traced OAV agent.

        Args:
            name: Human-readable agent name.
            role: Agent role label (e.g. "worker", "supervisor").
            agent_id: Stable UUID for this agent.  Derived from workspace+name
                when omitted.
            session_id: Logical session grouping for event replay and the
                ``session:{id}`` WebSocket room.  Required for session-scoped
                replay and ``shared_session`` relationship-graph edges.
            parent_agent_id: ID of the agent that delegated this task.  Enables
                ``delegates_to`` edge detection in the relationship graph.
        """
        _agent_id = agent_id or str(uuid.uuid5(uuid.NAMESPACE_DNS, "{}.{}".format(self.workspace_id, name)))

        def decorator(func: Callable) -> Callable:
            if inspect.iscoroutinefunction(func):
                @functools.wraps(func)
                async def async_wrapper(*args, **kwargs):
                    return await self._run_traced_async(
                        func, _agent_id, name, role, args, kwargs,
                        session_id=session_id,
                        parent_agent_id=parent_agent_id,
                    )
                return async_wrapper
            else:
                @functools.wraps(func)
                def sync_wrapper(*args, **kwargs):
                    return self._run_traced_sync(
                        func, _agent_id, name, role, args, kwargs,
                        session_id=session_id,
                        parent_agent_id=parent_agent_id,
                    )
                return sync_wrapper

        return decorator

    def _emit(self, event: OAVEvent):
        self.buffer.append(event)
        if self._export and self._exporter:
            try:
                self._exporter.export_sync(event)
            except Exception:
                pass  # never crash user code

    def _run_traced_sync(
        self,
        func: Callable,
        agent_id: str,
        name: str,
        role: str,
        args: tuple,
        kwargs: dict,
        session_id: Optional[str] = None,
        parent_agent_id: Optional[str] = None,
    ):
        task_id = str(uuid.uuid4())
        extra: dict = {"task_id": task_id, "agent_name": name, "role": role}
        if parent_agent_id:
            extra["parent_agent_id"] = parent_agent_id
        self._emit(OAVEvent("agent.task.started", self.workspace_id, agent_id,
                            session_id=session_id, extra_data=extra))
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            elapsed = time.perf_counter() - start
            self._emit(OAVEvent("agent.task.completed", self.workspace_id, agent_id,
                                session_id=session_id,
                                extra_data={"task_id": task_id, "duration_seconds": elapsed}))
            return result
        except Exception as exc:
            self._emit(OAVEvent("agent.task.failed", self.workspace_id, agent_id,
                                session_id=session_id,
                                extra_data={"task_id": task_id, "error": str(exc)}))
            raise

    async def _run_traced_async(
        self,
        func: Callable,
        agent_id: str,
        name: str,
        role: str,
        args: tuple,
        kwargs: dict,
        session_id: Optional[str] = None,
        parent_agent_id: Optional[str] = None,
    ):
        task_id = str(uuid.uuid4())
        extra: dict = {"task_id": task_id, "agent_name": name, "role": role}
        if parent_agent_id:
            extra["parent_agent_id"] = parent_agent_id
        self._emit(OAVEvent("agent.task.started", self.workspace_id, agent_id,
                            session_id=session_id, extra_data=extra))
        start = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            elapsed = time.perf_counter() - start
            self._emit(OAVEvent("agent.task.completed", self.workspace_id, agent_id,
                                session_id=session_id,
                                extra_data={"task_id": task_id, "duration_seconds": elapsed}))
            return result
        except Exception as exc:
            self._emit(OAVEvent("agent.task.failed", self.workspace_id, agent_id,
                                session_id=session_id,
                                extra_data={"task_id": task_id, "error": str(exc)}))
            raise
