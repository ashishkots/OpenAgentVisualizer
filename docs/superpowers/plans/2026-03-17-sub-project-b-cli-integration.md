# Sub-project B: CLI Integration Layer — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full CLI integration layer — OAV Python CLI tool, backend integration routers, Claude Code MCP server (15 tools) + hooks + native plugin, Codex CLI plugin, Gemini CLI adapter, and 12 SDK adapters — enabling developers to observe all their AI agents from Claude Code, Codex, Gemini CLI, and popular open-source frameworks.

**Architecture:** Python Click CLI (`oav`) installs all adapters and writes config files. All integrations send OTLP spans to the existing OAV backend OTLP receiver. Claude Code gets three layers: MCP server (AI-accessible tools), hooks (transparent telemetry), and plugin (developer slash commands + statusline). Codex gets similar plugin + middleware. The 12 SDK adapters are pure Python classes that wrap framework lifecycle hooks with zero framework changes required.

**Tech Stack:** Python 3.11+, Click CLI, `opentelemetry-sdk`, Node.js 20 (MCP server + plugins), TypeScript, `@modelcontextprotocol/sdk`, npm workspaces, FastAPI (backend routers), pytest, vitest

---

## File Structure

**New files to create:**

```
src/integrations/
├── conftest.py                            Root conftest — adds src/ to sys.path for all integration tests
├── claude-code/
│   ├── hooks/
│   │   ├── pre-tool.sh                    PreToolUse hook — captures tool name + args, sends OTLP span
│   │   ├── post-tool.sh                   PostToolUse hook — captures tool result, closes span
│   │   └── stop.sh                        Stop hook — flushes session summary span on Claude Code exit
│   ├── mcp-server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts               Entry point — stdio MCP server
│   │   │   ├── tools.ts               15 tool definitions + handlers
│   │   │   └── client.ts              OAV REST API client + all shared types/interfaces
│   │   └── __tests__/
│   │       └── tools.test.ts
│   ├── hooks/
│   │   ├── pre-tool.sh                PreToolUse hook script
│   │   └── post-tool.sh               PostToolUse hook script
│   └── plugin/
│       ├── plugin.yaml                Plugin manifest
│       ├── skills/
│       │   ├── oav-status.md
│       │   ├── oav-agents.md
│       │   ├── oav-alerts.md
│       │   ├── oav-cost.md
│       │   ├── oav-replay.md
│       │   └── oav-debug.md
│       ├── hooks/
│       │   ├── session-start.sh
│       │   └── session-stop.sh
│       └── statusline/
│           └── status.sh
├── codex/
│   ├── adapter/
│   │   └── codex_adapter.py           Codex CLI OTLP adapter
│   └── plugin/
│       ├── package.json
│       ├── plugin.json                Codex plugin manifest
│       ├── commands/
│       │   ├── oav-status.js
│       │   ├── oav-agents.js
│       │   ├── oav-alerts.js
│       │   ├── oav-cost.js
│       │   └── oav-watch.js
│       └── middleware/
│           └── telemetry.js
├── gemini_cli/
│   └── adapter/
│       └── gemini_adapter.py          Gemini CLI OTLP adapter
└── open_source/
    ├── base.py                        OAVBaseTracer (shared OTLP logic)
    ├── langchain.py                   OAVCallbackHandler
    ├── langgraph.py                   OAVLangGraphTracer
    ├── crewai.py                      OAVCrewObserver
    ├── autogen.py                     OAVAutoGenLogger
    ├── openai_agents.py               OAVOpenAITracer
    ├── anthropic.py                   OAVAnthropicTracer
    ├── haystack.py                    OAVHaystackTracer
    ├── llamaindex.py                  OAVLlamaIndexCallback
    ├── semantic_kernel.py             OAVSKPlugin
    ├── dspy.py                        OAVDSPyLogger
    ├── pydantic_ai.py                 OAVPydanticAITracer
    ├── smolagents.py                  OAVSmolagentsCallback
    └── __tests__/
        ├── test_base.py
        ├── test_langchain.py
        └── test_adapters.py           Parametrized test covering all 12 adapters

> **Note on directory structure vs spec:** The spec's §4.1 architecture diagram shows `open-source/` as per-framework subdirectories (e.g., `langchain/`, `crewai/`). This plan uses flat `.py` files in `open_source/` instead. Rationale: flat files are simpler to maintain, avoid `__init__.py` per subdirectory, and Python requires underscore (not hyphen) for importable packages. Import paths remain `from src.integrations.open_source.langchain import OAVCallbackHandler`.

src/cli/
├── setup.py                           PyPI package config
├── oav/
│   ├── __init__.py
│   ├── cli.py                         Click CLI entry point
│   ├── install.py                     Install subcommands
│   ├── config.py                      Config read/write (~/.oav/config.json)
│   ├── status.py                      `oav status` command
│   └── __tests__/
│       └── test_cli.py

src/backend/app/routers/
├── integrations.py                    GET /api/integrations — list integration status
└── workspaces.py                      GET /api/workspaces — workspace metadata (used by MCP)

src/frontend/src/components/integrations/
├── IntegrationCard.tsx                (already planned in Sub-project A)
├── PluginCard.tsx                     Plugin-specific card (new)
└── __tests__/
    └── PluginCard.test.tsx
```

---

## Task 1: Backend — integration status router + workspace router

**Files:**
- Create: `OpenAgentVisualizer/src/backend/app/routers/integrations.py`
- Create: `OpenAgentVisualizer/src/backend/app/routers/workspaces.py`
- Modify: `OpenAgentVisualizer/src/backend/app/main.py` (register routers)
- Test: `OpenAgentVisualizer/src/backend/tests/test_integrations.py`

- [ ] **Step 1: Write failing tests**

```python
# src/backend/tests/test_integrations.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_integrations_requires_auth():
    r = client.get("/api/integrations")
    assert r.status_code == 401

def test_list_integrations_returns_list(auth_headers):
    r = client.get("/api/integrations", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # 15 known integrations: 3 CLI + 12 SDK
    assert len(data) == 15

def test_integration_schema(auth_headers):
    r = client.get("/api/integrations", headers=auth_headers)
    item = r.json()[0]
    assert "id" in item
    assert "name" in item
    assert "status" in item       # "connected" | "not_configured" | "error"
    assert "last_seen" in item    # ISO timestamp or null
    assert "event_count_24h" in item
    assert "install_command" in item

def test_workspace_info(auth_headers):
    r = client.get("/api/workspaces/default", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "workspace_id" in data
    assert "name" in data
    assert "agent_count" in data
    assert "endpoint" in data

def test_workspace_not_found_returns_404(auth_headers):
    r = client.get("/api/workspaces/nonexistent-ws-99", headers=auth_headers)
    assert r.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer
docker compose exec backend pytest tests/test_integrations.py -v 2>&1 | head -30
```
Expected: `FAILED` with `404 Not Found` or `ModuleNotFoundError`

- [ ] **Step 3: Create integration status router**

```python
# src/backend/app/routers/integrations.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.core.config import get_db
from app.models.trace import Trace
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

KNOWN_INTEGRATIONS = [
    {"id": "claude-code",        "name": "Claude Code",           "type": "cli",   "install_command": "oav install claude-code"},
    {"id": "codex",              "name": "Codex CLI",              "type": "cli",   "install_command": "oav install codex"},
    {"id": "gemini-cli",         "name": "Google Gemini CLI",      "type": "cli",   "install_command": "oav install gemini"},
    {"id": "langchain",          "name": "LangChain",              "type": "sdk",   "install_command": "pip install openagentvisualizer[langchain]"},
    {"id": "langgraph",          "name": "LangGraph",              "type": "sdk",   "install_command": "pip install openagentvisualizer[langchain]"},
    {"id": "crewai",             "name": "CrewAI",                 "type": "sdk",   "install_command": "pip install openagentvisualizer[crewai]"},
    {"id": "autogen",            "name": "AutoGen",                "type": "sdk",   "install_command": "pip install openagentvisualizer[autogen]"},
    {"id": "openai-agents",      "name": "OpenAI Agents SDK",      "type": "sdk",   "install_command": "pip install openagentvisualizer[openai]"},
    {"id": "anthropic",          "name": "Anthropic SDK",          "type": "sdk",   "install_command": "pip install openagentvisualizer[anthropic]"},
    {"id": "haystack",           "name": "Haystack",               "type": "sdk",   "install_command": "pip install openagentvisualizer[haystack]"},
    {"id": "llamaindex",         "name": "LlamaIndex",             "type": "sdk",   "install_command": "pip install openagentvisualizer[llamaindex]"},
    {"id": "semantic-kernel",    "name": "Semantic Kernel",        "type": "sdk",   "install_command": "pip install openagentvisualizer[semantic-kernel]"},
    {"id": "dspy",               "name": "DSPy",                   "type": "sdk",   "install_command": "pip install openagentvisualizer[dspy]"},
    {"id": "pydantic-ai",        "name": "Pydantic AI",            "type": "sdk",   "install_command": "pip install openagentvisualizer[pydantic-ai]"},
    {"id": "smolagents",         "name": "Smolagents (HuggingFace)","type": "sdk",  "install_command": "pip install openagentvisualizer[smolagents]"},
]

@router.get("")
def list_integrations(db: Session = Depends(get_db), user=Depends(get_current_user)):
    cutoff = datetime.utcnow() - timedelta(hours=24)
    result = []
    for integration in KNOWN_INTEGRATIONS:
        # Check last trace with this source
        q = db.query(Trace).filter(
            Trace.source == integration["id"],
            Trace.created_at >= cutoff
        )
        count_24h = q.count()
        last_trace = q.order_by(Trace.created_at.desc()).first()
        last_seen = last_trace.created_at.isoformat() if last_trace else None
        status = "connected" if last_trace else "not_configured"
        result.append({
            **integration,
            "status": status,
            "last_seen": last_seen,
            "event_count_24h": count_24h,
        })
    return result
```

- [ ] **Step 4: Create workspace router**

```python
# src/backend/app/routers/workspaces.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.core.config import get_db, settings
from app.models.trace import Trace

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

@router.get("/{workspace_id}")
def get_workspace(workspace_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    agent_count = db.query(Trace.agent_id).filter(
        Trace.workspace_id == workspace_id
    ).distinct().count()
    return {
        "workspace_id": workspace_id,
        "name": workspace_id.replace("-", " ").title(),
        "agent_count": agent_count,
        "endpoint": str(settings.API_BASE_URL) if hasattr(settings, "API_BASE_URL") else "http://localhost:8000",
    }
```

- [ ] **Step 5: Register routers in main.py**

In `src/backend/app/main.py`, add after existing router includes:
```python
from app.routers.integrations import router as integrations_router
from app.routers.workspaces import router as workspaces_router
app.include_router(integrations_router)
app.include_router(workspaces_router)
```

- [ ] **Step 6: Add `source` and `workspace_id` columns to Trace model**

In `src/backend/app/models/trace.py`, add both columns (add only if not already present after checking):
```python
source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
workspace_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
```
Create the migration unconditionally (the migration file is always created fresh):
```python
# src/backend/alembic/versions/004_add_trace_source_workspace.py
def upgrade():
    op.add_column('traces', sa.Column('source', sa.String(64), nullable=True))
    op.create_index('ix_traces_source', 'traces', ['source'])
    op.add_column('traces', sa.Column('workspace_id', sa.String(128), nullable=True))
    op.create_index('ix_traces_workspace_id', 'traces', ['workspace_id'])
def downgrade():
    op.drop_index('ix_traces_workspace_id', 'traces')
    op.drop_column('traces', 'workspace_id')
    op.drop_index('ix_traces_source', 'traces')
    op.drop_column('traces', 'source')
```

Also update `workspaces.py` router to return 404 when workspace has no agents:
```python
@router.get("/{workspace_id}")
def get_workspace(workspace_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    agent_count = db.query(Trace.agent_id).filter(
        Trace.workspace_id == workspace_id
    ).distinct().count()
    if agent_count == 0 and workspace_id != "default":
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found")
    return {
        "workspace_id": workspace_id,
        "name": workspace_id.replace("-", " ").title(),
        "agent_count": agent_count,
        "endpoint": str(settings.API_BASE_URL) if hasattr(settings, "API_BASE_URL") else "http://localhost:8000",
    }
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer
docker compose up --build -d backend
docker compose exec backend pytest tests/test_integrations.py -v
```
Expected: all 5 tests `PASSED`

- [ ] **Step 8: Commit**

```bash
git add src/backend/app/routers/integrations.py \
        src/backend/app/routers/workspaces.py \
        src/backend/app/models/trace.py \
        src/backend/alembic/versions/004_add_trace_source_workspace.py \
        src/backend/app/main.py \
        src/backend/tests/test_integrations.py
git commit -m "feat(backend): add integrations status router and workspace router"
```

