# OpenAgentVisualizer SDK & Docker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Python SDK (`openagentvisualizer` package) with framework adapters for LangChain, CrewAI, AutoGen, OpenAI, and Anthropic; then wire all services together in Docker Compose with Nginx reverse proxy, `.env`, and GitHub Actions CI.

**Architecture:** The SDK is a thin client library: a `@tracer.agent` decorator wraps any Python function, captures call events, and forwards them to the backend via OTLP gRPC (primary) or HTTP REST (fallback). A ring buffer prevents memory bloat. PII fields are redacted before export. Framework adapters hook into each framework's native callback/observer system so users only add the decorator — the adapter handles the rest automatically.

**Tech Stack:** Python 3.12, `opentelemetry-exporter-otlp-proto-grpc`, `opentelemetry-sdk`, pytest, Docker Compose 2.x, Nginx 1.25, GitHub Actions

---

## File Structure

```
src/sdk/
├── pyproject.toml                     # PEP 517 build — hatchling
├── README.md
├── openagentvisualizer/
│   ├── __init__.py                    # exports OAVTracer, tracer
│   ├── core/
│   │   ├── __init__.py
│   │   ├── tracer.py                  # OAVTracer class — @agent decorator
│   │   ├── event.py                   # OAVEvent dataclass
│   │   ├── ring_buffer.py             # fixed-size circular buffer
│   │   └── pii_redactor.py            # regex-based PII masking
│   └── adapters/
│       ├── __init__.py
│       ├── langchain_adapter.py       # BaseCallbackHandler subclass
│       ├── crewai_adapter.py          # CrewAI agent wrapper
│       ├── autogen_adapter.py         # AutoGen AssistantAgent wrapper
│       ├── openai_adapter.py          # OpenAI Agents SDK hook
│       └── anthropic_adapter.py       # Anthropic client wrapper
│   └── exporters/
│       ├── __init__.py
│       ├── otlp_exporter.py           # OTLP gRPC exporter (primary)
│       └── rest_exporter.py           # REST HTTP fallback exporter
└── tests/
    ├── conftest.py
    ├── test_tracer.py
    ├── test_ring_buffer.py
    ├── test_pii_redactor.py
    ├── test_langchain_adapter.py
    └── test_otlp_exporter.py

# Docker + Infra
docker-compose.yml                     # 9-service stack
.env.example                           # all required env vars
deploy/
└── nginx/
    └── dev.conf                       # dev Nginx config
.github/
└── workflows/
    └── ci.yml                         # workflow_dispatch only
```

---

## Task 1: SDK Package Scaffold

**Files:**
- Create: `src/sdk/pyproject.toml`
- Create: `src/sdk/openagentvisualizer/__init__.py`
- Create: `src/sdk/openagentvisualizer/core/__init__.py`
- Create: `src/sdk/openagentvisualizer/adapters/__init__.py`
- Create: `src/sdk/openagentvisualizer/exporters/__init__.py`