---

## Task 2: OAV base OTLP tracer + shared types

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/conftest.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/base.py`
- Test: `OpenAgentVisualizer/src/integrations/open_source/__tests__/test_base.py`

- [ ] **Step 1: Create root conftest.py**

This adds `src/` to sys.path so all integration tests can use `from src.integrations...` imports:

```python
# src/integrations/conftest.py
import sys
import os

# Add the project src/ directory to sys.path so tests can import src.integrations.*
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
```

Also create `src/integrations/open_source/__init__.py` (empty) to make it a package:
```bash
touch src/integrations/__init__.py
touch src/integrations/open_source/__init__.py
touch src/integrations/open_source/__tests__/__init__.py
```

- [ ] **Step 2: Write failing tests** (create test file — it will fail because `base.py` doesn't exist yet)

```python
# src/integrations/open_source/__tests__/test_base.py
import pytest
from unittest.mock import patch, MagicMock
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

def test_base_tracer_init():
    tracer = OAVBaseTracer(endpoint="http://localhost:4318", api_key="test-key", source="langchain")
    assert tracer.endpoint == "http://localhost:4318"
    assert tracer.source == "langchain"

def test_span_to_otlp_dict():
    span = OAVSpan(
        agent_id="agent-1",
        operation="llm_call",
        input_tokens=100,
        output_tokens=50,
        latency_ms=1200,
        model="gpt-4o",
        cost_usd=0.0042,
        source="langchain",
    )
    d = span.to_otlp()
    assert d["name"] == "llm_call"
    assert d["attributes"]["oav.agent_id"] == "agent-1"
    assert d["attributes"]["oav.input_tokens"] == 100
    assert d["attributes"]["oav.cost_usd"] == pytest.approx(0.0042)

def test_base_tracer_send_span():
    tracer = OAVBaseTracer(endpoint="http://localhost:4318", api_key="key", source="test")
    span = OAVSpan(agent_id="a1", operation="op", input_tokens=10, output_tokens=5,
                   latency_ms=100, model="claude-3", cost_usd=0.001, source="test")
    with patch("requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200)
        tracer.send(span)
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args
        assert "v1/traces" in call_kwargs[0][0]
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer
python -m pytest src/integrations/open_source/__tests__/test_base.py -v 2>&1 | head -20
```
Expected: `FAILED` with `ModuleNotFoundError`

- [ ] **Step 4: Write base tracer**

```python
# src/integrations/open_source/base.py
from __future__ import annotations
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional
import requests

@dataclass
class OAVSpan:
    agent_id: str
    operation: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    model: str
    cost_usd: float
    source: str
    error: Optional[str] = None
    extra: dict = field(default_factory=dict)

    def to_otlp(self) -> dict:
        now_ns = int(time.time_ns())
        duration_ns = int(self.latency_ms * 1_000_000)
        return {
            "traceId": uuid.uuid4().hex,
            "spanId": uuid.uuid4().hex[:16],
            "name": self.operation,
            "startTimeUnixNano": now_ns - duration_ns,
            "endTimeUnixNano": now_ns,
            "status": {"code": 2 if self.error else 1},
            "attributes": {
                "oav.agent_id": self.agent_id,
                "oav.input_tokens": self.input_tokens,
                "oav.output_tokens": self.output_tokens,
                "oav.model": self.model,
                "oav.cost_usd": self.cost_usd,
                "oav.source": self.source,
                **({"oav.error": self.error} if self.error else {}),
                **{f"oav.extra.{k}": v for k, v in self.extra.items()},
            },
        }


class OAVBaseTracer:
    """Shared OTLP sender used by all 12 SDK adapters."""

    def __init__(self, endpoint: str, api_key: str, source: str, timeout: int = 5):
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.source = source
        self.timeout = timeout

    def send(self, span: OAVSpan) -> None:
        """Fire-and-forget OTLP HTTP export."""
        payload = {
            "resourceSpans": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": f"oav-{self.source}"}}]},
                "scopeSpans": [{"spans": [span.to_otlp()]}],
            }]
        }
        try:
            requests.post(
                f"{self.endpoint}/v1/traces",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                timeout=self.timeout,
            )
        except Exception:
            pass  # Never break the user's app for telemetry failure
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
python -m pytest src/integrations/open_source/__tests__/test_base.py -v
```
Expected: 3 tests `PASSED`

- [ ] **Step 6: Commit**

```bash
git add src/integrations/conftest.py \
        src/integrations/__init__.py \
        src/integrations/open_source/__init__.py \
        src/integrations/open_source/__tests__/__init__.py \
        src/integrations/open_source/base.py \
        src/integrations/open_source/__tests__/test_base.py
git commit -m "feat(integrations): add OAVBaseTracer shared OTLP exporter"
```

---

## Task 3: LangChain + LangGraph adapters

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/open_source/langchain.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/langgraph.py`
- Test: `OpenAgentVisualizer/src/integrations/open_source/__tests__/test_langchain.py`

- [ ] **Step 1: Write failing tests**

```python
# src/integrations/open_source/__tests__/test_langchain.py
import pytest
from unittest.mock import patch, MagicMock
from src.integrations.open_source.langchain import OAVCallbackHandler
from src.integrations.open_source.langgraph import OAVLangGraphTracer

def make_handler():
    return OAVCallbackHandler(endpoint="http://localhost:4318", api_key="key", agent_id="agent-1")

def test_callback_handler_on_llm_end():
    handler = make_handler()
    response = MagicMock()
    response.llm_output = {"token_usage": {"prompt_tokens": 50, "completion_tokens": 20}}
    with patch.object(handler.tracer, "send") as mock_send:
        handler.on_llm_start({"name": "gpt-4o"}, ["hello"])
        handler.on_llm_end(response)
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.input_tokens == 50
        assert span.output_tokens == 20
        assert span.source == "langchain"

def test_callback_handler_on_llm_error():
    handler = make_handler()
    with patch.object(handler.tracer, "send") as mock_send:
        handler.on_llm_start({"name": "gpt-4o"}, ["hello"])
        handler.on_llm_error(Exception("timeout"))
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.error == "timeout"

def test_langgraph_tracer_init():
    tracer = OAVLangGraphTracer(endpoint="http://localhost:4318", api_key="key", agent_id="g1")
    assert tracer.agent_id == "g1"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python -m pytest src/integrations/open_source/__tests__/test_langchain.py -v 2>&1 | head -20
```
Expected: `FAILED` with `ModuleNotFoundError`

- [ ] **Step 3: Implement LangChain adapter**

```python
# src/integrations/open_source/langchain.py
from __future__ import annotations
import os
import time
from typing import Any, Dict, List, Optional, Union
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

try:
    from langchain_core.callbacks.base import BaseCallbackHandler
    from langchain_core.outputs import LLMResult
    _HAS_LANGCHAIN = True
except ImportError:
    BaseCallbackHandler = object  # type: ignore
    _HAS_LANGCHAIN = False


class OAVCallbackHandler(BaseCallbackHandler):  # type: ignore[misc]
    """LangChain callback handler that sends traces to OpenAgentVisualizer."""

    def __init__(
        self,
        agent_id: str,
        endpoint: str = "",
        api_key: str = "",
    ):
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
            cost_usd=0.0,  # users can compute cost via OAV cost attribution
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
```

- [ ] **Step 4: Implement LangGraph adapter**

```python
# src/integrations/open_source/langgraph.py
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
python -m pytest src/integrations/open_source/__tests__/test_langchain.py -v
```
Expected: 3 tests `PASSED`

- [ ] **Step 6: Commit**

```bash
git add src/integrations/open_source/langchain.py \
        src/integrations/open_source/langgraph.py \
        src/integrations/open_source/__tests__/test_langchain.py
git commit -m "feat(integrations): add LangChain and LangGraph adapters"
```

---

## Task 4: Remaining 10 SDK adapters (parametrized TDD)

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/open_source/crewai.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/autogen.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/openai_agents.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/anthropic.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/haystack.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/llamaindex.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/semantic_kernel.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/dspy.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/pydantic_ai.py`
- Create: `OpenAgentVisualizer/src/integrations/open_source/smolagents.py`
- Test: `OpenAgentVisualizer/src/integrations/open_source/__tests__/test_adapters.py`

- [ ] **Step 1: Write parametrized failing tests**

```python
# src/integrations/open_source/__tests__/test_adapters.py
"""Smoke tests: every adapter must have the right class name, accept standard args, and expose a tracer."""
import pytest
import importlib

ADAPTERS = [
    ("src.integrations.open_source.crewai",          "OAVCrewObserver"),
    ("src.integrations.open_source.autogen",          "OAVAutoGenLogger"),
    ("src.integrations.open_source.openai_agents",    "OAVOpenAITracer"),
    ("src.integrations.open_source.anthropic",        "OAVAnthropicTracer"),
    ("src.integrations.open_source.haystack",         "OAVHaystackTracer"),
    ("src.integrations.open_source.llamaindex",       "OAVLlamaIndexCallback"),
    ("src.integrations.open_source.semantic_kernel",  "OAVSKPlugin"),
    ("src.integrations.open_source.dspy",             "OAVDSPyLogger"),
    ("src.integrations.open_source.pydantic_ai",      "OAVPydanticAITracer"),
    ("src.integrations.open_source.smolagents",       "OAVSmolagentsCallback"),
]

@pytest.mark.parametrize("module_path,class_name", ADAPTERS)
def test_adapter_importable(module_path, class_name):
    mod = importlib.import_module(module_path)
    assert hasattr(mod, class_name), f"{class_name} not found in {module_path}"

@pytest.mark.parametrize("module_path,class_name", ADAPTERS)
def test_adapter_instantiable(module_path, class_name):
    mod = importlib.import_module(module_path)
    cls = getattr(mod, class_name)
    instance = cls(endpoint="http://localhost:4318", api_key="key", agent_id="test-agent")
    assert hasattr(instance, "tracer")
    from src.integrations.open_source.base import OAVBaseTracer
    assert isinstance(instance.tracer, OAVBaseTracer)

@pytest.mark.parametrize("module_path,class_name", ADAPTERS)
def test_adapter_source_tag(module_path, class_name):
    mod = importlib.import_module(module_path)
    cls = getattr(mod, class_name)
    instance = cls(endpoint="http://localhost:4318", api_key="key", agent_id="test-agent")
    assert instance.tracer.source != ""
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python -m pytest src/integrations/open_source/__tests__/test_adapters.py -v 2>&1 | head -20
```
Expected: 30 `FAILED` with `ModuleNotFoundError`

- [ ] **Step 3: Implement all 10 adapters**

```python
# src/integrations/open_source/crewai.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVCrewObserver:
    SOURCE = "crewai"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._starts: Dict[str, float] = {}
    def on_task_start(self, task_name: str) -> None:
        self._starts[task_name] = time.time()
    def on_task_end(self, task_name: str, tokens: Optional[Dict] = None) -> None:
        t = tokens or {}
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"task:{task_name}", input_tokens=t.get("input",0), output_tokens=t.get("output",0), latency_ms=(time.time()-self._starts.pop(task_name,time.time()))*1000, model=t.get("model","crewai"), cost_usd=0.0, source=self.SOURCE))
    def on_task_error(self, task_name: str, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"task:{task_name}", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(task_name,time.time()))*1000, model="crewai", cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

```python
# src/integrations/open_source/autogen.py
from __future__ import annotations
import os, time
from typing import Any, Dict, List, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVAutoGenLogger:
    SOURCE = "autogen"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._start: float = 0.0
    def log_new_agent(self, agent_name: str) -> None:
        self._start = time.time()
    def log_chat_completion(self, agent_name: str, messages: List, response: Any, cost: float = 0.0) -> None:
        usage = getattr(response, "usage", None) or {}
        input_tok = getattr(usage, "prompt_tokens", 0) if hasattr(usage,"prompt_tokens") else usage.get("prompt_tokens",0)
        output_tok = getattr(usage, "completion_tokens", 0) if hasattr(usage,"completion_tokens") else usage.get("completion_tokens",0)
        self.tracer.send(OAVSpan(agent_id=agent_name or self.agent_id, operation="chat_completion", input_tokens=input_tok, output_tokens=output_tok, latency_ms=(time.time()-self._start)*1000, model=getattr(response,"model","autogen"), cost_usd=float(cost), source=self.SOURCE))
```

```python
# src/integrations/open_source/openai_agents.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVOpenAITracer:
    SOURCE = "openai-agents"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._starts: Dict[str, float] = {}
    def on_agent_start(self, agent_name: str) -> None:
        self._starts[agent_name] = time.time()
    def on_agent_end(self, agent_name: str, usage: Optional[Dict] = None) -> None:
        u = usage or {}
        self.tracer.send(OAVSpan(agent_id=agent_name or self.agent_id, operation="agent_run", input_tokens=u.get("input_tokens",0), output_tokens=u.get("output_tokens",0), latency_ms=(time.time()-self._starts.pop(agent_name,time.time()))*1000, model=u.get("model","openai"), cost_usd=0.0, source=self.SOURCE))
    def on_agent_error(self, agent_name: str, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=agent_name or self.agent_id, operation="agent_run", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(agent_name,time.time()))*1000, model="openai", cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

```python
# src/integrations/open_source/anthropic.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVAnthropicTracer:
    SOURCE = "anthropic"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._start: float = 0.0
        self._model: str = "claude"
    def on_message_start(self, model: str) -> None:
        self._start = time.time()
        self._model = model
    def on_message_end(self, usage: Optional[Dict] = None) -> None:
        u = usage or {}
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation="message", input_tokens=u.get("input_tokens",0), output_tokens=u.get("output_tokens",0), latency_ms=(time.time()-self._start)*1000, model=self._model, cost_usd=0.0, source=self.SOURCE))
    def on_message_error(self, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation="message", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._start)*1000, model=self._model, cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

```python
# src/integrations/open_source/haystack.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVHaystackTracer:
    SOURCE = "haystack"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._starts: Dict[str, float] = {}
    def on_component_start(self, name: str) -> None:
        self._starts[name] = time.time()
    def on_component_end(self, name: str, outputs: Any = None) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"component:{name}", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(name,time.time()))*1000, model="haystack", cost_usd=0.0, source=self.SOURCE))
    def on_component_error(self, name: str, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"component:{name}", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(name,time.time()))*1000, model="haystack", cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

```python
# src/integrations/open_source/llamaindex.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVLlamaIndexCallback:
    SOURCE = "llamaindex"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._starts: Dict[str, float] = {}
        self._models: Dict[str, str] = {}
    def on_llm_start(self, event_id: str, model: str = "llm") -> None:
        self._starts[event_id] = time.time()
        self._models[event_id] = model
    def on_llm_end(self, event_id: str, response: Any = None) -> None:
        usage = getattr(response, "raw", {}) or {}
        u = usage.get("usage", {}) if isinstance(usage, dict) else {}
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation="llm_call", input_tokens=u.get("prompt_tokens",0), output_tokens=u.get("completion_tokens",0), latency_ms=(time.time()-self._starts.pop(event_id,time.time()))*1000, model=self._models.pop(event_id,"llm"), cost_usd=0.0, source=self.SOURCE))
    def on_llm_error(self, event_id: str, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation="llm_call", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(event_id,time.time()))*1000, model=self._models.pop(event_id,"llm"), cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

```python
# src/integrations/open_source/semantic_kernel.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVSKPlugin:
    SOURCE = "semantic-kernel"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._starts: Dict[str, float] = {}
    def on_function_invoking(self, function_name: str) -> None:
        self._starts[function_name] = time.time()
    def on_function_invoked(self, function_name: str, result: Any = None) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"function:{function_name}", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(function_name,time.time()))*1000, model="semantic-kernel", cost_usd=0.0, source=self.SOURCE))
    def on_function_error(self, function_name: str, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"function:{function_name}", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(function_name,time.time()))*1000, model="semantic-kernel", cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

```python
# src/integrations/open_source/dspy.py
from __future__ import annotations
import os
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVDSPyLogger:
    SOURCE = "dspy"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
    def log_predict(self, signature_name: str, input_tokens: int, output_tokens: int, model: str, latency_ms: float) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"predict:{signature_name}", input_tokens=input_tokens, output_tokens=output_tokens, latency_ms=latency_ms, model=model, cost_usd=0.0, source=self.SOURCE))
```

```python
# src/integrations/open_source/pydantic_ai.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVPydanticAITracer:
    SOURCE = "pydantic-ai"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._start: float = 0.0
        self._model: str = "pydantic-ai"
    def on_run_start(self, agent_name: str, model: str = "pydantic-ai") -> None:
        self._start = time.time()
        self._model = model
    def on_run_end(self, usage: Optional[Dict] = None) -> None:
        u = usage or {}
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation="agent_run", input_tokens=u.get("request_tokens",0), output_tokens=u.get("response_tokens",0), latency_ms=(time.time()-self._start)*1000, model=self._model, cost_usd=0.0, source=self.SOURCE))
    def on_run_error(self, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation="agent_run", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._start)*1000, model=self._model, cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

```python
# src/integrations/open_source/smolagents.py
from __future__ import annotations
import os, time
from typing import Any, Dict, Optional
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan

class OAVSmolagentsCallback:
    SOURCE = "smolagents"
    def __init__(self, agent_id: str, endpoint: str = "", api_key: str = ""):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(endpoint or os.getenv("OAV_ENDPOINT","http://localhost:4318"), api_key or os.getenv("OAV_API_KEY",""), self.SOURCE)
        self._starts: Dict[str, float] = {}
    def on_step_start(self, step_name: str) -> None:
        self._starts[step_name] = time.time()
    def on_step_end(self, step_name: str, output: Any = None, usage: Optional[Dict] = None) -> None:
        u = usage or {}
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"step:{step_name}", input_tokens=u.get("input_tokens",0), output_tokens=u.get("output_tokens",0), latency_ms=(time.time()-self._starts.pop(step_name,time.time()))*1000, model=u.get("model","smolagents"), cost_usd=0.0, source=self.SOURCE))
    def on_step_error(self, step_name: str, error: Exception) -> None:
        self.tracer.send(OAVSpan(agent_id=self.agent_id, operation=f"step:{step_name}", input_tokens=0, output_tokens=0, latency_ms=(time.time()-self._starts.pop(step_name,time.time()))*1000, model="smolagents", cost_usd=0.0, source=self.SOURCE, error=str(error)))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
python -m pytest src/integrations/open_source/__tests__/test_adapters.py -v
```
Expected: 30 tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/integrations/open_source/crewai.py \
        src/integrations/open_source/autogen.py \
        src/integrations/open_source/openai_agents.py \
        src/integrations/open_source/anthropic.py \
        src/integrations/open_source/haystack.py \
        src/integrations/open_source/llamaindex.py \
        src/integrations/open_source/semantic_kernel.py \
        src/integrations/open_source/dspy.py \
        src/integrations/open_source/pydantic_ai.py \
        src/integrations/open_source/smolagents.py \
        src/integrations/open_source/__tests__/test_adapters.py
git commit -m "feat(integrations): add all 10 remaining SDK adapters (CrewAI through Smolagents)"
```

---

## Task 5: Codex CLI adapter + Gemini CLI adapter

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/codex/__init__.py`
- Create: `OpenAgentVisualizer/src/integrations/codex/adapter/__init__.py`
- Create: `OpenAgentVisualizer/src/integrations/codex/adapter/codex_adapter.py`
- Create: `OpenAgentVisualizer/src/integrations/gemini_cli/__init__.py`
- Create: `OpenAgentVisualizer/src/integrations/gemini_cli/adapter/__init__.py`
- Create: `OpenAgentVisualizer/src/integrations/gemini_cli/adapter/gemini_adapter.py`
- Test: `OpenAgentVisualizer/src/integrations/__tests__/test_cli_adapters.py`

- [ ] **Step 1: Create package __init__.py files**

```bash
touch src/integrations/codex/__init__.py
touch src/integrations/codex/adapter/__init__.py
touch src/integrations/gemini_cli/__init__.py
touch src/integrations/gemini_cli/adapter/__init__.py
mkdir -p src/integrations/__tests__
touch src/integrations/__tests__/__init__.py
```

- [ ] **Step 2: Write failing tests**

```python
# src/integrations/__tests__/test_cli_adapters.py
import pytest
from unittest.mock import patch, MagicMock
from src.integrations.codex.adapter.codex_adapter import CodexAdapter
from src.integrations.gemini_cli.adapter.gemini_adapter import GeminiAdapter

def test_codex_adapter_init():
    a = CodexAdapter(endpoint="http://localhost:4318", api_key="k")
    assert a.tracer.source == "codex"

def test_codex_adapter_wrap_tool_call():
    a = CodexAdapter(endpoint="http://localhost:4318", api_key="k")
    event = {"tool": "bash", "input": "ls -la", "output": "file1\nfile2", "duration_ms": 120}
    with patch.object(a.tracer, "send") as mock_send:
        a.on_tool_call(event)
        mock_send.assert_called_once()
        span = mock_send.call_args[0][0]
        assert span.operation == "tool:bash"
        assert span.latency_ms == 120

def test_gemini_adapter_init():
    a = GeminiAdapter(endpoint="http://localhost:4318", api_key="k")
    assert a.tracer.source == "gemini-cli"

def test_gemini_adapter_on_tool_call():
    a = GeminiAdapter(endpoint="http://localhost:4318", api_key="k")
    event = {"tool_name": "google_search", "latency_ms": 300, "tokens": {"input": 20, "output": 80}}
    with patch.object(a.tracer, "send") as mock_send:
        a.on_tool_call(event)
        mock_send.assert_called_once()
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
python -m pytest src/integrations/__tests__/test_cli_adapters.py -v 2>&1 | head -20
```
Expected: `FAILED` with `ModuleNotFoundError`

- [ ] **Step 4: Implement Codex adapter**

```python
# src/integrations/codex/adapter/codex_adapter.py
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
        """Call this for each Codex tool execution event."""
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
```

- [ ] **Step 5: Implement Gemini adapter**

```python
# src/integrations/gemini_cli/adapter/gemini_adapter.py
from __future__ import annotations
import os
from typing import Dict, Any
from src.integrations.open_source.base import OAVBaseTracer, OAVSpan


class GeminiAdapter:
    """Hooks into Gemini CLI tool execution lifecycle."""

    def __init__(self, endpoint: str = "", api_key: str = "", agent_id: str = "gemini-session"):
        self.agent_id = agent_id
        self.tracer = OAVBaseTracer(
            endpoint=endpoint or os.getenv("OAV_ENDPOINT", "http://localhost:4318"),
            api_key=api_key or os.getenv("OAV_API_KEY", ""),
            source="gemini-cli",
        )

    def on_tool_call(self, event: Dict[str, Any]) -> None:
        tokens = event.get("tokens", {})
        self.tracer.send(OAVSpan(
            agent_id=self.agent_id,
            operation=f"tool:{event.get('tool_name', 'unknown')}",
            input_tokens=tokens.get("input", 0),
            output_tokens=tokens.get("output", 0),
            latency_ms=float(event.get("latency_ms", 0)),
            model=event.get("model", "gemini"),
            cost_usd=0.0,
            source="gemini-cli",
            error=event.get("error"),
        ))
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
python -m pytest src/integrations/__tests__/test_cli_adapters.py -v
```
Expected: 4 tests `PASSED`

- [ ] **Step 7: Commit**

```bash
git add src/integrations/codex/__init__.py \
        src/integrations/codex/adapter/__init__.py \
        src/integrations/codex/adapter/codex_adapter.py \
        src/integrations/gemini_cli/__init__.py \
        src/integrations/gemini_cli/adapter/__init__.py \
        src/integrations/gemini_cli/adapter/gemini_adapter.py \
        src/integrations/__tests__/__init__.py \
        src/integrations/__tests__/test_cli_adapters.py
git commit -m "feat(integrations): add Codex CLI adapter and Gemini CLI adapter"
```

---

## Task 6: Claude Code MCP server (15 tools)

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/claude-code/mcp-server/package.json`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/mcp-server/tsconfig.json`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/mcp-server/src/index.ts`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/mcp-server/src/tools.ts`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/mcp-server/src/client.ts`
- Test: `OpenAgentVisualizer/src/integrations/claude-code/mcp-server/__tests__/tools.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/integrations/claude-code/mcp-server/__tests__/tools.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TOOL_DEFINITIONS, handleTool } from '../src/tools';
import type { OAVClient } from '../src/client';