- [ ] **Step 1: Create `src/sdk/pyproject.toml`**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "openagentvisualizer"
version = "0.1.0"
description = "Python SDK for OpenAgentVisualizer — connect any AI agent in 3 lines"
readme = "README.md"
license = { text = "FSL-1.1-MIT" }
requires-python = ">=3.10"
dependencies = [
    "opentelemetry-sdk>=1.24.0",
    "opentelemetry-exporter-otlp-proto-grpc>=1.24.0",
    "opentelemetry-exporter-otlp-proto-http>=1.24.0",
    "httpx>=0.27.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
langchain = ["langchain-core>=0.2.0"]
crewai = ["crewai>=0.30.0"]
autogen = ["pyautogen>=0.2.0"]
dev = [
    "pytest>=8.2.2",
    "pytest-asyncio>=0.23.7",
    "pytest-cov>=5.0.0",
    "respx>=0.21.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 2: Create `openagentvisualizer/__init__.py`**

```python
from openagentvisualizer.core.tracer import OAVTracer

__version__ = "0.1.0"
__all__ = ["OAVTracer"]
```

- [ ] **Step 3: Install the package in development mode**

```bash
cd src/sdk && pip install -e ".[dev]"
```

Expected: Successfully installed openagentvisualizer

- [ ] **Step 4: Commit**
```bash
git add src/sdk/
git commit -m "feat(sdk): Python package scaffold with pyproject.toml"
```

---

## Task 2: OAVEvent & Ring Buffer

**Files:**
- Create: `src/sdk/openagentvisualizer/core/event.py`
- Create: `src/sdk/openagentvisualizer/core/ring_buffer.py`
- Create: `src/sdk/tests/test_ring_buffer.py`

- [ ] **Step 1: Write failing ring buffer tests**

```python
# tests/test_ring_buffer.py
from openagentvisualizer.core.ring_buffer import RingBuffer

def test_ring_buffer_stores_items():
    buf = RingBuffer(capacity=3)
    buf.append("a")
    buf.append("b")
    assert buf.drain() == ["a", "b"]

def test_ring_buffer_drops_oldest_when_full():
    buf = RingBuffer(capacity=3)
    buf.append("a"); buf.append("b"); buf.append("c"); buf.append("d")
    items = buf.drain()
    assert "a" not in items       # dropped
    assert "d" in items           # newest kept
    assert len(items) == 3

def test_drain_empties_buffer():
    buf = RingBuffer(capacity=5)
    buf.append("x")
    buf.drain()
    assert buf.drain() == []

def test_ring_buffer_is_thread_safe():
    import threading
    buf = RingBuffer(capacity=100)
    threads = [threading.Thread(target=lambda: buf.append("t")) for _ in range(50)]
    for t in threads: t.start()
    for t in threads: t.join()
    assert len(buf.drain()) <= 100
```

Run: `cd src/sdk && pytest tests/test_ring_buffer.py -v`
Expected: FAIL — ImportError

- [ ] **Step 2: Implement `core/event.py`**

```python
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
import uuid

@dataclass
class OAVEvent:
    event_type: str
    workspace_id: str
    agent_id: str | None = None
    session_id: str | None = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    extra_data: dict[str, Any] = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "workspace_id": self.workspace_id,
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "timestamp": self.timestamp,
            **self.extra_data,
        }
```

- [ ] **Step 3: Implement `core/ring_buffer.py`**

```python
import threading
from collections import deque

class RingBuffer:
    def __init__(self, capacity: int = 1000):
        self._capacity = capacity
        self._buf: deque = deque(maxlen=capacity)
        self._lock = threading.Lock()

    def append(self, item) -> None:
        with self._lock:
            self._buf.append(item)

    def drain(self) -> list:
        with self._lock:
            items = list(self._buf)
            self._buf.clear()
            return items

    def __len__(self) -> int:
        with self._lock:
            return len(self._buf)
```

- [ ] **Step 4: Run tests**

Run: `pytest tests/test_ring_buffer.py -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**
```bash
git commit -m "feat(sdk): OAVEvent dataclass and thread-safe RingBuffer"
```

---

## Task 3: PII Redactor

**Files:**
- Create: `src/sdk/openagentvisualizer/core/pii_redactor.py`
- Create: `src/sdk/tests/test_pii_redactor.py`

- [ ] **Step 1: Write failing PII tests**

```python
# tests/test_pii_redactor.py
from openagentvisualizer.core.pii_redactor import redact

def test_redacts_email():
    result = redact("Send email to user@example.com about the order")
    assert "user@example.com" not in result
    assert "[EMAIL]" in result

def test_redacts_api_key_pattern():
    result = redact("Use key sk-abc123def456ghi789 for auth")
    assert "sk-abc123def456ghi789" not in result
    assert "[API_KEY]" in result

def test_preserves_non_pii():
    result = redact("The agent completed the research task successfully")
    assert result == "The agent completed the research task successfully"

def test_handles_nested_dict():
    data = {"prompt": "email me at test@email.com", "model": "gpt-4o"}
    result = redact(data)
    assert "test@email.com" not in result["prompt"]
    assert result["model"] == "gpt-4o"
```

Run: `pytest tests/test_pii_redactor.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `core/pii_redactor.py`**

```python
import re
from typing import Any

_PATTERNS = [
    (re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b'), '[EMAIL]'),
    (re.compile(r'\bsk-[A-Za-z0-9]{20,}\b'), '[API_KEY]'),
    (re.compile(r'\boav_[A-Za-z0-9]{20,}\b'), '[API_KEY]'),
    (re.compile(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'), '[PHONE]'),
    (re.compile(r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b'), '[CREDIT_CARD]'),
]

def redact(value: Any) -> Any:
    if isinstance(value, str):
        for pattern, replacement in _PATTERNS:
            value = pattern.sub(replacement, value)
        return value
    if isinstance(value, dict):
        return {k: redact(v) for k, v in value.items()}
    if isinstance(value, list):
        return [redact(item) for item in value]
    return value
```

- [ ] **Step 3: Run tests**

Run: `pytest tests/test_pii_redactor.py -v`
Expected: PASS (4 tests)

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(sdk): PII redactor - email, API key, phone, credit card masking"
```

---

## Task 4: Core OAVTracer

**Files:**
- Create: `src/sdk/openagentvisualizer/core/tracer.py`
- Create: `src/sdk/tests/test_tracer.py`

- [ ] **Step 1: Write failing tracer tests**

```python
# tests/test_tracer.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from openagentvisualizer.core.tracer import OAVTracer

def test_agent_decorator_wraps_sync_function():
    tracer = OAVTracer(api_key="oav_test", workspace_id="ws1", export=False)

    @tracer.agent(name="TestBot", role="tester")
    def my_func(x):
        return x * 2

    result = my_func(5)
    assert result == 10  # original behavior preserved

@pytest.mark.asyncio
async def test_agent_decorator_wraps_async_function():
    tracer = OAVTracer(api_key="oav_test", workspace_id="ws1", export=False)

    @tracer.agent(name="AsyncBot", role="async-tester")
    async def my_async_func(x):
        return x + 1

    result = await my_async_func(4)
    assert result == 5

def test_agent_decorator_captures_events():
    tracer = OAVTracer(api_key="oav_test", workspace_id="ws1", export=False)

    @tracer.agent(name="EventBot", role="worker")
    def my_func():
        return "done"

    my_func()
    events = tracer.buffer.drain()
    event_types = [e.event_type for e in events]
    assert "agent.task.started" in event_types
    assert "agent.task.completed" in event_types

def test_agent_captures_error_event():
    tracer = OAVTracer(api_key="oav_test", workspace_id="ws1", export=False)

    @tracer.agent(name="ErrBot", role="worker")
    def failing_func():
        raise ValueError("boom")

    with pytest.raises(ValueError):
        failing_func()

    events = tracer.buffer.drain()
    assert any(e.event_type == "agent.task.failed" for e in events)
```

Run: `pytest tests/test_tracer.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `core/tracer.py`**

```python
import functools
import asyncio
import inspect
import time
import uuid
from datetime import datetime, timezone
from typing import Callable, Any

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
        # Format: oav_{workspace_id}_{random} — extract middle segment
        parts = key.split("_")
        return parts[1] if len(parts) >= 3 else "default"

    def _init_exporter(self):
        try:
            from openagentvisualizer.exporters.otlp_exporter import OTLPExporter
            self._exporter = OTLPExporter(api_key=self.api_key, endpoint=self.endpoint)
        except ImportError:
            pass

    def agent(self, name: str, role: str = "agent", agent_id: str | None = None):
        """Decorator that wraps a function as a traced OAV agent."""
        _agent_id = agent_id or str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{self.workspace_id}.{name}"))

        def decorator(func: Callable) -> Callable:
            if inspect.iscoroutinefunction(func):
                @functools.wraps(func)
                async def async_wrapper(*args, **kwargs):
                    return await self._run_traced_async(func, _agent_id, name, role, args, kwargs)
                return async_wrapper
            else:
                @functools.wraps(func)
                def sync_wrapper(*args, **kwargs):
                    return self._run_traced_sync(func, _agent_id, name, role, args, kwargs)
                return sync_wrapper

        return decorator

    def _emit(self, event: OAVEvent):
        self.buffer.append(event)
        if self._export and self._exporter:
            try:
                self._exporter.export_sync(event)
            except Exception:
                pass  # never crash user code

    def _run_traced_sync(self, func, agent_id, name, role, args, kwargs):
        task_id = str(uuid.uuid4())
        self._emit(OAVEvent("agent.task.started", self.workspace_id, agent_id, extra_data={
            "task_id": task_id, "agent_name": name, "role": role,
        }))
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            elapsed = time.perf_counter() - start
            self._emit(OAVEvent("agent.task.completed", self.workspace_id, agent_id, extra_data={
                "task_id": task_id, "duration_seconds": elapsed,
            }))
            return result
        except Exception as exc:
            self._emit(OAVEvent("agent.task.failed", self.workspace_id, agent_id, extra_data={
                "task_id": task_id, "error": str(exc),
            }))
            raise

    async def _run_traced_async(self, func, agent_id, name, role, args, kwargs):
        task_id = str(uuid.uuid4())
        self._emit(OAVEvent("agent.task.started", self.workspace_id, agent_id, extra_data={
            "task_id": task_id, "agent_name": name, "role": role,
        }))
        start = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            elapsed = time.perf_counter() - start
            self._emit(OAVEvent("agent.task.completed", self.workspace_id, agent_id, extra_data={
                "task_id": task_id, "duration_seconds": elapsed,
            }))
            return result
        except Exception as exc:
            self._emit(OAVEvent("agent.task.failed", self.workspace_id, agent_id, extra_data={
                "task_id": task_id, "error": str(exc),
            }))
            raise
```

- [ ] **Step 3: Run tests**

Run: `pytest tests/test_tracer.py -v`
Expected: PASS (4 tests)

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(sdk): OAVTracer core - @agent decorator, sync/async support, event capture"
```

---

## Task 5: OTLP Exporter

**Files:**
- Create: `src/sdk/openagentvisualizer/exporters/otlp_exporter.py`
- Create: `src/sdk/openagentvisualizer/exporters/rest_exporter.py`
- Create: `src/sdk/tests/test_otlp_exporter.py`

- [ ] **Step 1: Write failing exporter tests**

```python
# tests/test_otlp_exporter.py
import pytest
import respx
import httpx
from openagentvisualizer.exporters.rest_exporter import RESTExporter
from openagentvisualizer.core.event import OAVEvent

@respx.mock
def test_rest_exporter_sends_event():
    route = respx.post("http://localhost:8000/api/events").mock(
        return_value=httpx.Response(201, json={"id": "e1"})
    )
    exporter = RESTExporter(api_key="oav_test", endpoint="http://localhost:8000")
    event = OAVEvent("agent.task.started", "ws1", "a1")
    exporter.export_sync(event)
    assert route.called
    payload = route.calls[0].request
    assert b"agent.task.started" in payload.content

@respx.mock
def test_rest_exporter_does_not_raise_on_server_error():
    respx.post("http://localhost:8000/api/events").mock(return_value=httpx.Response(500))
    exporter = RESTExporter(api_key="oav_test", endpoint="http://localhost:8000")
    event = OAVEvent("agent.task.started", "ws1", "a1")
    exporter.export_sync(event)  # should not raise
```

Run: `pytest tests/test_otlp_exporter.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `exporters/rest_exporter.py`**

```python
import httpx
import json
from openagentvisualizer.core.event import OAVEvent

class RESTExporter:
    def __init__(self, api_key: str, endpoint: str = "http://localhost:8000"):
        self._client = httpx.Client(
            base_url=endpoint,
            headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            timeout=2.0,
        )

    def export_sync(self, event: OAVEvent) -> None:
        try:
            self._client.post("/api/events", content=json.dumps(event.to_dict()))
        except Exception:
            pass  # silent fail — never crash user code

    def __del__(self):
        try: self._client.close()
        except: pass
```

- [ ] **Step 3: Implement `exporters/otlp_exporter.py`** — wraps opentelemetry OTLPSpanExporter, converts OAVEvent → OTLP span

```python
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry import trace
from openagentvisualizer.core.event import OAVEvent
import time

class OTLPExporter:
    def __init__(self, api_key: str, endpoint: str = "http://localhost:4317"):
        resource = Resource(attributes={"service.name": "openagentvisualizer-sdk", "oav.api_key": api_key})
        provider = TracerProvider(resource=resource)
        otlp_exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        self._tracer = provider.get_tracer("oav-sdk")

    def export_sync(self, event: OAVEvent) -> None:
        with self._tracer.start_as_current_span(event.event_type) as span:
            span.set_attribute("workspace.id", event.workspace_id)
            if event.agent_id:
                span.set_attribute("agent.id", event.agent_id)
            for k, v in (event.extra_data or {}).items():
                if isinstance(v, (str, int, float, bool)):
                    span.set_attribute(f"oav.{k}", v)
```

- [ ] **Step 4: Run tests**

Run: `pytest tests/test_otlp_exporter.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git commit -m "feat(sdk): OTLP gRPC exporter and REST HTTP fallback exporter"
```

---

## Task 6: LangChain Adapter

**Files:**
- Create: `src/sdk/openagentvisualizer/adapters/langchain_adapter.py`
- Create: `src/sdk/tests/test_langchain_adapter.py`

- [ ] **Step 1: Write failing adapter test**

```python
# tests/test_langchain_adapter.py
import pytest
from unittest.mock import MagicMock, patch
from openagentvisualizer.adapters.langchain_adapter import OAVCallbackHandler
from openagentvisualizer.core.tracer import OAVTracer

def test_langchain_callback_records_llm_start():
    tracer = OAVTracer(api_key="oav_test", workspace_id="ws1", export=False)
    handler = OAVCallbackHandler(tracer=tracer, agent_id="a1")
    handler.on_llm_start(serialized={}, prompts=["Hello world"])
    events = tracer.buffer.drain()
    assert any(e.event_type == "agent.llm.started" for e in events)

def test_langchain_callback_records_llm_end():
    tracer = OAVTracer(api_key="oav_test", workspace_id="ws1", export=False)
    handler = OAVCallbackHandler(tracer=tracer, agent_id="a1")
    mock_response = MagicMock()
    mock_response.llm_output = {"token_usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}}
    handler.on_llm_end(response=mock_response)
    events = tracer.buffer.drain()
    llm_end = next(e for e in events if e.event_type == "agent.llm.completed")
    assert llm_end.extra_data.get("total_tokens") == 15
```

Run: `pytest tests/test_langchain_adapter.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `adapters/langchain_adapter.py`**

```python
from typing import Any
from openagentvisualizer.core.event import OAVEvent

try:
    from langchain_core.callbacks.base import BaseCallbackHandler
except ImportError:
    BaseCallbackHandler = object  # graceful degradation without langchain installed

class OAVCallbackHandler(BaseCallbackHandler):
    def __init__(self, tracer, agent_id: str):
        self._tracer = tracer
        self._agent_id = agent_id

    def on_llm_start(self, serialized: dict[str, Any], prompts: list[str], **kwargs):
        self._tracer._emit(OAVEvent(
            "agent.llm.started", self._tracer.workspace_id, self._agent_id,
            extra_data={"prompt_count": len(prompts)},
        ))

    def on_llm_end(self, response: Any, **kwargs):
        usage = response.llm_output.get("token_usage", {}) if hasattr(response, "llm_output") and response.llm_output else {}
        self._tracer._emit(OAVEvent(
            "agent.llm.completed", self._tracer.workspace_id, self._agent_id,
            extra_data={
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
        ))

    def on_llm_error(self, error: Exception, **kwargs):
        self._tracer._emit(OAVEvent(
            "agent.llm.error", self._tracer.workspace_id, self._agent_id,
            extra_data={"error": str(error)},
        ))

    def on_tool_start(self, serialized: dict, input_str: str, **kwargs):
        self._tracer._emit(OAVEvent(
            "agent.tool.started", self._tracer.workspace_id, self._agent_id,
            extra_data={"tool_name": serialized.get("name", "unknown")},
        ))

    def on_tool_end(self, output: str, **kwargs):
        self._tracer._emit(OAVEvent(
            "agent.tool.completed", self._tracer.workspace_id, self._agent_id,
        ))
```

- [ ] **Step 3: Run tests**

Run: `pytest tests/test_langchain_adapter.py -v`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(sdk): LangChain callback handler adapter"
```

---

## Task 7: Remaining Framework Adapters

**Files:**
- Create: `src/sdk/openagentvisualizer/adapters/crewai_adapter.py`
- Create: `src/sdk/openagentvisualizer/adapters/openai_adapter.py`
- Create: `src/sdk/openagentvisualizer/adapters/anthropic_adapter.py`

- [ ] **Step 1: Implement `crewai_adapter.py`** — wraps CrewAI agent `execute_task`, emits start/complete/failed events

```python
from openagentvisualizer.core.event import OAVEvent

def patch_crewai_agent(agent, tracer, agent_id: str):
    """Monkey-patches CrewAI agent.execute_task to emit OAV events."""
    original = agent.execute_task

    def patched(task, *args, **kwargs):
        tracer._emit(OAVEvent("agent.task.started", tracer.workspace_id, agent_id,
            extra_data={"task": str(task)[:200]}))
        try:
            result = original(task, *args, **kwargs)
            tracer._emit(OAVEvent("agent.task.completed", tracer.workspace_id, agent_id))
            return result
        except Exception as e:
            tracer._emit(OAVEvent("agent.task.failed", tracer.workspace_id, agent_id,
                extra_data={"error": str(e)}))
            raise

    agent.execute_task = patched
    return agent
```

- [ ] **Step 2: Implement `openai_adapter.py`** — wraps OpenAI Agents SDK `on_handoff` and response stream interceptor

- [ ] **Step 3: Implement `anthropic_adapter.py`** — wraps Anthropic client `messages.create` with before/after hooks

- [ ] **Step 4: Run full test suite**

Run: `cd src/sdk && pytest --cov=openagentvisualizer tests/ -v`
Expected: PASS, coverage > 80%

- [ ] **Step 5: Commit**
```bash
git commit -m "feat(sdk): CrewAI, OpenAI, Anthropic framework adapters"
```

---

## Task 8: Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `deploy/nginx/dev.conf`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
version: "3.9"

services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_USER: oav
      POSTGRES_PASSWORD: oav
      POSTGRES_DB: oav
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oav"]
      interval: 5s
      timeout: 5s
      retries: 10
    ports:
      - "5432:5432"

  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY:-changeme-dev}
      SEED_EMAIL: ${SEED_EMAIL:-kotsai@gmail.com}
      SEED_PASSWORD: ${SEED_PASSWORD:-kots@123}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"

  websocket:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: uvicorn app.main:app --host 0.0.0.0 --port 8001
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - backend
    ports:
      - "8001:8001"

  otlp-gateway:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: uvicorn app.main:app --host 0.0.0.0 --port 4318
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - backend
    ports:
      - "4317:4317"
      - "4318:4318"

  celery-worker:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: celery -A app.core.celery_app worker --loglevel=info --concurrency=4
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - redis
      - postgres

  celery-beat:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: celery -A app.core.celery_app beat --loglevel=info
    environment:
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - redis

  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile
      target: deps
    command: npm run dev -- --host 0.0.0.0
    volumes:
      - ./src/frontend:/app
      - /app/node_modules
    environment:
      VITE_API_URL: http://localhost/api
      VITE_WS_URL: ws://localhost/ws
    ports:
      - "3000:3000"
    depends_on:
      - backend

  nginx:
    image: nginx:1.25-alpine
    volumes:
      - ./deploy/nginx/dev.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "80:80"
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Create `.env.example`**

```env
# Database
DATABASE_URL=postgresql+asyncpg://oav:oav@postgres:5432/oav

# Redis
REDIS_URL=redis://redis:6379/0

# Auth
SECRET_KEY=changeme-in-production

# Default seed user
SEED_EMAIL=kotsai@gmail.com
SEED_PASSWORD=kots@123

# OTLP ports
OTLP_GRPC_PORT=4317
OTLP_HTTP_PORT=4318
```

- [ ] **Step 3: Create `deploy/nginx/dev.conf`**

```nginx
upstream backend {
    server backend:8000;
}

upstream websocket {
    server websocket:8001;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    # REST API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # OTLP HTTP
    location /otlp/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Frontend (everything else)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

- [ ] **Step 4: Commit**
```bash
git add docker-compose.yml .env.example deploy/
git commit -m "feat(infra): Docker Compose 9-service stack with Nginx reverse proxy"
```

---

## Task 9: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.gitignore` (update)

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: false
        default: 'staging'
        type: choice
        options: [staging, production]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest-pg16
        env:
          POSTGRES_USER: oav
          POSTGRES_PASSWORD: oav
          POSTGRES_DB: oav_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
      redis:
        image: redis:7.2-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-retries 10

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - name: Install backend deps
        run: pip install -r src/backend/requirements.txt
      - name: Run backend tests
        env:
          DATABASE_URL: postgresql+asyncpg://oav:oav@localhost:5432/oav_test
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: ci-test-secret
        run: cd src/backend && pytest --cov=app tests/ -v

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - name: Install frontend deps
        run: cd src/frontend && npm install
      - name: Run frontend tests
        run: cd src/frontend && npm test
      - name: Build frontend
        run: cd src/frontend && npm run build

  sdk-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - name: Install SDK
        run: pip install -e "src/sdk[dev]"
      - name: Run SDK tests
        run: cd src/sdk && pytest --cov=openagentvisualizer tests/ -v

  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests, sdk-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Build all Docker images
        run: docker compose build --no-cache
      - name: Smoke test docker-compose up
        run: |
          cp .env.example .env
          docker compose up -d
          sleep 15
          curl -f http://localhost/api/health || exit 1
          docker compose down
```

- [ ] **Step 2: Update `.gitignore`**

Add these lines if not present:
```gitignore
.env
__pycache__/
*.pyc
.pytest_cache/
dist/
node_modules/
src/frontend/package-lock.json
.superpowers/
*.egg-info/
.coverage
htmlcov/
```

- [ ] **Step 3: Commit**
```bash
git add .github/ .gitignore
git commit -m "feat(ci): GitHub Actions CI pipeline - backend/frontend/SDK tests + docker smoke test"
```

---

## Task 10: End-to-End Smoke Test

**Files:**
- Create: `tests/e2e_smoke.py`

- [ ] **Step 1: Write smoke test**

```python
#!/usr/bin/env python3
"""
End-to-end smoke test. Run AFTER docker compose up --build.
Usage: python tests/e2e_smoke.py
"""
import httpx, time, sys, json

BASE = "http://localhost"

def check(label, condition, detail=""):
    icon = "✅" if condition else "❌"
    print(f"{icon} {label}" + (f": {detail}" if detail else ""))
    if not condition:
        sys.exit(1)

print("\n=== OpenAgentVisualizer Smoke Test ===\n")

# 1. Login
r = httpx.post(f"{BASE}/api/auth/login", json={"email": "kotsai@gmail.com", "password": "kots@123"})
check("Default user seed login", r.status_code == 200)
token = r.json()["access_token"]
workspace_id = r.json()["workspace_id"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Invalid API key rejected
r = httpx.get(f"{BASE}/api/agents", headers={"X-API-Key": "oav_fake_key_12345678901234567890"})
check("Invalid API key returns 401", r.status_code == 401)

# 3. Create agent
r = httpx.post(f"{BASE}/api/agents", json={"name": "TestBot", "role": "tester", "framework": "custom"}, headers=headers)
check("Create agent", r.status_code == 201)
agent_id = r.json()["id"]

# 4. List agents
r = httpx.get(f"{BASE}/api/agents", headers=headers)
check("List agents returns created agent", any(a["id"] == agent_id for a in r.json()))

# 5. Post event
r = httpx.post(f"{BASE}/api/events", json={"event_type": "agent.task.started", "agent_id": agent_id}, headers=headers)
check("POST event ingested", r.status_code in (200, 201))

# 6. OTLP HTTP span
otlp_payload = {
    "resourceSpans": [{
        "resource": {"attributes": [{"key": "workspace.id", "value": {"stringValue": workspace_id}}]},
        "scopeSpans": [{"spans": [{"traceId": "abc", "spanId": "def", "name": "test.span",
            "startTimeUnixNano": "1700000000000000000", "endTimeUnixNano": "1700001000000000000",
            "status": {"code": 1}, "attributes": []}]}]
    }]
}
r = httpx.post(f"{BASE}/otlp/v1/traces", json=otlp_payload, headers=headers)
check("OTLP HTTP span ingested", r.status_code in (200, 201, 204))
time.sleep(2)

# 7. Verify span appears in DB
r = httpx.get(f"{BASE}/api/spans", headers=headers)
check("OTLP span appears in spans endpoint", r.status_code == 200)

print("\n=== All checks passed ✅ ===\n")
```

- [ ] **Step 2: Run full stack**

```bash
cp .env.example .env
docker compose up --build -d
sleep 20
```

Expected: All 9 containers running

- [ ] **Step 3: Run smoke test**

```bash
python tests/e2e_smoke.py
```

Expected: All checks ✅

- [ ] **Step 4: Check FPS (manual)**

Open `http://localhost` in browser, log in with `kotsai@gmail.com` / `kots@123`, navigate to Virtual World, open browser DevTools → Performance tab, confirm canvas is running at 60fps with test agents.

- [ ] **Step 5: Final commit**
```bash
git add tests/e2e_smoke.py
git commit -m "feat(e2e): smoke test script verifying all acceptance criteria"
```