describe('MCP tool definitions', () => {
  it('exports exactly 15 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(15);
  });

  it('all tools have name, description, inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('oav_list_agents calls client.listAgents', async () => {
    const mockClient = { listAgents: vi.fn().mockResolvedValue([]) } as unknown as OAVClient;
    const result = await handleTool('oav_list_agents', { workspace_id: 'ws-1' }, mockClient);
    expect(mockClient.listAgents).toHaveBeenCalledWith('ws-1', undefined);
    expect(result.content[0].type).toBe('text');
  });

  it('oav_get_metrics calls client.getMetrics', async () => {
    const mockClient = { getMetrics: vi.fn().mockResolvedValue({ total_cost: 1.23 }) } as unknown as OAVClient;
    const result = await handleTool('oav_get_metrics', { period: 'day' }, mockClient);
    expect(mockClient.getMetrics).toHaveBeenCalledWith('day');
  });

  it('unknown tool returns error content', async () => {
    const mockClient = {} as OAVClient;
    const result = await handleTool('oav_nonexistent', {}, mockClient);
    expect(result.content[0].text).toContain('Unknown tool');
  });
});
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "@openagentvisualizer/mcp-server",
  "version": "1.0.0",
  "description": "OpenAgentVisualizer MCP server for Claude Code",
  "type": "module",
  "bin": {"oav-mcp": "./dist/index.js"},
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "vitest": "^1.6.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/integrations/claude-code/mcp-server
npm install && npm test 2>&1 | head -20
```
Expected: `FAILED` with `Cannot find module '../src/tools'`

- [ ] **Step 5: Implement client.ts**

```typescript
// src/integrations/claude-code/mcp-server/src/client.ts
export interface OAVClient {
  listAgents(workspaceId: string, status?: string): Promise<Agent[]>;
  getAgent(agentId: string): Promise<Agent>;
  getTraces(agentId: string, limit?: number, since?: string): Promise<Trace[]>;
  getAlerts(severity?: string, limit?: number): Promise<Alert[]>;
  getMetrics(period: string): Promise<Metrics>;
  replaySession(sessionId: string, speed?: number): Promise<{ url: string }>;
  setSampling(rate: number, agentId?: string): Promise<void>;
  getLeaderboard(limit?: number): Promise<LeaderEntry[]>;
  sendEvent(agentId: string, type: string, data: Record<string, unknown>): Promise<void>;
  getTopology(workspaceId: string): Promise<Topology>;
  getSLOStatus(agentId?: string): Promise<SLOStatus[]>;
  getPromptVersions(promptName: string): Promise<PromptVersion[]>;
  getCostBreakdown(period: string, agentId?: string): Promise<CostBreakdown>;
  getAuditLog(limit?: number, since?: string): Promise<AuditEntry[]>;
  getWorkspaceInfo(): Promise<WorkspaceInfo>;
}

export interface Agent { id: string; name: string; status: string; xp: number; }
export interface Trace { id: string; agent_id: string; created_at: string; }
export interface Alert { id: string; severity: string; message: string; }
export interface Metrics { total_cost: number; total_tokens: number; agent_count: number; }
export interface LeaderEntry { agent_id: string; xp: number; rank: number; }
export interface Topology { nodes: Agent[]; edges: Array<{from: string; to: string}>; }
export interface SLOStatus { agent_id: string; status: string; breaches: number; }
export interface PromptVersion { version: string; p50_latency: number; win_rate: number; }
export interface CostBreakdown { total: number; by_agent: Record<string, number>; }
export interface AuditEntry { id: string; action: string; created_at: string; }
export interface WorkspaceInfo { workspace_id: string; name: string; agent_count: number; }

export function createClient(endpoint: string, apiKey: string): OAVClient {
  const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  async function get<T>(path: string): Promise<T> {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`${endpoint}${path}`, { headers });
    if (!r.ok) throw new Error(`OAV API error ${r.status}: ${path}`);
    return r.json() as Promise<T>;
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`${endpoint}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`OAV API error ${r.status}: ${path}`);
    return r.json() as Promise<T>;
  }

  return {
    listAgents: (ws, status) => get(`/api/agents?workspace_id=${ws}${status ? `&status=${status}` : ''}`),
    getAgent: (id) => get(`/api/agents/${id}`),
    getTraces: (id, limit=20, since) => get(`/api/traces?agent_id=${id}&limit=${limit}${since ? `&since=${since}` : ''}`),
    getAlerts: (severity, limit=20) => get(`/api/alerts?limit=${limit}${severity ? `&severity=${severity}` : ''}`),
    getMetrics: (period) => get(`/api/dashboard/metrics?period=${period}`),
    replaySession: (id, speed=1) => post(`/api/replay/start`, { session_id: id, speed }),
    setSampling: (rate, agentId) => post(`/api/sampling/config`, { rate, agent_id: agentId }),
    getLeaderboard: (limit=10) => get(`/api/gamification/leaderboard?limit=${limit}`),
    sendEvent: (agentId, type, data) => post(`/api/events`, { agent_id: agentId, type, data }),
    getTopology: (ws) => get(`/api/topology?workspace_id=${ws}`),
    getSLOStatus: (agentId) => get(`/api/slo/status${agentId ? `?agent_id=${agentId}` : ''}`),
    getPromptVersions: (name) => get(`/api/prompts/${encodeURIComponent(name)}/versions`),
    getCostBreakdown: (period, agentId) => get(`/api/costs/breakdown?period=${period}${agentId ? `&agent_id=${agentId}` : ''}`),
    getAuditLog: (limit=50, since) => get(`/api/audit?limit=${limit}${since ? `&since=${since}` : ''}`),
    getWorkspaceInfo: () => get(`/api/workspaces/default`),
  };
}
```

- [ ] **Step 6: Implement tools.ts**

```typescript
// src/integrations/claude-code/mcp-server/src/tools.ts
import type { OAVClient } from './client.js';

export interface MCPToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface MCPToolDef {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}

export const TOOL_DEFINITIONS: MCPToolDef[] = [
  { name: 'oav_list_agents', description: 'List agents in a workspace', inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' }, status: { type: 'string', enum: ['working', 'idle', 'error'] } }, required: ['workspace_id'] } },
  { name: 'oav_get_agent', description: 'Get agent detail', inputSchema: { type: 'object', properties: { agent_id: { type: 'string' } }, required: ['agent_id'] } },
  { name: 'oav_get_traces', description: 'Fetch recent traces', inputSchema: { type: 'object', properties: { agent_id: { type: 'string' }, limit: { type: 'number' }, since: { type: 'string' } }, required: ['agent_id'] } },
  { name: 'oav_get_alerts', description: 'Fetch active alerts', inputSchema: { type: 'object', properties: { severity: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'oav_get_metrics', description: 'Cost and token summary', inputSchema: { type: 'object', properties: { period: { type: 'string', enum: ['day', 'week', 'month'] } }, required: ['period'] } },
  { name: 'oav_replay_session', description: 'Start session replay', inputSchema: { type: 'object', properties: { session_id: { type: 'string' }, speed: { type: 'number' } }, required: ['session_id'] } },
  { name: 'oav_set_sampling', description: 'Set trace sampling rate', inputSchema: { type: 'object', properties: { rate: { type: 'number', minimum: 0, maximum: 1 }, agent_id: { type: 'string' } }, required: ['rate'] } },
  { name: 'oav_get_leaderboard', description: 'XP leaderboard', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'oav_send_event', description: 'Inject custom event', inputSchema: { type: 'object', properties: { agent_id: { type: 'string' }, type: { type: 'string' }, data: { type: 'object' } }, required: ['agent_id', 'type', 'data'] } },
  { name: 'oav_get_topology', description: 'Agent dependency graph', inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' } }, required: ['workspace_id'] } },
  { name: 'oav_get_slo_status', description: 'SLO breach status', inputSchema: { type: 'object', properties: { agent_id: { type: 'string' } } } },
  { name: 'oav_get_prompt_versions', description: 'Prompt A/B data', inputSchema: { type: 'object', properties: { prompt_name: { type: 'string' } }, required: ['prompt_name'] } },
  { name: 'oav_get_cost_breakdown', description: 'Per-agent cost breakdown', inputSchema: { type: 'object', properties: { period: { type: 'string' }, agent_id: { type: 'string' } }, required: ['period'] } },
  { name: 'oav_get_audit_log', description: 'Audit trail entries', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, since: { type: 'string' } } } },
  { name: 'oav_workspace_info', description: 'Workspace metadata', inputSchema: { type: 'object', properties: {} } },
];

export async function handleTool(name: string, args: Record<string, unknown>, client: OAVClient): Promise<MCPToolResult> {
  const text = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
  const err = (msg: string) => ({ content: [{ type: 'text' as const, text: msg }], isError: true });

  try {
    switch (name) {
      case 'oav_list_agents': return text(await client.listAgents(args.workspace_id as string, args.status as string | undefined));
      case 'oav_get_agent': return text(await client.getAgent(args.agent_id as string));
      case 'oav_get_traces': return text(await client.getTraces(args.agent_id as string, args.limit as number, args.since as string));
      case 'oav_get_alerts': return text(await client.getAlerts(args.severity as string, args.limit as number));
      case 'oav_get_metrics': return text(await client.getMetrics(args.period as string));
      case 'oav_replay_session': return text(await client.replaySession(args.session_id as string, args.speed as number));
      case 'oav_set_sampling': await client.setSampling(args.rate as number, args.agent_id as string); return text({ success: true });
      case 'oav_get_leaderboard': return text(await client.getLeaderboard(args.limit as number));
      case 'oav_send_event': await client.sendEvent(args.agent_id as string, args.type as string, args.data as Record<string, unknown>); return text({ success: true });
      case 'oav_get_topology': return text(await client.getTopology(args.workspace_id as string));
      case 'oav_get_slo_status': return text(await client.getSLOStatus(args.agent_id as string));
      case 'oav_get_prompt_versions': return text(await client.getPromptVersions(args.prompt_name as string));
      case 'oav_get_cost_breakdown': return text(await client.getCostBreakdown(args.period as string, args.agent_id as string));
      case 'oav_get_audit_log': return text(await client.getAuditLog(args.limit as number, args.since as string));
      case 'oav_workspace_info': return text(await client.getWorkspaceInfo());
      default: return err(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err(`Tool error: ${(e as Error).message}`);
  }
}
```

- [ ] **Step 7: Implement index.ts (MCP stdio server)**

```typescript
// src/integrations/claude-code/mcp-server/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS, handleTool } from './tools.js';
import { createClient } from './client.js';

const endpoint = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const apiKey = process.env.OAV_API_KEY ?? '';
const client = createClient(endpoint, apiKey);

const server = new Server({ name: 'oav', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  return handleTool(name, (args ?? {}) as Record<string, unknown>, client);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/integrations/claude-code/mcp-server
npm test
```
Expected: 5 tests `PASSED`

- [ ] **Step 9: Build**

```bash
npm run build
```
Expected: `dist/index.js` created, no TypeScript errors

- [ ] **Step 10: Commit**

```bash
cd OpenAgentVisualizer
git add src/integrations/claude-code/mcp-server/package.json \
        src/integrations/claude-code/mcp-server/tsconfig.json \
        src/integrations/claude-code/mcp-server/src/index.ts \
        src/integrations/claude-code/mcp-server/src/tools.ts \
        src/integrations/claude-code/mcp-server/src/client.ts \
        src/integrations/claude-code/mcp-server/__tests__/tools.test.ts
git commit -m "feat(mcp): implement Claude Code MCP server with 15 OAV tools"
```

---

## Task 7: Claude Code plugin (plugin.yaml + 6 skills + hooks + statusline)

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/plugin.yaml`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/__tests__/test_plugin_schema.py`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/skills/oav-status.md`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/skills/oav-agents.md`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/skills/oav-alerts.md`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/skills/oav-cost.md`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/skills/oav-replay.md`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/skills/oav-debug.md`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/hooks/session-start.sh`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/hooks/session-stop.sh`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/plugin/statusline/status.sh`

- [ ] **Step 1: Write schema validation test**

```python
# src/integrations/claude-code/plugin/__tests__/test_plugin_schema.py
import yaml
import pathlib

PLUGIN_DIR = pathlib.Path(__file__).parent.parent

def test_plugin_yaml_valid_and_required_fields():
    data = yaml.safe_load((PLUGIN_DIR / "plugin.yaml").read_text())
    assert data["name"] == "oav"
    assert isinstance(data["skills"], list)
    assert len(data["skills"]) == 6
    assert "SessionStart" in data["hooks"]
    assert "Stop" in data["hooks"]
    assert "statusline" in data

def test_all_skill_files_exist():
    data = yaml.safe_load((PLUGIN_DIR / "plugin.yaml").read_text())
    for skill_path in data["skills"]:
        assert (PLUGIN_DIR / skill_path).exists(), f"Missing skill file: {skill_path}"

def test_hook_scripts_exist():
    data = yaml.safe_load((PLUGIN_DIR / "plugin.yaml").read_text())
    for hook_path in data["hooks"].values():
        assert (PLUGIN_DIR / hook_path).exists(), f"Missing hook script: {hook_path}"
```

Run to confirm it fails (plugin.yaml not yet created):
```bash
cd OpenAgentVisualizer/src/integrations/claude-code/plugin
python -m pytest __tests__/test_plugin_schema.py -v 2>&1 | head -15
```
Expected: `FAILED` — `FileNotFoundError` or `ModuleNotFoundError` for `plugin.yaml`.

- [ ] **Step 2: Create plugin.yaml**

```yaml
# src/integrations/claude-code/plugin/plugin.yaml
name: oav
display_name: OpenAgentVisualizer
version: 1.0.0
description: Observe, debug, and optimize your AI agents directly from Claude Code
author: OpenAgentVisualizer
permissions:
  - network: [localhost]
  - env: [OAV_API_KEY, OAV_ENDPOINT]
  - read: [~/.oav/config.json]
skills:
  - skills/oav-status.md
  - skills/oav-agents.md
  - skills/oav-alerts.md
  - skills/oav-cost.md
  - skills/oav-replay.md
  - skills/oav-debug.md
hooks:
  SessionStart: hooks/session-start.sh
  Stop: hooks/session-stop.sh
statusline: statusline/status.sh
```

- [ ] **Step 3: Create 6 skill markdown files**

```markdown
<!-- skills/oav-status.md -->
# OAV Status

Fetch and display OpenAgentVisualizer workspace health.

Use the `oav_workspace_info` MCP tool and `oav_get_metrics` with `period=day` to retrieve:
- Agent count and status breakdown (working / idle / error)
- Active alert count by severity
- Total cost today
- Top agent by XP (use `oav_get_leaderboard` with `limit=1`)

Format output as a compact status table. If any Critical alerts exist, highlight in red at the top.
```

```markdown
<!-- skills/oav-agents.md -->
# OAV Agents

List all agents in the current workspace and optionally open agent detail in a browser tab.

1. Use `oav_list_agents` with the default workspace_id from `oav_workspace_info`.
2. Display as a table: Agent Name | Status | XP | Last Active.
3. Ask the user if they want to open any agent's detail page.
4. If yes, output the URL: `$OAV_ENDPOINT/agents/<agent_id>` and suggest they open it in a browser.
```

```markdown
<!-- skills/oav-alerts.md -->
# OAV Alerts

Triage and resolve active alerts.

1. Use `oav_get_alerts` to fetch all active alerts.
2. Display grouped by severity: Critical → High → Medium → Low.
3. For each alert: ID, message, agent, timestamp.
4. Ask the user which alert IDs to resolve (accept comma-separated list or "all").
5. For each selected ID, use `oav_send_event` with `type=resolve_alert` and `data={alert_id: "<id>"}`.
6. Confirm resolution count.
```

```markdown
<!-- skills/oav-cost.md -->
# OAV Cost

Show cost breakdown for the current Claude Code session's agent.

1. Use `oav_get_cost_breakdown` with `period=day`.
2. Show total cost today, cost by agent (top 5 by spend).
3. Show token breakdown: input vs output vs cache.
4. If total daily cost exceeds $1.00, flag it.
```

```markdown
<!-- skills/oav-replay.md -->
# OAV Replay

Open session replay for a recent session.

1. Ask the user: "Which session? Last session, or a session ID?" (default: last session).
2. Use `oav_replay_session` with the session_id and optional speed multiplier.
3. Output the replay URL returned and instruct user to open it in a browser.
4. The replay shows the full agent execution timeline with tool calls, costs, and decisions.
```

```markdown
<!-- skills/oav-debug.md -->
# OAV Debug

Deep-dive debug for a specific agent.

Usage: `/oav-debug <agent_id>`

1. Use `oav_get_traces` for the agent (limit=50).
2. Use `oav_get_slo_status` for the agent.
3. Use `oav_get_topology` to show what agents this agent depends on.
4. Present findings:
   - Recent error traces (if any)
   - SLO breach count and type
   - Dependency chain
   - Suggested actions based on error patterns
```

- [ ] **Step 4: Create hook scripts**

```bash
#!/usr/bin/env bash
# hooks/session-start.sh
# Registers a new OAV session on Claude Code session start.
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
SESSION_ID="cc-$(date +%s)-$$"

curl -s -X POST "${ENDPOINT}/api/events" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"session_start\",\"agent_id\":\"claude-code\",\"data\":{\"session_id\":\"${SESSION_ID}\",\"pid\":$$}}" \
  --max-time 2 || true  # Never block Claude Code startup

echo "${SESSION_ID}" > "${HOME}/.oav/.current_session_id"
```

```bash
#!/usr/bin/env bash
# hooks/session-stop.sh
# Closes the OAV session span when Claude Code exits.
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
SESSION_FILE="${HOME}/.oav/.current_session_id"
SESSION_ID=$(cat "${SESSION_FILE}" 2>/dev/null || echo "unknown")

curl -s -X POST "${ENDPOINT}/api/events" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"session_stop\",\"agent_id\":\"claude-code\",\"data\":{\"session_id\":\"${SESSION_ID}\"}}" \
  --max-time 2 || true

rm -f "${SESSION_FILE}"
```

- [ ] **Step 5: Create statusline script**

```bash
#!/usr/bin/env bash
# statusline/status.sh
# Outputs OAV status line segment for Claude Code status bar.
# Format: ⬡ OAV  N agents  ⚠ N alerts  $N.NN
ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"

RESPONSE=$(curl -s "${ENDPOINT}/api/dashboard/metrics?period=day" \
  -H "Authorization: Bearer ${API_KEY}" \
  --max-time 1 2>/dev/null)

if [ -z "${RESPONSE}" ]; then
  echo "⬡ OAV offline"
  exit 0
fi

AGENTS=$(echo "${RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agent_count',0))" 2>/dev/null || echo "?")
COST=$(echo "${RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"\${d.get('total_cost',0):.2f}\")" 2>/dev/null || echo "?")

ALERTS=$(curl -s "${ENDPOINT}/api/alerts?limit=1&severity=critical" \
  -H "Authorization: Bearer ${API_KEY}" \
  --max-time 1 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [ "${ALERTS}" -gt 0 ] 2>/dev/null; then
  echo "⬡ OAV  ${AGENTS} agents  ⚠ ${ALERTS} alert  \$${COST}"
else
  echo "⬡ OAV  ${AGENTS} agents  \$${COST}"
fi
```

- [ ] **Step 6: Make hook/statusline scripts executable**

```bash
chmod +x src/integrations/claude-code/plugin/hooks/*.sh
chmod +x src/integrations/claude-code/plugin/statusline/status.sh
```

- [ ] **Step 7: Run schema validation test to verify plugin structure**

```bash
cd OpenAgentVisualizer/src/integrations/claude-code/plugin
python -m pytest __tests__/test_plugin_schema.py -v
```
Expected: 3 tests `PASSED`.

- [ ] **Step 8: Manual verification**

```bash
# Dry-run the statusline script
OAV_ENDPOINT=http://localhost:8000 OAV_API_KEY=test \
  bash src/integrations/claude-code/plugin/statusline/status.sh
```
Expected: `⬡ OAV offline` (since no server running locally) or actual agent count if backend is up.

- [ ] **Step 9: Commit plugin files**

```bash
git add src/integrations/claude-code/plugin/plugin.yaml \
        src/integrations/claude-code/plugin/skills/oav-status.md \
        src/integrations/claude-code/plugin/skills/oav-agents.md \
        src/integrations/claude-code/plugin/skills/oav-alerts.md \
        src/integrations/claude-code/plugin/skills/oav-cost.md \
        src/integrations/claude-code/plugin/skills/oav-replay.md \
        src/integrations/claude-code/plugin/skills/oav-debug.md \
        src/integrations/claude-code/plugin/hooks/session-start.sh \
        src/integrations/claude-code/plugin/hooks/session-stop.sh \
        src/integrations/claude-code/plugin/statusline/status.sh \
        src/integrations/claude-code/plugin/__tests__/test_plugin_schema.py
git commit -m "feat(plugin): add Claude Code plugin with 6 skills, hooks, and statusline"
```

---

## Task 7b: Claude Code transparent telemetry hooks (PreToolUse / PostToolUse)

These are the **transparent OTLP telemetry hooks** — separate from the plugin's `session-start.sh` / `session-stop.sh`. They fire on every tool call and capture tool latency + result.

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/claude-code/hooks/pre-tool.sh`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/hooks/post-tool.sh`
- Create: `OpenAgentVisualizer/src/integrations/claude-code/hooks/stop.sh`

> **Note:** Hook registration in `install.py` (`_install_claude_code_mcp`) is implemented **in Task 9** where `install.py` is created from scratch with the complete version. The failing test for that logic (`test_hook_registration.py`) is written and verified in Task 9. This task covers only the shell scripts.

- [ ] **Step 1: No automated unit test for shell scripts** — scripts are verified manually in Step 7. The `install.py` hook registration is tested in Task 9.

- [ ] **Step 2: Create pre-tool.sh (PreToolUse hook)**

```bash
#!/usr/bin/env bash
# src/integrations/claude-code/hooks/pre-tool.sh
# Registered as Claude Code PreToolUse hook.
# Input: JSON on stdin — {"tool_name": "...", "tool_input": {...}}
# Saves tool start time to temp file for post-tool.sh to consume.
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "${INPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name','unknown'))" 2>/dev/null || echo "unknown")
SPAN_ID="oav-$(date +%s%N)-$$"
TMPFILE="/tmp/oav_hook_${SPAN_ID}"

echo "${TOOL_NAME}" > "${TMPFILE}.tool"
date +%s%3N > "${TMPFILE}.start"
echo "${SPAN_ID}" >&2  # Pass span ID to Claude Code env for post-hook to pick up
```

- [ ] **Step 3: Create post-tool.sh (PostToolUse hook)**

```bash
#!/usr/bin/env bash
# src/integrations/claude-code/hooks/post-tool.sh
# Registered as Claude Code PostToolUse hook.
# Input: JSON on stdin — {"tool_name": "...", "tool_result": {...}}
# Reads start time from temp file, computes latency, sends OTLP span.
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name','unknown'))" 2>/dev/null || echo "unknown")
END_MS=$(date +%s%3N)

# Find most recent temp file for this tool
TMPFILE=$(ls -t /tmp/oav_hook_*.tool 2>/dev/null | head -1 || echo "")
START_MS="${END_MS}"
if [ -n "${TMPFILE}" ]; then
  START_FILE="${TMPFILE%.tool}.start"
  START_MS=$(cat "${START_FILE}" 2>/dev/null || echo "${END_MS}")
  rm -f "${TMPFILE}" "${START_FILE}" 2>/dev/null || true
fi

LATENCY=$((END_MS - START_MS))
TRACE_ID=$(python3 -c "import uuid; print(uuid.uuid4().hex)" 2>/dev/null || echo "00000000000000000000000000000000")
NOW_NS=$((END_MS * 1000000))
START_NS=$(((START_MS) * 1000000))

curl -s -X POST "${ENDPOINT}/v1/traces" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"oav-claude-code\"}}]},\"scopeSpans\":[{\"spans\":[{\"traceId\":\"${TRACE_ID}\",\"spanId\":\"${TRACE_ID:0:16}\",\"name\":\"tool:${TOOL_NAME}\",\"startTimeUnixNano\":\"${START_NS}\",\"endTimeUnixNano\":\"${NOW_NS}\",\"status\":{\"code\":1},\"attributes\":{\"oav.source\":\"claude-code\",\"oav.latency_ms\":${LATENCY}}}]}]}]}" \
  --max-time 2 || true  # Never block Claude Code
```

- [ ] **Step 4: Create stop.sh (Stop hook)**

```bash
#!/usr/bin/env bash
# src/integrations/claude-code/hooks/stop.sh
# Registered as Claude Code Stop hook — fires when Claude Code session ends.
# Sends a session-end span so the OAV timeline shows session boundaries.
set -euo pipefail

ENDPOINT="${OAV_ENDPOINT:-http://localhost:8000}"
API_KEY="${OAV_API_KEY:-}"
NOW_NS=$(($(date +%s%3N) * 1000000))
TRACE_ID=$(python3 -c "import uuid; print(uuid.uuid4().hex)" 2>/dev/null || echo "00000000000000000000000000000000")

curl -s -X POST "${ENDPOINT}/v1/traces" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"oav-claude-code\"}}]},\"scopeSpans\":[{\"spans\":[{\"traceId\":\"${TRACE_ID}\",\"spanId\":\"${TRACE_ID:0:16}\",\"name\":\"session:stop\",\"startTimeUnixNano\":\"${NOW_NS}\",\"endTimeUnixNano\":\"${NOW_NS}\",\"status\":{\"code\":1},\"attributes\":{\"oav.source\":\"claude-code\",\"oav.event\":\"session_stop\"}}]}]}]}" \
  --max-time 2 || true  # Never block Claude Code exit
```

- [ ] **Step 5: Make hook scripts executable**

```bash
chmod +x src/integrations/claude-code/hooks/pre-tool.sh
chmod +x src/integrations/claude-code/hooks/post-tool.sh
chmod +x src/integrations/claude-code/hooks/stop.sh
```

- [ ] **Step 6: Manual shell verification**

```bash
# Dry-run pre-tool hook
echo '{"tool_name":"bash","tool_input":{"command":"ls"}}' | \
  bash src/integrations/claude-code/hooks/pre-tool.sh

# Dry-run post-tool hook (expect curl to fail gracefully since no backend)
echo '{"tool_name":"bash","tool_result":{"output":"file1"}}' | \
  OAV_ENDPOINT=http://localhost:8000 OAV_API_KEY=test \
  bash src/integrations/claude-code/hooks/post-tool.sh

# Dry-run stop hook (expect curl to fail gracefully since no backend)
OAV_ENDPOINT=http://localhost:8000 OAV_API_KEY=test \
  bash src/integrations/claude-code/hooks/stop.sh
```
Expected: pre-tool creates temp file; post-tool and stop fire curl and exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/integrations/claude-code/hooks/pre-tool.sh \
        src/integrations/claude-code/hooks/post-tool.sh \
        src/integrations/claude-code/hooks/stop.sh
git commit -m "feat(hooks): add Claude Code PreToolUse/PostToolUse/Stop transparent telemetry hook scripts"
```

> **Note:** Hook registration in `_install_claude_code_mcp` and the `test_hook_registration.py` test are in **Task 9** where `install.py` is created from scratch with the full implementation.

---

## Task 8: Codex CLI plugin (plugin.json + 5 commands + telemetry middleware)

**Files:**
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/package.json` (with `"type": "commonjs"` and test script)
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/plugin.json`
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/commands/oav-status.js`
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/commands/oav-agents.js`
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/commands/oav-alerts.js`
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/commands/oav-cost.js`
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/commands/oav-watch.js`
- Create: `OpenAgentVisualizer/src/integrations/codex/plugin/middleware/telemetry.js`
- Test: `OpenAgentVisualizer/src/integrations/codex/plugin/__tests__/telemetry.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// src/integrations/codex/plugin/__tests__/telemetry.test.js
// Run with: node --test __tests__/telemetry.test.js
const assert = require('node:assert/strict');
const { describe, it, mock } = require('node:test');

describe('Codex telemetry middleware', () => {
  it('exports onToolStart, onToolEnd, onToolError', () => {
    const m = require('../middleware/telemetry.js');
    assert.equal(typeof m.onToolStart, 'function');
    assert.equal(typeof m.onToolEnd, 'function');
    assert.equal(typeof m.onToolError, 'function');
  });

  it('onToolStart sets _tool and _start', () => {
    const m = require('../middleware/telemetry.js');
    m.onToolStart({ tool: 'bash' });
    assert.equal(m._tool, 'bash');
    assert.ok(m._start > 0);
  });

  it('plugin.json is valid JSON with required fields', () => {
    const manifest = require('../plugin.json');
    assert.ok(manifest.name);
    assert.ok(manifest.commands);
    assert.ok(manifest.entrypoint);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/integrations/codex/plugin
node --test __tests__/telemetry.test.js 2>&1 | head -20
```
Expected: `FAILED` with `Cannot find module '../middleware/telemetry.js'`

- [ ] **Step 3: Create package.json with CommonJS module type**

```json
{
  "name": "oav-codex-plugin",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "test": "node --test __tests__/telemetry.test.js"
  }
}
```

> **Note:** `"type": "commonjs"` is required because all `.js` files in this plugin use `require()` and `module.exports`. Without this, Node.js 20+ defaults to ESM and will fail to load them.

- [ ] **Step 4: Create plugin.json**

```json
{
  "name": "oav",
  "displayName": "OpenAgentVisualizer",
  "version": "1.0.0",
  "description": "Observe your Codex sessions as OAV agent traces in real time",
  "entrypoint": "middleware/telemetry.js",
  "commands": {
    "oav": {
      "description": "OpenAgentVisualizer commands",
      "subcommands": {
        "status":  "commands/oav-status.js",
        "agents":  "commands/oav-agents.js",
        "alerts":  "commands/oav-alerts.js",
        "cost":    "commands/oav-cost.js",
        "watch":   "commands/oav-watch.js"
      }
    }
  },
  "env": ["OAV_API_KEY", "OAV_ENDPOINT"]
}
```

- [ ] **Step 5: Create telemetry middleware**

```javascript
// middleware/telemetry.js
// Wraps every Codex tool execution in an OAV OTLP span.
const fetch = globalThis.fetch ?? require('node-fetch');

const ENDPOINT = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const API_KEY = process.env.OAV_API_KEY ?? '';

async function sendSpan({ tool, latencyMs, inputTokens = 0, outputTokens = 0, error = null }) {
  const now = Date.now() * 1e6;
  const span = {
    traceId: Math.random().toString(16).slice(2).padEnd(32, '0'),
    spanId: Math.random().toString(16).slice(2, 18),
    name: `tool:${tool}`,
    startTimeUnixNano: (now - latencyMs * 1e6).toString(),
    endTimeUnixNano: now.toString(),
    status: { code: error ? 2 : 1 },
    attributes: {
      'oav.source': 'codex',
      'oav.input_tokens': inputTokens,
      'oav.output_tokens': outputTokens,
      ...(error ? { 'oav.error': String(error) } : {}),
    },
  };
  try {
    await fetch(`${ENDPOINT}/v1/traces`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceSpans: [{ scopeSpans: [{ spans: [span] }] }] }),
      signal: AbortSignal.timeout(2000),
    });
  } catch { /* telemetry failures must never break Codex */ }
}

// Export middleware hook for Codex plugin system
module.exports = {
  onToolStart({ tool }) { this._start = Date.now(); this._tool = tool; },
  async onToolEnd({ output, tokens }) {
    await sendSpan({ tool: this._tool, latencyMs: Date.now() - (this._start ?? Date.now()), ...tokens });
  },
  async onToolError({ error }) {
    await sendSpan({ tool: this._tool, latencyMs: Date.now() - (this._start ?? Date.now()), error });
  },
};
```

- [ ] **Step 6: Create 5 command files**

Each command file uses the same REST-fetch pattern and outputs formatted text:

```javascript
// commands/oav-status.js
const fetch = globalThis.fetch ?? require('node-fetch');
const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
const h = { Authorization: `Bearer ${K}` };

module.exports = async function oavStatus() {
  try {
    const [metrics, alerts] = await Promise.all([
      fetch(`${E}/api/dashboard/metrics?period=day`, { headers: h }).then(r => r.json()),
      fetch(`${E}/api/alerts?limit=5`, { headers: h }).then(r => r.json()),
    ]);
    console.log(`\n⬡ OpenAgentVisualizer — Workspace Status`);
    console.log(`Agents: ${metrics.agent_count ?? 0}  |  Cost today: $${(metrics.total_cost ?? 0).toFixed(2)}  |  Tokens: ${(metrics.total_tokens ?? 0).toLocaleString()}`);
    if (alerts.length) console.log(`Active alerts: ${alerts.length} (run /oav alerts to triage)`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
```

```javascript
// commands/oav-agents.js
const fetch = globalThis.fetch ?? require('node-fetch');
const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavAgents() {
  try {
    const agents = await fetch(`${E}/api/agents?workspace_id=default`, { headers: { Authorization: `Bearer ${K}` } }).then(r => r.json());
    console.log('\n⬡ Agents:\n');
    for (const a of agents) console.log(`  ${a.status === 'working' ? '●' : a.status === 'error' ? '✕' : '○'} ${a.name} (${a.id})  XP: ${a.xp ?? 0}`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
```

```javascript
// commands/oav-alerts.js
const fetch = globalThis.fetch ?? require('node-fetch');
const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavAlerts() {
  try {
    const alerts = await fetch(`${E}/api/alerts?limit=20`, { headers: { Authorization: `Bearer ${K}` } }).then(r => r.json());
    if (!alerts.length) { console.log('\n⬡ No active alerts\n'); return; }
    console.log(`\n⬡ Active Alerts (${alerts.length}):\n`);
    for (const a of alerts) console.log(`  [${a.severity?.toUpperCase()}] ${a.message}  — ${a.id}`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
```

```javascript
// commands/oav-cost.js
const fetch = globalThis.fetch ?? require('node-fetch');
const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavCost() {
  try {
    const bd = await fetch(`${E}/api/costs/breakdown?period=day`, { headers: { Authorization: `Bearer ${K}` } }).then(r => r.json());
    console.log(`\n⬡ Cost Breakdown (today):`);
    console.log(`Total: $${(bd.total ?? 0).toFixed(4)}`);
    const byAgent = bd.by_agent ?? {};
    for (const [id, cost] of Object.entries(byAgent).sort(([,a],[,b]) => Number(b) - Number(a)).slice(0, 5))
      console.log(`  ${id}: $${Number(cost).toFixed(4)}`);
    console.log('');
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
```

```javascript
// commands/oav-watch.js
// Live-tail agent events via Server-Sent Events
const E = process.env.OAV_ENDPOINT ?? 'http://localhost:8000';
const K = process.env.OAV_API_KEY ?? '';
module.exports = async function oavWatch() {
  console.log('\n⬡ OAV live event stream (Ctrl+C to stop)\n');
  try {
    const https = require('http');
    const url = new URL(`${E}/api/events/stream`);
    https.get({ host: url.hostname, port: url.port || 8000, path: url.pathname, headers: { Authorization: `Bearer ${K}` } }, (res) => {
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter((l) => l.startsWith('data:'));
        for (const line of lines) {
          try { const evt = JSON.parse(line.slice(5)); console.log(`  [${evt.type}] ${evt.agent_id} — ${JSON.stringify(evt.data)}`); }
          catch { /* ignore parse errors */ }
        }
      });
    }).on('error', (e) => console.error(`OAV stream error: ${e.message}`));
  } catch (e) { console.error(`OAV: ${e.message}`); }
};
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/integrations/codex/plugin
node --test __tests__/telemetry.test.js
```
Expected: 3 tests `PASSED`

- [ ] **Step 8: Manual verification**

```bash
# Check plugin.json is valid JSON
node -e "require('./src/integrations/codex/plugin/plugin.json'); console.log('valid')"
# Check telemetry.js exports required hooks
node -e "const m = require('./src/integrations/codex/plugin/middleware/telemetry.js'); console.log(Object.keys(m).join(', '))"
```
Expected: `valid` and `onToolStart, onToolEnd, onToolError`

- [ ] **Step 9: Commit**

```bash
cd OpenAgentVisualizer
git add src/integrations/codex/plugin/package.json \
        src/integrations/codex/plugin/plugin.json \
        src/integrations/codex/plugin/middleware/telemetry.js \
        src/integrations/codex/plugin/commands/oav-status.js \
        src/integrations/codex/plugin/commands/oav-agents.js \
        src/integrations/codex/plugin/commands/oav-alerts.js \
        src/integrations/codex/plugin/commands/oav-cost.js \
        src/integrations/codex/plugin/commands/oav-watch.js \
        src/integrations/codex/plugin/__tests__/telemetry.test.js
git commit -m "feat(plugin): add Codex CLI plugin with 5 commands, telemetry middleware, and tests"
```

---

## Task 9: OAV Python CLI tool (`oav` command)

**Files:**
- Create: `OpenAgentVisualizer/src/cli/oav/__init__.py`
- Create: `OpenAgentVisualizer/src/cli/oav/cli.py`
- Create: `OpenAgentVisualizer/src/cli/oav/install.py`
- Create: `OpenAgentVisualizer/src/cli/oav/config.py`
- Create: `OpenAgentVisualizer/src/cli/oav/status.py`
- Create: `OpenAgentVisualizer/src/cli/setup.py`
- Test: `OpenAgentVisualizer/src/cli/oav/__tests__/test_cli.py`

- [ ] **Step 1: Write failing tests**

```python
# src/cli/oav/__tests__/test_cli.py
import pytest
from click.testing import CliRunner
from oav.cli import cli

def test_cli_help():
    runner = CliRunner()
    result = runner.invoke(cli, ['--help'])
    assert result.exit_code == 0
    assert 'install' in result.output
    assert 'status' in result.output
    assert 'config' in result.output

def test_config_set_endpoint():
    runner = CliRunner()
    with runner.isolated_filesystem():
        result = runner.invoke(cli, ['config', 'set', 'endpoint', 'http://localhost:8000'])
        assert result.exit_code == 0
        assert 'endpoint' in result.output.lower()

def test_install_shows_usage():
    runner = CliRunner()
    result = runner.invoke(cli, ['install', '--help'])
    assert result.exit_code == 0
    assert 'claude-code' in result.output or 'integration' in result.output.lower()

def test_status_offline():
    runner = CliRunner()
    result = runner.invoke(cli, ['status'])
    # Should not crash even if OAV backend is offline
    assert result.exit_code == 0
```

Also write the hook-registration test now (before install.py exists — TDD red phase):

```python
# src/cli/oav/__tests__/test_hook_registration.py
import json
from unittest.mock import patch
from oav.install import _install_claude_code_mcp

def test_install_registers_all_three_hook_types(tmp_path):
    settings_path = tmp_path / "settings.json"
    settings_path.write_text("{}")
    with patch("pathlib.Path.home", return_value=tmp_path):
        _install_claude_code_mcp(endpoint="http://localhost:4318", api_key="test-key")
    settings = json.loads(settings_path.read_text())
    assert "PreToolUse" in settings["hooks"]
    assert "PostToolUse" in settings["hooks"]
    assert "Stop" in settings["hooks"]
    assert len(settings["hooks"]["PreToolUse"]) == 1

def test_install_is_idempotent(tmp_path):
    settings_path = tmp_path / "settings.json"
    settings_path.write_text("{}")
    with patch("pathlib.Path.home", return_value=tmp_path):
        _install_claude_code_mcp(endpoint="http://localhost:4318", api_key="key")
        _install_claude_code_mcp(endpoint="http://localhost:4318", api_key="key")
    settings = json.loads(settings_path.read_text())
    assert len(settings["hooks"]["PreToolUse"]) == 1
    assert len(settings["hooks"]["Stop"]) == 1
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd OpenAgentVisualizer/src/cli
pip install -e . 2>/dev/null; python -m pytest oav/__tests__/test_cli.py oav/__tests__/test_hook_registration.py -v 2>&1 | head -20
```
Expected: `FAILED` with `ModuleNotFoundError: No module named 'oav'` (both test files fail — implementation does not yet exist)

- [ ] **Step 3: Create setup.py and oav/__init__.py**

```python
# src/cli/setup.py
from setuptools import setup, find_packages

setup(
    name="openagentvisualizer",
    version="1.0.0",
    packages=find_packages(),
    install_requires=["click>=8.1", "requests>=2.31"],
    extras_require={
        "langchain": ["langchain-core>=0.2"],
        "crewai": ["crewai>=0.1"],
        "autogen": ["pyautogen>=0.2"],
        "openai": ["openai>=1.0"],
        "anthropic": ["anthropic>=0.25"],
        "haystack": ["haystack-ai>=2.0"],
        "llamaindex": ["llama-index>=0.10"],
        "semantic-kernel": ["semantic-kernel>=1.0"],
        "dspy": ["dspy-ai>=2.0"],
        "pydantic-ai": ["pydantic-ai>=0.0.1"],
        "smolagents": ["smolagents>=1.0"],
        "all": ["langchain-core", "crewai", "pyautogen", "openai", "anthropic",
                "haystack-ai", "llama-index", "semantic-kernel", "dspy-ai", "smolagents"],
    },
    entry_points={"console_scripts": ["oav=oav.cli:cli"]},
)
```

Also create the empty package marker file:
```bash
touch src/cli/oav/__init__.py
touch src/cli/oav/__tests__/__init__.py
```

- [ ] **Step 4: Implement config.py**

```python
# src/cli/oav/config.py
import json
import os
from pathlib import Path
from typing import Any

CONFIG_PATH = Path.home() / ".oav" / "config.json"

def load_config() -> dict:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text())
    return {"endpoint": "http://localhost:8000", "api_key": ""}

def save_config(cfg: dict) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2))

def get(key: str, default: Any = None) -> Any:
    return load_config().get(key, default)

def set_value(key: str, value: Any) -> None:
    cfg = load_config()
    cfg[key] = value
    save_config(cfg)
```

- [ ] **Step 5: Implement cli.py with all subcommands**

```python
# src/cli/oav/cli.py
import click
from oav import config as cfg_module
from oav import install as install_module
from oav import status as status_module

@click.group()
@click.version_option("1.0.0")
def cli():
    """OpenAgentVisualizer CLI — install and manage OAV integrations."""
    pass

@cli.group()
def config():
    """Configure OAV endpoint and API key."""
    pass

@config.command("set")
@click.argument("key", type=click.Choice(["endpoint", "api-key"]))
@click.argument("value")
def config_set(key, value):
    """Set a config value (endpoint or api-key)."""
    cfg_module.set_value(key.replace("-", "_"), value)
    click.echo(f"✓ Set {key} = {value}")

@config.command("show")
def config_show():
    """Show current config."""
    c = cfg_module.load_config()
    for k, v in c.items():
        display = "***" if k == "api_key" and v else v
        click.echo(f"{k}: {display}")

@cli.command()
@click.argument("integration", type=click.Choice([
    "claude-code", "claude-code-plugin", "codex", "codex-plugin", "gemini",
    "langchain", "crewai", "autogen", "openai", "anthropic",
    "haystack", "llamaindex", "semantic-kernel", "dspy", "pydantic-ai", "smolagents",
]))
def install(integration):
    """Install an OAV integration."""
    install_module.install(integration)

@cli.command()
def status():
    """Show connection status for all installed integrations."""
    status_module.show()

@cli.command()
@click.argument("integration")
def test(integration):
    """Fire a test event for an integration and verify it appears in OAV."""
    install_module.test_integration(integration)
```

- [ ] **Step 6: Implement install.py and status.py**

```python
# src/cli/oav/install.py
import click
import subprocess
from oav import config as cfg_module

SDK_MESSAGES = {
    "langchain": "pip install openagentvisualizer[langchain]",
    "crewai": "pip install openagentvisualizer[crewai]",
    "autogen": "pip install openagentvisualizer[autogen]",
    "openai": "pip install openagentvisualizer[openai]",
    "anthropic": "pip install openagentvisualizer[anthropic]",
    "haystack": "pip install openagentvisualizer[haystack]",
    "llamaindex": "pip install openagentvisualizer[llamaindex]",
    "semantic-kernel": "pip install openagentvisualizer[semantic-kernel]",
    "dspy": "pip install openagentvisualizer[dspy]",
    "pydantic-ai": "pip install openagentvisualizer[pydantic-ai]",
    "smolagents": "pip install openagentvisualizer[smolagents]",
}

def install(integration: str) -> None:
    if integration in SDK_MESSAGES:
        click.echo(f"\nTo use the {integration} adapter, install the extra:\n")
        click.echo(f"  {SDK_MESSAGES[integration]}\n")
        click.echo("Then in your code:")
        click.echo(f"  from openagentvisualizer.integrations.{integration.replace('-','_')} import OAV{_class_suffix(integration)}")
        return

    endpoint = cfg_module.get("endpoint", "http://localhost:8000")
    api_key = cfg_module.get("api_key", "")

    if integration == "claude-code":
        _install_claude_code_mcp(endpoint, api_key)
    elif integration == "claude-code-plugin":
        _install_claude_code_plugin()
    elif integration == "codex":
        _install_codex_adapter(endpoint, api_key)
    elif integration == "codex-plugin":
        _install_codex_plugin()
    elif integration == "gemini":
        _install_gemini_adapter(endpoint, api_key)

def _class_suffix(name: str) -> str:
    parts = {"langchain": "CallbackHandler", "langgraph": "LangGraphTracer", "crewai": "CrewObserver",
             "autogen": "AutoGenLogger", "openai": "OpenAITracer", "anthropic": "AnthropicTracer",
             "haystack": "HaystackTracer", "llamaindex": "LlamaIndexCallback", "semantic-kernel": "SKPlugin",
             "dspy": "DSPyLogger", "pydantic-ai": "PydanticAITracer", "smolagents": "SmolagentsCallback"}
    return parts.get(name, "Tracer")

def _install_claude_code_mcp(endpoint: str, api_key: str) -> None:
    import json, pathlib
    settings_path = pathlib.Path.home() / ".claude" / "settings.json"
    settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}

    # Register MCP server
    settings.setdefault("mcpServers", {})["oav"] = {
        "command": "node",
        "args": [str(pathlib.Path.home() / ".oav" / "mcp-server" / "dist" / "index.js")],
        "env": {"OAV_ENDPOINT": endpoint, "OAV_API_KEY": api_key},
    }

    # Register transparent telemetry hooks (PreToolUse, PostToolUse, Stop)
    hooks_dir = pathlib.Path(__file__).parent.parent.parent / "integrations" / "claude-code" / "hooks"
    for hook_event, hook_file in [
        ("PreToolUse", "pre-tool.sh"),
        ("PostToolUse", "post-tool.sh"),
        ("Stop", "stop.sh"),
    ]:
        settings.setdefault("hooks", {}).setdefault(hook_event, [])
        hook_path = str(hooks_dir / hook_file)
        if hook_path not in settings["hooks"][hook_event]:
            settings["hooks"][hook_event].append(hook_path)

    settings_path.parent.mkdir(parents=True, exist_ok=True)
    settings_path.write_text(json.dumps(settings, indent=2))
    click.echo("✓ MCP server registered in ~/.claude/settings.json")
    click.echo("✓ PreToolUse, PostToolUse, and Stop hooks registered for transparent telemetry")
    click.echo("  Restart Claude Code to activate.")

def _install_claude_code_plugin() -> None:
    import pathlib, shutil
    plugin_src = pathlib.Path(__file__).parent.parent.parent / "integrations" / "claude-code" / "plugin"
    plugin_dst = pathlib.Path.home() / ".claude" / "plugins" / "oav"
    plugin_dst.parent.mkdir(parents=True, exist_ok=True)
    if plugin_dst.exists():
        shutil.rmtree(plugin_dst)
    shutil.copytree(plugin_src, plugin_dst)
    click.echo(f"✓ Claude Code plugin installed to {plugin_dst}")
    click.echo("  Restart Claude Code to activate /oav-* commands.")

def _install_codex_adapter(endpoint: str, api_key: str) -> None:
    import json, pathlib
    config_path = pathlib.Path.home() / ".codex" / "config.json"
    config = json.loads(config_path.read_text()) if config_path.exists() else {}
    config["oav_endpoint"] = endpoint
    config["oav_api_key"] = api_key
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text(json.dumps(config, indent=2))
    click.echo("✓ Codex adapter config written to ~/.codex/config.json")

def _install_codex_plugin() -> None:
    import pathlib, shutil, json
    plugin_src = pathlib.Path(__file__).parent.parent.parent / "integrations" / "codex" / "plugin"
    plugin_dst = pathlib.Path.home() / ".codex" / "plugins" / "oav"
    plugin_dst.parent.mkdir(parents=True, exist_ok=True)
    if plugin_dst.exists():
        shutil.rmtree(plugin_dst)
    shutil.copytree(plugin_src, plugin_dst)
    plugins_json = pathlib.Path.home() / ".codex" / "plugins.json"
    plugins = json.loads(plugins_json.read_text()) if plugins_json.exists() else []
    if "oav" not in plugins:
        plugins.append("oav")
        plugins_json.write_text(json.dumps(plugins, indent=2))
    click.echo(f"✓ Codex plugin installed to {plugin_dst}")

def _install_gemini_adapter(endpoint: str, api_key: str) -> None:
    import pathlib
    try:
        import yaml
    except ImportError:
        click.echo("Install pyyaml first: pip install pyyaml")
        return
    config_path = pathlib.Path.home() / ".gemini" / "config.yaml"
    config = yaml.safe_load(config_path.read_text()) if config_path.exists() else {}
    config["oav_endpoint"] = endpoint
    config["oav_api_key"] = api_key
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text(yaml.dump(config))
    click.echo("✓ Gemini CLI config patched at ~/.gemini/config.yaml")

def test_integration(integration: str) -> None:
    import requests
    endpoint = cfg_module.get("endpoint", "http://localhost:8000")
    api_key = cfg_module.get("api_key", "")
    try:
        r = requests.post(f"{endpoint}/api/events",
            json={"type": "oav_test", "agent_id": f"test-{integration}", "data": {"source": integration}},
            headers={"Authorization": f"Bearer {api_key}"}, timeout=3)
        if r.ok:
            click.echo(f"✓ Test event sent for {integration}. Check OAV canvas.")
        else:
            click.echo(f"✗ Error {r.status_code}: {r.text}")
    except Exception as e:
        click.echo(f"✗ Could not reach OAV backend: {e}")
```

```python
# src/cli/oav/status.py
import click
import requests
from oav import config as cfg_module

INTEGRATIONS = ["claude-code", "codex", "gemini-cli", "langchain", "langgraph", "crewai",
                "autogen", "openai-agents", "anthropic", "haystack", "llamaindex",
                "semantic-kernel", "dspy", "pydantic-ai", "smolagents"]

def show() -> None:
    endpoint = cfg_module.get("endpoint", "http://localhost:8000")
    api_key = cfg_module.get("api_key", "")
    try:
        r = requests.get(f"{endpoint}/api/integrations",
            headers={"Authorization": f"Bearer {api_key}"}, timeout=3)
        if not r.ok:
            click.echo(f"✗ OAV backend error {r.status_code}")
            return
        integrations = r.json()
        click.echo("\n⬡ OAV Integration Status\n")
        for item in integrations:
            icon = "●" if item["status"] == "connected" else "○"
            last = f"  Last: {item['last_seen'][:19]}" if item.get("last_seen") else ""
            click.echo(f"  {icon} {item['name']:<30} {item['status']:<15} {item.get('event_count_24h', 0):>5} events/24h{last}")
        click.echo("")
    except Exception as e:
        click.echo(f"✗ Cannot reach OAV backend at {endpoint}: {e}")
        click.echo("  Run: oav config set endpoint <url>")
```

- [ ] **Step 7: Run all CLI tests to verify they pass**

```bash
cd OpenAgentVisualizer/src/cli
pip install -e ".[all]"
python -m pytest oav/__tests__/test_cli.py oav/__tests__/test_hook_registration.py -v
```
Expected: 6 tests `PASSED`

- [ ] **Step 8: Verify CLI works**

```bash
oav --help
oav config set endpoint http://localhost:8000
oav status
```
Expected: help text displayed, config saved, status shows offline message

> **Note — `oav update` command:** Upgrading installed integrations in-place is a V2 feature (requires version tracking). Out of scope for this plan. Users can re-run `oav install <integration>` to overwrite.

- [ ] **Step 9: Commit**

```bash
cd OpenAgentVisualizer
git add src/cli/setup.py \
        src/cli/oav/__init__.py \
        src/cli/oav/__tests__/__init__.py \
        src/cli/oav/cli.py \
        src/cli/oav/install.py \
        src/cli/oav/config.py \
        src/cli/oav/status.py \
        src/cli/oav/__tests__/test_cli.py \
        src/cli/oav/__tests__/test_hook_registration.py
git commit -m "feat(cli): add oav Python CLI tool with install, status, config, and test commands"
```

---

## Task 10: PluginCard frontend component

**Files:**
- Create: `OpenAgentVisualizer/src/frontend/src/components/integrations/PluginCard.tsx`
- Test: `OpenAgentVisualizer/src/frontend/src/components/integrations/__tests__/PluginCard.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/frontend/src/components/integrations/__tests__/PluginCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PluginCard } from '../PluginCard';

const CLAUDE_PLUGIN = {
  id: 'claude-code-plugin',
  name: 'Claude Code Plugin',
  version: '1.0.0',
  status: 'active' as const,
  commands: ['/oav-status', '/oav-agents', '/oav-alerts', '/oav-cost', '/oav-replay', '/oav-debug'],
  installCommand: 'oav install claude-code-plugin',
};

const NOT_INSTALLED = {
  ...CLAUDE_PLUGIN,
  id: 'codex-plugin',
  name: 'Codex Plugin',
  status: 'not_installed' as const,
  commands: ['/oav status', '/oav agents', '/oav alerts', '/oav cost', '/oav watch'],
};

describe('PluginCard', () => {
  it('renders plugin name and version', () => {
    render(<PluginCard plugin={CLAUDE_PLUGIN} />);
    expect(screen.getByText('Claude Code Plugin')).toBeTruthy();
    expect(screen.getByText('v1.0.0')).toBeTruthy();
  });

  it('shows Active badge for active plugin', () => {
    render(<PluginCard plugin={CLAUDE_PLUGIN} />);
    expect(screen.getByText(/active/i)).toBeTruthy();
  });

  it('shows install command for not_installed plugin', () => {
    render(<PluginCard plugin={NOT_INSTALLED} />);
    expect(screen.getByText(/oav install/i)).toBeTruthy();
  });

  it('shows command list', () => {
    render(<PluginCard plugin={CLAUDE_PLUGIN} />);
    expect(screen.getByText('/oav-status')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd OpenAgentVisualizer/src/frontend
npm test -- src/components/integrations/__tests__/PluginCard.test.tsx 2>&1 | head -20
```
Expected: `FAILED` with `Cannot find module '../PluginCard'`

- [ ] **Step 3: Implement PluginCard**

```typescript
// src/frontend/src/components/integrations/PluginCard.tsx
interface Plugin {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'not_installed' | 'error';
  commands: string[];
  installCommand: string;
}

interface Props {
  plugin: Plugin;
  onInstall?: () => void;
  onUpdate?: () => void;
  onRemove?: () => void;
}

export function PluginCard({ plugin, onInstall, onUpdate, onRemove }: Props) {
  const isActive = plugin.status === 'active';
  const maxCommands = 3;
  const visibleCommands = plugin.commands.slice(0, maxCommands);
  const extraCount = plugin.commands.length - maxCommands;

  return (
    <div className="rounded-xl border border-[var(--oav-border)] bg-[var(--oav-surface)] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-[var(--oav-text)] text-sm">{plugin.name}</p>
          <p className="text-[var(--oav-muted)] text-xs mt-0.5">v{plugin.version}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isActive
              ? 'bg-green-500/10 text-green-400'
              : plugin.status === 'error'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-[var(--oav-surface-2)] text-[var(--oav-muted)]'
          }`}
        >
          {isActive ? '● Active' : plugin.status === 'error' ? '✕ Error' : '○ Not installed'}
        </span>
      </div>

      {/* Commands */}
      <div className="flex flex-wrap gap-1">
        {visibleCommands.map((cmd) => (
          <code key={cmd} className="text-xs bg-[var(--oav-surface-2)] text-[var(--oav-accent)] px-1.5 py-0.5 rounded">
            {cmd}
          </code>
        ))}
        {extraCount > 0 && (
          <span className="text-xs text-[var(--oav-muted)] px-1.5 py-0.5">+{extraCount} more</span>
        )}
      </div>

      {/* Actions */}
      {isActive ? (
        <div className="flex gap-2 mt-auto">
          {onUpdate && (
            <button onClick={onUpdate} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--oav-border)] text-[var(--oav-muted)] hover:text-[var(--oav-text)] transition-colors">
              Update
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/70 hover:text-red-400 transition-colors">
              Remove
            </button>
          )}
        </div>
      ) : (
        <div className="mt-auto">
          <code className="text-xs bg-[var(--oav-surface-2)] text-[var(--oav-muted)] px-2 py-1 rounded block mb-2">
            {plugin.installCommand}
          </code>
          <button
            onClick={onInstall}
            className="w-full text-xs py-1.5 rounded-lg bg-[var(--oav-accent)]/10 text-[var(--oav-accent)] hover:bg-[var(--oav-accent)]/20 transition-colors"
          >
            Install
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd OpenAgentVisualizer/src/frontend
npm test -- src/components/integrations/__tests__/PluginCard.test.tsx
```
Expected: 4 tests `PASSED`

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/integrations/PluginCard.tsx \
        src/frontend/src/components/integrations/__tests__/PluginCard.test.tsx
git commit -m "feat(ui): add PluginCard component for CLI plugin management in Settings"
```

---

## Task 11: Wire PluginCard into Settings → Integrations page

**Files:**
- Modify: `OpenAgentVisualizer/src/frontend/src/pages/SettingsPage.tsx`
- Create: `OpenAgentVisualizer/src/frontend/src/pages/__tests__/SettingsPage.test.tsx`

- [ ] **Step 1: Read current SettingsPage**

Read `src/frontend/src/pages/SettingsPage.tsx` to understand existing Integrations tab structure.

- [ ] **Step 2: Write failing test**

```typescript
// src/frontend/src/pages/__tests__/SettingsPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../SettingsPage';

test('renders CLI Plugins section in Integrations tab', () => {
  render(<MemoryRouter><SettingsPage /></MemoryRouter>);
  expect(screen.getByText('CLI Plugins')).toBeInTheDocument();
  expect(screen.getByText('Claude Code Plugin')).toBeInTheDocument();
  expect(screen.getByText('Codex Plugin')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/pages/__tests__/SettingsPage.test.tsx 2>&1 | tail -15
```
Expected: `FAILED` — "CLI Plugins" not found in DOM.

- [ ] **Step 4: Add plugin section above integration card grid**

In the Integrations tab section, add the Plugins sub-section above the existing adapter grid:

```typescript
import { PluginCard } from '../components/integrations/PluginCard';

const CLI_PLUGINS = [
  {
    id: 'claude-code-plugin',
    name: 'Claude Code Plugin',
    version: '1.0.0',
    status: 'not_installed' as const,
    commands: ['/oav-status', '/oav-agents', '/oav-alerts', '/oav-cost', '/oav-replay', '/oav-debug'],
    installCommand: 'oav install claude-code-plugin',
  },
  {
    id: 'codex-plugin',
    name: 'Codex Plugin',
    version: '1.0.0',
    status: 'not_installed' as const,
    commands: ['/oav status', '/oav agents', '/oav alerts', '/oav cost', '/oav watch'],
    installCommand: 'oav install codex-plugin',
  },
];
```

Add before the adapter grid JSX:
```tsx
<div className="mb-6">
  <h3 className="text-sm font-medium text-[var(--oav-text)] mb-3">CLI Plugins</h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {CLI_PLUGINS.map((plugin) => (
      <PluginCard key={plugin.id} plugin={plugin} />
    ))}
  </div>
</div>
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd OpenAgentVisualizer/src/frontend
npx vitest run src/pages/__tests__/SettingsPage.test.tsx
```
Expected: 1 test `PASSED`.

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/pages/SettingsPage.tsx \
        src/frontend/src/pages/__tests__/SettingsPage.test.tsx
git commit -m "feat(ui): wire PluginCard into Settings Integrations tab"
```

---

## Task 12: Docker rebuild + integration smoke test

**Files:**
No new files — this task rebuilds existing Docker services and runs all integration tests.

- [ ] **Step 1: Rebuild all services**

```bash
cd OpenAgentVisualizer
docker compose down
docker compose up --build -d
docker compose ps
```
Expected: `backend`, `frontend`, `db`, `redis` (if any) all `Up`

- [ ] **Step 2: Run backend integration tests**

```bash
docker compose exec backend pytest tests/test_integrations.py -v
```
Expected: all tests `PASSED`

- [ ] **Step 3: Run MCP server tests**

```bash
cd src/integrations/claude-code/mcp-server
npm test
```
Expected: all tests `PASSED`

- [ ] **Step 4: Verify frontend builds with PluginCard**

```bash
cd OpenAgentVisualizer/src/frontend
npm run build 2>&1 | tail -5
```
Expected: `Build complete` with no TypeScript errors

- [ ] **Step 5: Smoke test OAV CLI**

```bash
cd OpenAgentVisualizer/src/cli
pip install -e .
oav --help
oav config set endpoint http://localhost:8000
oav config set api-key test-api-key
oav status
```
Expected: help displayed, config saved, status output shows integration list

- [ ] **Step 6: Catch any uncommitted files and push**

```bash
cd OpenAgentVisualizer
# Safety net: catch any files that slipped through per-task commits
git status --short
# If any tracked files are modified/untracked, stage and commit them:
# git add <file> && git commit -m "chore: catch-up commit for missed files"
git push origin master
```

> If `git status` shows no changes, skip the add/commit and proceed directly to push.

---

## Completion Checklist

- [ ] Backend: `GET /api/integrations` returns 15 integration objects with status
- [ ] Backend: `GET /api/workspaces/{id}` returns workspace metadata
- [ ] MCP server: 15 tools compiled and testable via stdio
- [ ] Claude Code plugin: `plugin.yaml` + 6 skills + 2 hooks + statusline script
- [ ] Codex plugin: `plugin.json` + 5 commands + telemetry middleware
- [ ] 12 SDK adapters: all importable and instantiable, all using `OAVBaseTracer`
- [ ] 2 CLI adapters: Codex + Gemini
- [ ] OAV CLI: `oav install <integration>`, `oav status`, `oav config set` all work
- [ ] PluginCard component: renders both active and not-installed states
- [ ] Settings Integrations tab: Plugins section visible with 2 plugin cards
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Docker rebuild succeeds
