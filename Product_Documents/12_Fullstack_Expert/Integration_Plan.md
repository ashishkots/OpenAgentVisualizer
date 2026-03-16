# OpenAgentVisualizer — Integration & SDK Plan

**Stage:** 5.3 — Fullstack Expert
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Depends On:** System Architecture (4.1), Agent Integration Architecture (1.3), Frontend Expert (5.1), Backend Expert (5.2)
**Feeds Into:** Code Reviewer (5.4), QA Engineer (5.5), DevOps (Convergence)

---

## 1. Integration Overview

### 1.1 End-to-End System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AGENT EXECUTION ENVIRONMENTS                        │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │LangChain │ │ CrewAI   │ │ AutoGen  │ │ OpenAI   │ │ Anthropic /  │ │
│  │LangGraph │ │          │ │          │ │Assistants│ │ Ollama / HF  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │            │            │            │              │           │
│  ┌────▼────────────▼────────────▼────────────▼──────────────▼────────┐ │
│  │              Framework Adapters (per-framework hooks)              │ │
│  └─────────────────────────────┬─────────────────────────────────────┘ │
│                                │                                       │
│  ┌─────────────────────────────▼─────────────────────────────────────┐ │
│  │           SDK Core (Python / Node.js / REST)                      │ │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────────────┐ │ │
│  │  │Normalizer│ │Ring Buffer│ │ Context  │ │ PII Redaction       │ │ │
│  │  └──────────┘ └───────────┘ └──────────┘ └─────────────────────┘ │ │
│  └─────────────────────────────┬─────────────────────────────────────┘ │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                    OTLP gRPC:4317 / HTTP:4318 / REST:443
                                 │
┌────────────────────────────────▼───────────────────────────────────────┐
│                         BACKEND CLUSTER                                │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                NGINX Reverse Proxy (:80/:443)                   │   │
│  │  /api/* → FastAPI   /ws/* → WebSocket   /otlp/* → OTLP GW     │   │
│  └────┬────────────────────┬───────────────────────┬──────────────┘   │
│       │                    │                       │                   │
│  ┌────▼────┐  ┌────────────▼──────────┐  ┌────────▼──────────┐       │
│  │FastAPI  │  │ WebSocket Server      │  │ OTLP Ingestion GW │       │
│  │REST API │  │ (uvicorn :8001)       │  │ (:4317/:4318)     │       │
│  │(:8000)  │  └────────────┬──────────┘  └────────┬──────────┘       │
│  └────┬────┘               │                      │                   │
│       └────────────────────┴──────────┬───────────┘                   │
│                                       │                                │
│  ┌────────────────────────────────────▼────────────────────────────┐   │
│  │              Redis 7.2 (Event Bus + Cache)                      │   │
│  │  Streams → event ingestion   Pub/Sub → WS fanout   Cache       │   │
│  └────┬──────────────┬──────────────────────┬─────────────────────┘   │
│       │              │                      │                         │
│  ┌────▼────┐  ┌──────▼──────┐  ┌───────────▼──────────┐              │
│  │Persist  │  │Aggregation  │  │Celery Workers        │              │
│  │Writer   │  │Engine       │  │(gamification, alerts) │              │
│  └────┬────┘  └──────┬──────┘  └───────────┬──────────┘              │
│       │              │                      │                         │
│  ┌────▼──────────────▼──────────────────────▼─────────────────────┐   │
│  │   PostgreSQL 16 + TimescaleDB  │  Redis Cache                  │   │
│  │   (entities + time-series)     │  (sessions, metrics, boards)  │   │
│  └────────────────────────────────┴───────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ WebSocket / SSE / HTTPS
┌───────────────────────────────────▼────────────────────────────────────┐
│                        FRONTEND (Browser)                              │
│  PixiJS v8 (World) │ XState v5 (Actors) │ Zustand │ TanStack Query   │
│  Rive (Avatars)    │ React Flow (Topology) │ Recharts │ GSAP          │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Integration Points Summary

| Integration Point | Protocol | Port | Auth | Format |
|-------------------|----------|------|------|--------|
| SDK → OTLP Gateway | gRPC (primary) | 4317 | API key in metadata | Protobuf (OTLP) |
| SDK → OTLP Gateway | HTTP (fallback) | 4318 | `Authorization: Bearer` | JSON/Protobuf |
| SDK → REST API | HTTPS | 443 | `Authorization: Bearer` | JSON |
| OTLP GW → Redis | TCP | 6379 | Redis AUTH | XADD (Streams) |
| Redis → Persist Writer | Consumer Group | 6379 | Redis AUTH | Stream entries |
| Redis → WS Server | Pub/Sub | 6379 | Redis AUTH | JSON |
| WS Server → Browser | WSS | 443 | JWT cookie | JSON frames |
| SSE → Browser | HTTPS | 443 | JWT cookie | `text/event-stream` |
| FastAPI → PostgreSQL | TCP | 5432 | Connection string | SQL (asyncpg) |
| OTLP-compatible tools | gRPC/HTTP | 4317/4318 | API key | OTLP standard |

### 1.3 Key Design Decisions

1. **OTLP-native ingestion** — SDK emits standard OpenTelemetry spans with GenAI semantic conventions. This allows interop with Jaeger, Grafana Tempo, and Datadog without code changes.
2. **Dual SDK strategy** — Python SDK (primary, covers LangChain/CrewAI/AutoGen) and Node.js SDK (covers OpenAI/Anthropic/Vercel AI). REST API for all other languages.
3. **Event sourcing with CQRS** — Writes go through Redis Streams to TimescaleDB. Reads served from materialized views and Redis cache.
4. **Push-first with backpressure** — SDKs push events; gateway returns 429/RESOURCE_EXHAUSTED when overloaded; SDK buffers locally.

---

## 2. Python SDK

### 2.1 Package Structure

```
openagentvisualizer/
├── __init__.py              # Public API: init(), register_agent(), session()
├── client.py                # OAVClient — transport selection, batching, lifecycle
├── context.py               # ContextVar-based trace/span/session propagation
├── schema.py                # Pydantic models: OAVEvent, AgentMetadata, SpanData
├── pricing.py               # Model pricing lookup (updated weekly via PyPI patch)
├── auto_instrument.py       # sys.modules scan + monkey-patching orchestrator
├── decorators.py            # @oav.trace, @oav.agent, @oav.tool decorators
├── transport/
│   ├── __init__.py
│   ├── base.py              # TransportBase ABC
│   ├── grpc.py              # OTLP gRPC transport (protobuf serialization)
│   ├── http.py              # OTLP HTTP transport (JSON/protobuf)
│   └── buffer.py            # Pre-allocated ring buffer (fixed capacity)
├── adapters/
│   ├── __init__.py          # Adapter registry + auto-detect logic
│   ├── base.py              # OAVAdapter ABC
│   ├── langchain.py         # OAVCallbackHandler (LangChain/LangGraph)
│   ├── crewai.py            # OAVCrewMonitor
│   ├── autogen.py           # OAVAutoGenMiddleware
│   ├── openai_sdk.py        # OAVOpenAIWrapper
│   ├── anthropic_sdk.py     # OAVAnthropicWrapper
│   ├── ollama.py            # OAVOllamaWrapper
│   ├── huggingface.py       # OAVHuggingFaceCallback
│   └── generic.py           # OAVGenericAdapter (webhook/REST)
├── _internal/
│   ├── clock.py             # time.monotonic_ns() wrapper
│   ├── dedup.py             # SHA-256 event_id computation
│   ├── sampling.py          # Head/tail sampling logic
│   └── pii.py               # Regex-based PII redaction
└── py.typed                 # PEP 561 marker
```

**Dependencies (core only):** `protobuf>=4.0.0` — zero other required deps.
**Optional:** `grpcio>=1.60.0` (for gRPC transport), `opentelemetry-proto>=1.24.0` (for OTLP compat).

### 2.2 OAVClient Core

```python
from __future__ import annotations
import atexit
import threading
from typing import Optional, Dict, Any, Callable
from contextvars import ContextVar

from openagentvisualizer.schema import OAVEvent, AgentMetadata, OAVConfig
from openagentvisualizer.transport.buffer import RingBuffer

_current_client: ContextVar[Optional['OAVClient']] = ContextVar('oav_client', default=None)

class OAVClient:
    """Core SDK client. Thread-safe, async-compatible."""

    def __init__(self, config: OAVConfig):
        self._config = config
        self._buffer = RingBuffer(capacity=config.buffer_capacity)
        self._transport = self._create_transport(config.transport)
        self._flush_thread = threading.Thread(target=self._flush_loop, daemon=True)
        self._shutdown = threading.Event()
        self._agents: Dict[str, AgentMetadata] = {}
        self._flush_thread.start()
        atexit.register(self.shutdown)

    def emit(self, event: OAVEvent) -> None:
        """Non-blocking event emission. Writes to ring buffer in <1us."""
        event = self._normalize(event)
        if self._config.pii_redaction:
            event = self._redact_pii(event)
        self._buffer.push(event)

    def register_agent(self, metadata: AgentMetadata) -> None:
        self._agents[metadata.agent_id] = metadata
        self.emit(OAVEvent(event_type="agent.registered", agent_id=metadata.agent_id,
                           data=metadata.model_dump()))

    def shutdown(self, timeout: float = 5.0) -> None:
        """Flush remaining events and close transport."""
        self._shutdown.set()
        self._flush_thread.join(timeout=timeout)
        self._transport.close()

    def _flush_loop(self) -> None:
        while not self._shutdown.is_set():
            self._shutdown.wait(timeout=self._config.batch_interval_ms / 1000)
            batch = self._buffer.drain(max_items=self._config.batch_size)
            if batch:
                try:
                    self._transport.send_batch(batch)
                except Exception as e:
                    self._config.on_error(e)
                    self._buffer.push_many(batch)  # Re-queue on failure

    def _create_transport(self, transport_type: str):
        if transport_type == "grpc":
            from openagentvisualizer.transport.grpc import GRPCTransport
            return GRPCTransport(self._config)
        from openagentvisualizer.transport.http import HTTPTransport
        return HTTPTransport(self._config)

    def _normalize(self, event: OAVEvent) -> OAVEvent:
        from openagentvisualizer._internal.clock import monotonic_ns
        if not event.timestamp_ns:
            event.timestamp_ns = monotonic_ns()
        if not event.event_id:
            from openagentvisualizer._internal.dedup import compute_event_id
            event.event_id = compute_event_id(event)
        if event.tokens_used and not event.cost_usd:
            from openagentvisualizer.pricing import compute_cost
            event.cost_usd = compute_cost(event.model, event.tokens_used)
        return event

    def _redact_pii(self, event: OAVEvent) -> OAVEvent:
        from openagentvisualizer._internal.pii import redact
        return redact(event)
```

### 2.3 Decorators

```python
import openagentvisualizer as oav
from functools import wraps

def trace(name: str = None, tags: dict = None):
    """Decorator to trace any function as an OAV span."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            span_name = name or func.__qualname__
            with oav.span(span_name, tags=tags) as span:
                try:
                    result = await func(*args, **kwargs)
                    span.set_status("ok")
                    return result
                except Exception as e:
                    span.set_status("error", str(e))
                    raise
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            span_name = name or func.__qualname__
            with oav.span(span_name, tags=tags) as span:
                try:
                    result = func(*args, **kwargs)
                    span.set_status("ok")
                    return result
                except Exception as e:
                    span.set_status("error", str(e))
                    raise
        import asyncio
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator


def agent(agent_id: str, name: str = None, role: str = "worker", model: str = "unknown"):
    """Class decorator to register a class as an OAV agent."""
    def decorator(cls):
        original_init = cls.__init__
        @wraps(original_init)
        def new_init(self, *args, **kwargs):
            original_init(self, *args, **kwargs)
            oav.register_agent(AgentMetadata(
                agent_id=agent_id, name=name or cls.__name__,
                role=role, framework="custom", model=model
            ))
            self._oav_agent_id = agent_id
        cls.__init__ = new_init
        return cls
    return decorator
```

### 2.4 Auto-Instrumentation

```python
import sys
import importlib
import logging

logger = logging.getLogger("openagentvisualizer")

FRAMEWORK_REGISTRY = [
    ("langchain",     "openagentvisualizer.adapters.langchain",     "LangChainAdapter"),
    ("crewai",        "openagentvisualizer.adapters.crewai",        "CrewAIAdapter"),
    ("autogen",       "openagentvisualizer.adapters.autogen",       "AutoGenAdapter"),
    ("openai",        "openagentvisualizer.adapters.openai_sdk",    "OpenAIAdapter"),
    ("anthropic",     "openagentvisualizer.adapters.anthropic_sdk", "AnthropicAdapter"),
    ("ollama",        "openagentvisualizer.adapters.ollama",        "OllamaAdapter"),
    ("huggingface_hub","openagentvisualizer.adapters.huggingface", "HuggingFaceAdapter"),
]

def auto_instrument(client: 'OAVClient') -> list[str]:
    """Scan sys.modules and attach adapters for detected frameworks."""
    instrumented = []
    for module_name, adapter_module, adapter_class_name in FRAMEWORK_REGISTRY:
        if module_name in sys.modules:
            try:
                mod = importlib.import_module(adapter_module)
                adapter_cls = getattr(mod, adapter_class_name)
                adapter = adapter_cls(client)
                adapter.instrument(sys.modules[module_name])
                instrumented.append(module_name)
                logger.info(f"Auto-instrumented {module_name}")
            except Exception as e:
                logger.warning(f"Failed to instrument {module_name}: {e}")
    return instrumented
```

### 2.5 Context Propagation (Async-Safe)

```python
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Optional
import uuid

@dataclass
class OAVContext:
    trace_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    span_id: Optional[str] = None
    session_id: Optional[str] = None
    parent_span_id: Optional[str] = None

_ctx: ContextVar[OAVContext] = ContextVar('oav_context', default=OAVContext())

class SpanContext:
    """Context manager that propagates trace context through sync and async code."""
    def __init__(self, name: str, tags: dict = None):
        self.name = name
        self.tags = tags or {}
        self._token = None

    def __enter__(self):
        parent = _ctx.get()
        new_ctx = OAVContext(
            trace_id=parent.trace_id,
            span_id=uuid.uuid4().hex,
            parent_span_id=parent.span_id,
            session_id=parent.session_id,
        )
        self._token = _ctx.set(new_ctx)
        return self

    def __exit__(self, *exc):
        _ctx.reset(self._token)

    async def __aenter__(self):
        return self.__enter__()

    async def __aexit__(self, *exc):
        self.__exit__(*exc)
```

### 2.6 Offline / Buffered Mode

When the backend is unreachable, the SDK persists events to a local SQLite file and replays on reconnect:

```python
class OfflineBuffer:
    """Spills events to disk when network is unavailable."""

    def __init__(self, path: str = ".oav_offline.db", max_size_mb: int = 100):
        import sqlite3
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, data BLOB, ts REAL)"
        )
        self._max_bytes = max_size_mb * 1024 * 1024

    def store(self, events: list[bytes]) -> None:
        self._conn.executemany(
            "INSERT INTO events (data, ts) VALUES (?, ?)",
            [(e, time.time()) for e in events]
        )
        self._conn.commit()

    def drain(self, batch_size: int = 500) -> list[bytes]:
        rows = self._conn.execute(
            "SELECT id, data FROM events ORDER BY ts LIMIT ?", (batch_size,)
        ).fetchall()
        if rows:
            ids = [r[0] for r in rows]
            self._conn.execute(f"DELETE FROM events WHERE id IN ({','.join('?'*len(ids))})", ids)
            self._conn.commit()
        return [r[1] for r in rows]
```

### 2.7 PyPI Publishing

```toml
# pyproject.toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "openagentvisualizer"
version = "0.1.0"
description = "SDK for OpenAgentVisualizer — gamified AI agent observability"
requires-python = ">=3.9"
license = "Apache-2.0"
dependencies = ["protobuf>=4.0.0"]

[project.optional-dependencies]
grpc = ["grpcio>=1.60.0"]
otlp = ["opentelemetry-proto>=1.24.0"]
all = ["grpcio>=1.60.0", "opentelemetry-proto>=1.24.0"]

[project.urls]
Homepage = "https://openagentvisualizer.io"
Repository = "https://github.com/ashishkots/OpenAgentVisualizer"
```

---

## 3. Node.js SDK

### 3.1 Package Structure

```
@openagentvisualizer/sdk/
├── src/
│   ├── index.ts             # Public API exports
│   ├── client.ts            # OAVClient class
│   ├── context.ts           # AsyncLocalStorage-based context propagation
│   ├── schema.ts            # TypeScript interfaces and Zod validators
│   ├── pricing.ts           # Model pricing lookup
│   ├── transport/
│   │   ├── base.ts          # Transport interface
│   │   ├── http.ts          # OTLP HTTP transport (default for Node)
│   │   ├── grpc.ts          # OTLP gRPC transport (optional)
│   │   └── buffer.ts        # Ring buffer implementation
│   ├── adapters/
│   │   ├── openai.ts        # OpenAI SDK wrapper
│   │   ├── anthropic.ts     # Anthropic SDK wrapper
│   │   ├── vercel-ai.ts     # Vercel AI SDK adapter
│   │   ├── langchain-js.ts  # LangChain.js callback handler
│   │   └── generic.ts       # Generic HTTP adapter
│   └── internal/
│       ├── dedup.ts          # Event ID computation
│       ├── pii.ts            # PII regex redaction
│       └── sampling.ts       # Sampling logic
├── package.json
├── tsconfig.json
└── tsup.config.ts           # Bundle config (ESM + CJS dual output)
```

### 3.2 TypeScript Types

```typescript
// schema.ts
export interface OAVConfig {
  apiKey: string;
  endpoint?: string;                    // default: "https://ingest.openagentvisualizer.io"
  transport?: "http" | "grpc";          // default: "http"
  mode?: "batch" | "streaming" | "hybrid"; // default: "hybrid"
  batchSize?: number;                   // default: 100
  batchIntervalMs?: number;             // default: 500
  bufferCapacity?: number;              // default: 10000
  sampleRate?: number;                  // default: 1.0
  autoInstrument?: boolean;             // default: true
  piiRedaction?: boolean;               // default: true
  debug?: boolean;
  tags?: Record<string, string>;
  onError?: (error: Error) => void;
}

export interface OAVEvent {
  eventId?: string;
  eventType: string;
  agentId: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  sessionId?: string;
  timestampNs?: bigint;
  model?: string;
  tokensUsed?: { prompt: number; completion: number; total: number };
  costUsd?: number;
  data?: Record<string, unknown>;
  tags?: Record<string, string>;
}

export interface AgentMetadata {
  agentId: string;
  name: string;
  role: string;
  framework: string;
  model: string;
  capabilities?: string[];
}

export type EventType =
  | "agent.registered" | "agent.lifecycle"
  | "agent.task.started" | "agent.task.completed" | "agent.task.failed"
  | "agent.llm.request" | "agent.llm.response"
  | "agent.tool.called" | "agent.tool.result"
  | "agent.handoff" | "agent.error" | "agent.cost";
```

### 3.3 Client Implementation

```typescript
// client.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { OAVConfig, OAVEvent, AgentMetadata } from "./schema";
import { RingBuffer } from "./transport/buffer";
import { HTTPTransport } from "./transport/http";

const contextStorage = new AsyncLocalStorage<OAVContext>();

export class OAVClient {
  private buffer: RingBuffer<OAVEvent>;
  private transport: HTTPTransport;
  private flushTimer: NodeJS.Timeout;
  private agents = new Map<string, AgentMetadata>();

  constructor(private config: OAVConfig) {
    this.buffer = new RingBuffer(config.bufferCapacity ?? 10000);
    this.transport = new HTTPTransport(config);
    this.flushTimer = setInterval(() => this.flush(), config.batchIntervalMs ?? 500);
    process.on("beforeExit", () => this.shutdown());
  }

  emit(event: OAVEvent): void {
    const ctx = contextStorage.getStore();
    if (ctx) {
      event.traceId ??= ctx.traceId;
      event.spanId ??= ctx.spanId;
      event.sessionId ??= ctx.sessionId;
    }
    this.buffer.push(event);
  }

  registerAgent(metadata: AgentMetadata): void {
    this.agents.set(metadata.agentId, metadata);
    this.emit({ eventType: "agent.registered", agentId: metadata.agentId, data: metadata as any });
  }

  /** Wrap an OpenAI client instance for automatic tracing */
  wrapOpenAI<T>(client: T): T {
    const { OpenAIAdapter } = require("./adapters/openai");
    return new OpenAIAdapter(this).instrument(client);
  }

  /** Wrap Vercel AI SDK's generateText / streamText */
  wrapVercelAI<T extends Function>(fn: T): T {
    const { VercelAIAdapter } = require("./adapters/vercel-ai");
    return new VercelAIAdapter(this).wrapFunction(fn);
  }

  /** Wrap Anthropic client instance */
  wrapAnthropic<T>(client: T): T {
    const { AnthropicAdapter } = require("./adapters/anthropic");
    return new AnthropicAdapter(this).instrument(client);
  }

  async flush(): Promise<void> {
    const batch = this.buffer.drain(this.config.batchSize ?? 100);
    if (batch.length > 0) {
      try {
        await this.transport.sendBatch(batch);
      } catch (err) {
        this.config.onError?.(err as Error);
        this.buffer.pushMany(batch); // Re-queue
      }
    }
  }

  async shutdown(): Promise<void> {
    clearInterval(this.flushTimer);
    await this.flush();
    this.transport.close();
  }
}
```

### 3.4 Vercel AI SDK Adapter

```typescript
// adapters/vercel-ai.ts
import { OAVClient } from "../client";
import { OAVEvent } from "../schema";

export class VercelAIAdapter {
  constructor(private client: OAVClient) {}

  wrapFunction<T extends Function>(fn: T): T {
    const client = this.client;
    const wrapped = async function (this: any, options: any) {
      const startTime = process.hrtime.bigint();
      const agentId = options?.oavAgentId ?? "vercel-ai-default";

      client.emit({
        eventType: "agent.llm.request",
        agentId,
        data: { model: options?.model?.modelId, prompt: options?.prompt?.substring(0, 200) },
      });

      try {
        const result = await fn.call(this, options);
        const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;

        client.emit({
          eventType: "agent.llm.response",
          agentId,
          model: options?.model?.modelId,
          tokensUsed: {
            prompt: result.usage?.promptTokens ?? 0,
            completion: result.usage?.completionTokens ?? 0,
            total: result.usage?.totalTokens ?? 0,
          },
          data: { durationMs, finishReason: result.finishReason },
        });
        return result;
      } catch (error: any) {
        client.emit({ eventType: "agent.error", agentId, data: { error: error.message } });
        throw error;
      }
    };
    return wrapped as unknown as T;
  }
}
```

### 3.5 npm Publishing

```json
{
  "name": "@openagentvisualizer/sdk",
  "version": "0.1.0",
  "description": "Node.js SDK for OpenAgentVisualizer",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs", "types": "./dist/index.d.ts" }
  },
  "engines": { "node": ">=18.0.0" },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "peerDependencies": {
    "openai": ">=4.0.0",
    "anthropic": ">=0.30.0",
    "ai": ">=3.0.0"
  },
  "peerDependenciesMeta": {
    "openai": { "optional": true },
    "anthropic": { "optional": true },
    "ai": { "optional": true }
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 4. Framework Adapters

### 4.1 LangChain / LangGraph Adapter

```python
from langchain_core.callbacks import BaseCallbackHandler
from openagentvisualizer.adapters.base import OAVAdapter
from openagentvisualizer.schema import OAVEvent, AgentMetadata

class LangChainAdapter(OAVAdapter):
    """Instruments LangChain via the callback system."""

    def get_framework_name(self) -> str:
        return "langchain"

    def get_supported_versions(self) -> str:
        return ">=0.3.0,<1.0.0"

    def instrument(self, module) -> None:
        """Patch LangChain's default callback manager to include OAV handler."""
        from langchain_core.callbacks.manager import CallbackManager
        original_configure = CallbackManager.configure
        handler = OAVCallbackHandler(self._client)

        @classmethod
        def patched_configure(cls, *args, **kwargs):
            manager = original_configure(*args, **kwargs)
            if handler not in manager.handlers:
                manager.add_handler(handler)
            return manager
        CallbackManager.configure = patched_configure

    def extract_agent_metadata(self, obj) -> AgentMetadata:
        return AgentMetadata(
            agent_id=f"lc-{getattr(obj, 'name', 'chain')}-{id(obj)}",
            name=getattr(obj, 'name', obj.__class__.__name__),
            role="chain", framework="langchain",
            model=getattr(obj, 'model_name', 'unknown')
        )


class OAVCallbackHandler(BaseCallbackHandler):
    """LangChain callback handler that emits OAV events."""

    def __init__(self, client):
        self._client = client

    def on_llm_start(self, serialized, prompts, *, run_id, **kwargs):
        self._client.emit(OAVEvent(
            event_type="agent.llm.request",
            agent_id=self._resolve_agent_id(kwargs),
            data={"model": serialized.get("id", ["unknown"])[-1],
                   "prompt_length": sum(len(p) for p in prompts)},
        ))

    def on_llm_end(self, response, *, run_id, **kwargs):
        gen = response.generations[0][0] if response.generations else None
        usage = response.llm_output.get("token_usage", {}) if response.llm_output else {}
        self._client.emit(OAVEvent(
            event_type="agent.llm.response",
            agent_id=self._resolve_agent_id(kwargs),
            tokens_used=usage,
            data={"finish_reason": gen.generation_info.get("finish_reason") if gen else None},
        ))

    def on_tool_start(self, serialized, input_str, *, run_id, **kwargs):
        self._client.emit(OAVEvent(
            event_type="agent.tool.called",
            agent_id=self._resolve_agent_id(kwargs),
            data={"tool": serialized.get("name", "unknown"), "input_preview": input_str[:200]},
        ))

    def on_tool_end(self, output, *, run_id, **kwargs):
        self._client.emit(OAVEvent(
            event_type="agent.tool.result",
            agent_id=self._resolve_agent_id(kwargs),
            data={"output_preview": str(output)[:200]},
        ))

    def on_chain_error(self, error, *, run_id, **kwargs):
        self._client.emit(OAVEvent(
            event_type="agent.error",
            agent_id=self._resolve_agent_id(kwargs),
            data={"error_type": type(error).__name__, "message": str(error)[:500]},
        ))

    def _resolve_agent_id(self, kwargs) -> str:
        tags = kwargs.get("tags", [])
        for tag in tags:
            if tag.startswith("oav:"):
                return tag.split(":", 1)[1]
        return "langchain-default"
```

### 4.2 CrewAI Adapter

```python
class CrewAIAdapter(OAVAdapter):
    def get_framework_name(self) -> str:
        return "crewai"

    def get_supported_versions(self) -> str:
        return ">=0.80.0,<1.0.0"

    def instrument(self, module) -> None:
        from crewai import Agent, Task, Crew
        self._patch_crew_kickoff(Crew)

    def _patch_crew_kickoff(self, Crew):
        original_kickoff = Crew.kickoff
        client = self._client

        def patched_kickoff(crew_self, *args, **kwargs):
            # Register all agents in crew
            for agent in crew_self.agents:
                metadata = AgentMetadata(
                    agent_id=f"crewai-{agent.role}-{id(agent)}",
                    name=agent.role, role=agent.role,
                    framework="crewai", model=getattr(agent, 'llm', 'unknown')
                )
                client.register_agent(metadata)

            client.emit(OAVEvent(
                event_type="agent.task.started",
                agent_id=f"crewai-crew-{id(crew_self)}",
                data={"task_count": len(crew_self.tasks), "agent_count": len(crew_self.agents)},
            ))
            try:
                result = original_kickoff(crew_self, *args, **kwargs)
                client.emit(OAVEvent(
                    event_type="agent.task.completed",
                    agent_id=f"crewai-crew-{id(crew_self)}",
                    data={"result_preview": str(result)[:200]},
                ))
                return result
            except Exception as e:
                client.emit(OAVEvent(
                    event_type="agent.error",
                    agent_id=f"crewai-crew-{id(crew_self)}",
                    data={"error": str(e)[:500]},
                ))
                raise
        Crew.kickoff = patched_kickoff

    def extract_agent_metadata(self, obj) -> AgentMetadata:
        return AgentMetadata(
            agent_id=f"crewai-{obj.role}-{id(obj)}",
            name=obj.role, role=obj.role,
            framework="crewai", model=getattr(obj, 'llm', 'unknown')
        )
```

### 4.3 AutoGen Adapter

```python
class AutoGenAdapter(OAVAdapter):
    def get_framework_name(self) -> str:
        return "autogen"

    def get_supported_versions(self) -> str:
        return ">=0.4.0,<1.0.0"

    def instrument(self, module) -> None:
        """Patch AutoGen's ConversableAgent.generate_reply."""
        from autogen import ConversableAgent
        original_generate = ConversableAgent.generate_reply
        client = self._client

        def patched_generate(agent_self, messages=None, sender=None, **kwargs):
            agent_id = f"autogen-{agent_self.name}-{id(agent_self)}"
            client.emit(OAVEvent(
                event_type="agent.llm.request", agent_id=agent_id,
                data={"message_count": len(messages) if messages else 0,
                       "sender": getattr(sender, 'name', 'unknown')},
            ))
            result = original_generate(agent_self, messages, sender, **kwargs)
            client.emit(OAVEvent(
                event_type="agent.llm.response", agent_id=agent_id,
                data={"response_preview": str(result)[:200]},
            ))
            return result
        ConversableAgent.generate_reply = patched_generate
```

### 4.4 OpenAI Assistants Adapter (Python)

```python
class OpenAIAdapter(OAVAdapter):
    def get_framework_name(self) -> str:
        return "openai"

    def get_supported_versions(self) -> str:
        return ">=1.0.0,<2.0.0"

    def instrument(self, module) -> None:
        """Wrap openai.OpenAI().chat.completions.create."""
        import openai
        original_create = openai.resources.chat.completions.Completions.create
        client = self._client

        def patched_create(self_api, *args, **kwargs):
            model = kwargs.get("model", "unknown")
            agent_id = kwargs.pop("oav_agent_id", f"openai-{model}")
            client.emit(OAVEvent(
                event_type="agent.llm.request", agent_id=agent_id,
                data={"model": model, "message_count": len(kwargs.get("messages", []))},
            ))
            result = original_create(self_api, *args, **kwargs)
            usage = result.usage
            client.emit(OAVEvent(
                event_type="agent.llm.response", agent_id=agent_id, model=model,
                tokens_used={"prompt": usage.prompt_tokens, "completion": usage.completion_tokens,
                              "total": usage.total_tokens} if usage else None,
                data={"finish_reason": result.choices[0].finish_reason if result.choices else None},
            ))
            return result
        openai.resources.chat.completions.Completions.create = patched_create
```

### 4.5 Anthropic Adapter (Python)

```python
class AnthropicAdapter(OAVAdapter):
    def get_framework_name(self) -> str:
        return "anthropic"

    def get_supported_versions(self) -> str:
        return ">=0.30.0,<1.0.0"

    def instrument(self, module) -> None:
        import anthropic
        original_create = anthropic.resources.messages.Messages.create
        client = self._client

        def patched_create(self_api, *args, **kwargs):
            model = kwargs.get("model", "unknown")
            agent_id = kwargs.pop("oav_agent_id", f"anthropic-{model}")
            client.emit(OAVEvent(
                event_type="agent.llm.request", agent_id=agent_id,
                data={"model": model},
            ))
            result = original_create(self_api, *args, **kwargs)
            client.emit(OAVEvent(
                event_type="agent.llm.response", agent_id=agent_id, model=model,
                tokens_used={"prompt": result.usage.input_tokens,
                              "completion": result.usage.output_tokens,
                              "total": result.usage.input_tokens + result.usage.output_tokens},
                data={"stop_reason": result.stop_reason},
            ))
            return result
        anthropic.resources.messages.Messages.create = patched_create
```

### 4.6 Generic HTTP Adapter

For any framework not natively supported:

```python
class GenericAdapter(OAVAdapter):
    """Webhook-based adapter. Agents POST events to a local collector."""

    def get_framework_name(self) -> str:
        return "generic"

    def get_supported_versions(self) -> str:
        return "*"

    def instrument(self, target) -> None:
        pass  # No auto-instrumentation for generic adapter

    def extract_agent_metadata(self, obj) -> AgentMetadata:
        return AgentMetadata(agent_id="generic", name="Generic Agent",
                             role="unknown", framework="generic", model="unknown")

    def create_webhook_handler(self, port: int = 9999):
        """Start a local HTTP server that accepts events and forwards to OAV."""
        from http.server import HTTPServer, BaseHTTPRequestHandler
        import json
        client = self._client

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length))
                client.emit(OAVEvent(**body))
                self.send_response(200)
                self.end_headers()
            def log_message(self, *args): pass

        server = HTTPServer(("127.0.0.1", port), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        return server
```

### 4.7 Framework Version Compatibility

| Framework | Min Version | Max Tested | Auto-Instrument | Language |
|-----------|------------|-----------|----------------|----------|
| LangChain / LangGraph | 0.3.0 | 0.5.x | Yes | Python |
| CrewAI | 0.80.0 | 0.110.x | Yes | Python |
| AutoGen (AG2) | 0.4.0 | 0.6.x | Yes | Python |
| OpenAI Python SDK | 1.0.0 | 1.60.x | Yes | Python |
| Anthropic Python SDK | 0.30.0 | 0.50.x | Yes | Python |
| Ollama Python | 0.3.0 | 0.5.x | Yes | Python |
| HuggingFace Transformers | 4.35.0 | 4.48.x | Yes | Python |
| OpenAI Node SDK | 4.0.0 | 4.80.x | Yes | Node.js |
| Anthropic Node SDK | 0.30.0 | 0.50.x | Yes | Node.js |
| Vercel AI SDK | 3.0.0 | 4.x | Yes | Node.js |
| LangChain.js | 0.3.0 | 0.5.x | Yes | Node.js |
| Custom (any language) | -- | -- | No (REST/webhook) | Any |

---

## 5. OTLP Bridge

### 5.1 GenAI Semantic Convention Mapping

OpenAgentVisualizer maps its internal event schema to the [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) for interoperability.

**OAV Event → OTLP Span Attribute Mapping:**

| OAV Event Field | OTLP Span Attribute | Type |
|-----------------|---------------------|------|
| `event_type` | `oav.event_type` | string |
| `agent_id` | `oav.agent.id` | string |
| `model` | `gen_ai.request.model` | string |
| `tokens_used.prompt` | `gen_ai.usage.prompt_tokens` | int |
| `tokens_used.completion` | `gen_ai.usage.completion_tokens` | int |
| `cost_usd` | `oav.cost.usd` | double |
| `session_id` | `oav.session.id` | string |
| `data.tool` | `gen_ai.tool.name` | string |
| `data.error_type` | `otel.status_code` = ERROR | string |
| `data.finish_reason` | `gen_ai.response.finish_reasons` | string[] |

**OAV Event Types → OTLP Span Names:**

| OAV `event_type` | OTLP `span.name` | `span.kind` |
|-------------------|-------------------|-------------|
| `agent.llm.request` / `response` | `gen_ai.chat {model}` | CLIENT |
| `agent.tool.called` / `result` | `gen_ai.tool {tool_name}` | INTERNAL |
| `agent.task.started` / `completed` | `oav.task {task_name}` | INTERNAL |
| `agent.lifecycle` | `oav.lifecycle {state}` | INTERNAL |
| `agent.handoff` | `oav.handoff {from} -> {to}` | PRODUCER |
| `agent.error` | `oav.error {error_type}` | INTERNAL |

### 5.2 gRPC Receiver

```python
# otlp_receiver.py — gRPC OTLP ingestion endpoint
from opentelemetry.proto.collector.trace.v1 import (
    trace_service_pb2_grpc, trace_service_pb2
)
from opentelemetry.proto.trace.v1 import trace_pb2
import grpc
from concurrent import futures

class OTLPTraceReceiver(trace_service_pb2_grpc.TraceServiceServicer):
    """Receives OTLP traces and converts to OAV events."""

    def __init__(self, event_bus, auth_service):
        self._event_bus = event_bus
        self._auth = auth_service

    async def Export(self, request: trace_service_pb2.ExportTraceServiceRequest,
                     context: grpc.aio.ServicerContext):
        # Authenticate
        metadata = dict(context.invocation_metadata())
        api_key = metadata.get("authorization", "").replace("Bearer ", "")
        tenant = await self._auth.validate_key(api_key)
        if not tenant:
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API key")

        events = []
        for resource_span in request.resource_spans:
            resource_attrs = {a.key: self._extract_value(a.value)
                              for a in resource_span.resource.attributes}
            for scope_span in resource_span.scope_spans:
                for span in scope_span.spans:
                    event = self._span_to_oav_event(span, resource_attrs)
                    events.append(event)

        # Publish to Redis Streams
        await self._event_bus.publish_batch(tenant.id, events)

        return trace_service_pb2.ExportTraceServiceResponse(
            partial_success=trace_service_pb2.ExportTracePartialSuccess(
                rejected_spans=0
            )
        )

    def _span_to_oav_event(self, span: trace_pb2.Span, resource_attrs: dict) -> dict:
        attrs = {a.key: self._extract_value(a.value) for a in span.attributes}
        return {
            "event_type": attrs.get("oav.event_type", self._infer_event_type(span, attrs)),
            "agent_id": attrs.get("oav.agent.id", resource_attrs.get("service.name", "unknown")),
            "trace_id": span.trace_id.hex(),
            "span_id": span.span_id.hex(),
            "parent_span_id": span.parent_span_id.hex() if span.parent_span_id else None,
            "timestamp_ns": span.start_time_unix_nano,
            "duration_ns": span.end_time_unix_nano - span.start_time_unix_nano,
            "model": attrs.get("gen_ai.request.model"),
            "tokens_used": {
                "prompt": attrs.get("gen_ai.usage.prompt_tokens", 0),
                "completion": attrs.get("gen_ai.usage.completion_tokens", 0),
                "total": attrs.get("gen_ai.usage.prompt_tokens", 0)
                       + attrs.get("gen_ai.usage.completion_tokens", 0),
            },
            "cost_usd": attrs.get("oav.cost.usd"),
            "data": {k: v for k, v in attrs.items()
                     if not k.startswith(("gen_ai.", "oav.", "otel."))},
        }

    def _infer_event_type(self, span, attrs) -> str:
        if "gen_ai.request.model" in attrs:
            return "agent.llm.response"
        if "gen_ai.tool.name" in attrs:
            return "agent.tool.result"
        return "agent.task.completed"

    def _extract_value(self, value):
        field = value.WhichOneof("value")
        return getattr(value, field) if field else None


def start_grpc_receiver(event_bus, auth_service, port: int = 4317):
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    trace_service_pb2_grpc.add_TraceServiceServicer_to_server(
        OTLPTraceReceiver(event_bus, auth_service), server
    )
    server.add_insecure_port(f"[::]:{port}")
    return server
```

### 5.3 HTTP Receiver

```python
# otlp_http_receiver.py — HTTP OTLP ingestion endpoint (FastAPI)
from fastapi import APIRouter, Request, Depends, HTTPException
from google.protobuf.json_format import Parse
from opentelemetry.proto.collector.trace.v1 import trace_service_pb2

router = APIRouter(prefix="/v1/traces", tags=["otlp"])

@router.post("")
async def receive_traces(request: Request, tenant=Depends(get_authenticated_tenant)):
    content_type = request.headers.get("content-type", "")
    body = await request.body()

    if "protobuf" in content_type:
        export_request = trace_service_pb2.ExportTraceServiceRequest()
        export_request.ParseFromString(body)
    elif "json" in content_type:
        import json
        export_request = Parse(json.dumps(await request.json()),
                               trace_service_pb2.ExportTraceServiceRequest())
    else:
        raise HTTPException(400, "Unsupported content type")

    events = convert_otlp_to_oav_events(export_request)
    await event_bus.publish_batch(tenant.id, events)

    return {"partial_success": {"rejected_spans": 0}}
```

### 5.4 Interoperability with Existing OTLP Tools

Any OTLP-compatible exporter (Jaeger, Grafana Agent, OpenTelemetry Collector) can send traces to OpenAgentVisualizer:

```yaml
# OpenTelemetry Collector config — forward to OAV
exporters:
  otlphttp:
    endpoint: "https://ingest.openagentvisualizer.io"
    headers:
      authorization: "Bearer oav_live_abc123"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp]
```

---

## 6. End-to-End Data Flow

### 6.1 Single Event Trace: SDK to Pixel

This traces a single `agent.llm.response` event from a LangChain agent through the entire system to a PixiJS avatar state change.

```
Step  Component                 Action                                    Latency Budget
─────────────────────────────────────────────────────────────────────────────────────────
 1    LangChain Agent           on_llm_end callback fires                       0ms
 2    OAVCallbackHandler        Creates OAVEvent, calls client.emit()           <1ms
 3    SDK Normalizer            Assigns event_id, computes cost, PII redact     <2ms
 4    Ring Buffer               Push event to pre-allocated slot                <0.1ms
 5    Flush Thread              Batch timer fires (500ms interval)              0-500ms (amortized)
 6    gRPC Transport            Serialize protobuf, send to OTLP GW            5-20ms
 7    NGINX                     TLS terminate, route to /otlp/*                 <1ms
 8    OTLP Ingestion GW        Auth check (Redis cache), schema validate       2-5ms
 9    Redis XADD               Write to events:{tenant_id} stream              <1ms
10    WS Fanout Consumer       Read from stream, PUBLISH to tenant channel     <1ms
11    WebSocket Server          Receive pub/sub, serialize JSON frame           <1ms
12    Network (WS)              WSS frame to browser                            5-50ms
13    WS Client (browser)       Parse JSON, dispatch to event store             <1ms
14    Zustand Store             Update agent state                              <0.5ms
15    XState Actor              State transition: idle → working                <0.5ms
16    PixiJS Renderer           Next frame: avatar animation changes            0-16ms (vsync)
─────────────────────────────────────────────────────────────────────────────────────────
      TOTAL (p50 / p99)        ~25ms / ~600ms (dominated by batch interval + network)
```

**Critical Path Optimization:**
- Steps 2-4: SDK overhead < 3ms — never blocks the agent's LLM call
- Step 5: Configurable. Set `batch_interval_ms=0` for streaming mode (~5ms e2e, higher CPU)
- Steps 8-10: Backend hot path < 5ms via Redis pipelining
- Steps 13-16: Frontend processing < 18ms (within single frame budget at 60fps)

### 6.2 Persist Writer Path (Async, Non-Blocking)

```
Redis Stream → Persist Writer Consumer → Batch INSERT → TimescaleDB
                                          (every 1s or 1000 events)

Latency: 1-5 seconds from event ingestion to queryable in TimescaleDB.
This path does NOT affect real-time visualization latency.
```

### 6.3 Aggregation Engine Path

```
Redis Stream → Aggregation Consumer → Compute metrics → Redis HSET (cache)
                                       (sliding windows: 1m, 5m, 1h)
                                                       → SSE push to browser

Metrics available: active agent count, tokens/sec, cost/min, error rate, P95 latency.
Update frequency: every 5 seconds for dashboard widgets.
```

### 6.4 Alert Engine Path

```
Redis Stream → Alert Consumer → Rule evaluation → Match?
                                                    ├── Yes → Create alert record (PostgreSQL)
                                                    │         → Redis PUBLISH alerts:{tenant}
                                                    │         → Webhook/Slack notification
                                                    └── No  → Continue

Loop detection: Sliding window counts identical (agent_id, event_type) tuples.
If count > threshold within window → fire loop_detection alert.
```

---

## 7. Docker Compose and DevOps

### 7.1 docker-compose.yml (Development)

```yaml
version: "3.9"

services:
  # ─── DATA LAYER ────────────────────────────────────────────
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: oav
      POSTGRES_USER: oav
      POSTGRES_PASSWORD: oav_dev_password
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oav"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7.2-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # ─── BACKEND SERVICES ─────────────────────────────────────
  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav_dev_password@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: dev-secret-key-change-in-production
      CORS_ORIGINS: '["http://localhost:5173"]'
      DEFAULT_USER_EMAIL: kotsai@gmail.com
      DEFAULT_USER_PASSWORD: "kots@123"
      ENVIRONMENT: development
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - ./src/backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  websocket:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav_dev_password@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: dev-secret-key-change-in-production
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uvicorn app.ws_server:app --host 0.0.0.0 --port 8001 --reload

  otlp-gateway:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    environment:
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: dev-secret-key-change-in-production
    ports:
      - "4317:4317"
      - "4318:4318"
    depends_on:
      redis:
        condition: service_healthy
    command: python -m app.otlp_server

  celery-worker:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav_dev_password@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: celery -A app.celery_app worker -l info -c 4

  celery-beat:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://oav:oav_dev_password@postgres:5432/oav
      REDIS_URL: redis://redis:6379/0
    depends_on:
      redis:
        condition: service_healthy
    command: celery -A app.celery_app beat -l info

  # ─── FRONTEND ──────────────────────────────────────────────
  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile
      target: deps
    ports:
      - "5173:5173"
    volumes:
      - ./src/frontend:/app
      - /app/node_modules
    environment:
      VITE_API_URL: http://localhost:8000
      VITE_WS_URL: ws://localhost:8001
    command: npm run dev -- --host 0.0.0.0

  # ─── REVERSE PROXY ────────────────────────────────────────
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./deploy/nginx/dev.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - backend
      - websocket
      - frontend
      - otlp-gateway

volumes:
  pg_data:
  redis_data:
```

### 7.2 Makefile

```makefile
.PHONY: dev stop logs test lint migrate seed clean build push

# ─── Development ─────────────────────────────────────────
dev:                ## Start all services in dev mode
	docker compose up --build -d
	@echo "Frontend: http://localhost:5173"
	@echo "API:      http://localhost:8000/docs"
	@echo "OTLP:     grpc://localhost:4317 | http://localhost:4318"

stop:               ## Stop all services
	docker compose down

logs:               ## Tail all logs
	docker compose logs -f

logs-backend:       ## Tail backend logs only
	docker compose logs -f backend

# ─── Database ────────────────────────────────────────────
migrate:            ## Run Alembic migrations
	docker compose exec backend alembic upgrade head

seed:               ## Seed default user and sample data
	docker compose exec backend python -m app.seed

reset-db:           ## Drop and recreate database
	docker compose exec postgres psql -U oav -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) migrate seed

# ─── Testing ─────────────────────────────────────────────
test:               ## Run backend tests
	docker compose exec backend pytest -x -v

test-sdk:           ## Run Python SDK tests
	cd src/sdk/python && pytest -x -v

test-frontend:      ## Run frontend tests
	docker compose exec frontend npm test

lint:               ## Lint all code
	docker compose exec backend ruff check .
	docker compose exec frontend npm run lint

# ─── Build & Deploy ──────────────────────────────────────
build:              ## Build production images
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

push:               ## Push images to registry
	docker compose -f docker-compose.yml -f docker-compose.prod.yml push

clean:              ## Remove all containers, volumes, images
	docker compose down -v --rmi local
```

### 7.3 Backend Dockerfile

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

FROM base AS dev
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS prod
RUN pip install gunicorn
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### 7.4 Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

FROM deps AS dev
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS build
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 7.5 NGINX Dev Config

```nginx
# deploy/nginx/dev.conf
upstream api {
    server backend:8000;
}
upstream ws {
    server websocket:8001;
}
upstream otlp_http {
    server otlp-gateway:4318;
}

server {
    listen 80;

    # REST API
    location /api/ {
        proxy_pass http://api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # OTLP HTTP receiver
    location /otlp/ {
        proxy_pass http://otlp_http/;
        proxy_set_header Host $host;
        client_max_body_size 10m;
    }

    # Frontend (dev server)
    location / {
        proxy_pass http://frontend:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 7.6 Health Check Endpoints

```python
# app/routers/health.py
from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    checks = {}
    try:
        await db.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as e:
        checks["postgres"] = f"error: {e}"
    try:
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e}"

    all_ok = all(v == "ok" for v in checks.values())
    return {"status": "ready" if all_ok else "degraded", "checks": checks}
```

---

## 8. Developer Experience

### 8.1 Quick Start Guide (Python — 3 Lines)

```python
# 1. Install
# pip install openagentvisualizer

# 2. Initialize (add before your agent code)
import openagentvisualizer as oav
oav.init(api_key="oav_live_YOUR_KEY", auto_instrument=True)

# 3. Run your existing agent — events appear in the dashboard automatically
from langchain.chat_models import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor

llm = ChatOpenAI(model="gpt-4o")
agent = AgentExecutor(agent=create_openai_functions_agent(llm, tools), tools=tools)
result = agent.invoke({"input": "Research AI market trends"})
# → Open http://localhost:5173 to see the agent working in real-time
```

### 8.2 Quick Start Guide (Node.js — 4 Lines)

```typescript
// 1. Install
// npm install @openagentvisualizer/sdk

// 2. Initialize and wrap
import { OAVClient } from "@openagentvisualizer/sdk";
import OpenAI from "openai";

const oav = new OAVClient({ apiKey: "oav_live_YOUR_KEY" });
const openai = oav.wrapOpenAI(new OpenAI());

// 3. Use as normal — all calls are traced automatically
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Analyze this data" }],
});
```

### 8.3 Quick Start Guide (Self-Hosted)

```bash
# Clone and start
git clone https://github.com/ashishkots/OpenAgentVisualizer.git
cd OpenAgentVisualizer
make dev

# Wait for health checks to pass (~30s)
curl http://localhost:8000/health/ready

# Login: kotsai@gmail.com / kots@123
# Open: http://localhost:5173

# Get your API key from Settings → API Keys
# Then use SDK with endpoint: http://localhost:8000
oav.init(api_key="oav_live_YOUR_KEY", endpoint="http://localhost:4318", transport="http")
```

### 8.4 Sample Apps

**Sample 1: LangChain Multi-Agent Research Team**

```python
# examples/langchain_research_team.py
import openagentvisualizer as oav
oav.init(api_key="oav_live_demo", endpoint="http://localhost:4318", transport="http")

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Create 3 agents — each appears as a character in the virtual world
researcher = AgentExecutor(
    agent=create_openai_tools_agent(llm, [search_tool], researcher_prompt),
    tools=[search_tool], tags=["oav:researcher-agent"]
)
analyst = AgentExecutor(
    agent=create_openai_tools_agent(llm, [calc_tool], analyst_prompt),
    tools=[calc_tool], tags=["oav:analyst-agent"]
)
writer = AgentExecutor(
    agent=create_openai_tools_agent(llm, [], writer_prompt),
    tools=[], tags=["oav:writer-agent"]
)

# Run pipeline — watch all 3 agents work simultaneously in the dashboard
research = researcher.invoke({"input": "Find AI market data for 2026"})
analysis = analyst.invoke({"input": f"Analyze this: {research['output']}"})
report = writer.invoke({"input": f"Write report from: {analysis['output']}"})
```

**Sample 2: CrewAI Team**

```python
# examples/crewai_team.py
import openagentvisualizer as oav
oav.init(api_key="oav_live_demo", endpoint="http://localhost:4318", transport="http")

from crewai import Agent, Task, Crew

researcher = Agent(role="Researcher", goal="Find data", llm="gpt-4o")
writer = Agent(role="Writer", goal="Write reports", llm="gpt-4o")

task1 = Task(description="Research AI trends", agent=researcher, expected_output="Summary")
task2 = Task(description="Write report", agent=writer, expected_output="Report")

crew = Crew(agents=[researcher, writer], tasks=[task1, task2], verbose=True)
result = crew.kickoff()
```

### 8.5 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No events in dashboard | SDK not initialized | Verify `oav.init()` runs before agent code |
| `ConnectionRefusedError` | OTLP gateway not running | Run `make dev` and check `docker compose ps` |
| Events appear delayed (>5s) | Batch interval too high | Set `batch_interval_ms=100` or use `mode="streaming"` |
| `HTTP 429` from gateway | Rate limit exceeded | Reduce event volume or increase `sample_rate` |
| `UNAUTHENTICATED` gRPC error | Invalid API key | Regenerate key in Settings → API Keys |
| High memory usage in SDK | Buffer overflow | Increase `buffer_capacity` or reduce batch interval |
| Missing cost data | Model not in pricing table | File issue or add custom pricing via `oav.set_model_price()` |
| PII appearing in events | Redaction disabled | Set `pii_redaction=True` in `oav.init()` |
| Duplicate events | SDK reconnection replay | Dedup is automatic server-side; safe to ignore |
| Agent not showing avatar | Not registered | Call `oav.register_agent()` with metadata |

### 8.6 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OAV_API_KEY` | Yes | -- | API key for authentication |
| `OAV_ENDPOINT` | No | `https://ingest.openagentvisualizer.io` | Ingestion endpoint URL |
| `OAV_TRANSPORT` | No | `grpc` | Transport protocol (`grpc` or `http`) |
| `OAV_BATCH_SIZE` | No | `100` | Events per batch |
| `OAV_BATCH_INTERVAL_MS` | No | `500` | Batch flush interval |
| `OAV_SAMPLE_RATE` | No | `1.0` | Sampling rate (0.0-1.0) |
| `OAV_PII_REDACTION` | No | `true` | Enable PII redaction |
| `OAV_DEBUG` | No | `false` | Enable debug logging |
| `OAV_OFFLINE_BUFFER_PATH` | No | `.oav_offline.db` | Path for offline buffer |

The SDK reads these automatically if `oav.init()` is called without explicit parameters.

---

## 9. CI/CD Pipeline

### 9.1 GitHub Actions — Backend CI

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest-pg16
        env:
          POSTGRES_DB: oav_test
          POSTGRES_USER: oav
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U oav" --health-interval 5s --health-retries 5
      redis:
        image: redis:7.2-alpine
        ports: ["6379:6379"]
        options: --health-cmd "redis-cli ping" --health-interval 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
      - run: pip install -r src/backend/requirements.txt
      - run: pip install pytest pytest-asyncio pytest-cov ruff
      - name: Lint
        run: ruff check src/backend/
      - name: Test
        run: pytest src/backend/tests/ -x -v --cov=src/backend/app --cov-report=xml
        env:
          DATABASE_URL: postgresql+asyncpg://oav:test@localhost:5432/oav_test
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret
      - uses: codecov/codecov-action@v4
        with:
          file: coverage.xml
```

### 9.2 GitHub Actions — Frontend CI

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: src/frontend/package-lock.json
      - run: cd src/frontend && npm install
      - run: cd src/frontend && npm run lint
      - run: cd src/frontend && npm run type-check
      - run: cd src/frontend && npm test -- --run
      - run: cd src/frontend && npm run build
```

### 9.3 GitHub Actions — Python SDK Publish

```yaml
# .github/workflows/sdk-python-publish.yml
name: Publish Python SDK
on: workflow_dispatch

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install hatch
      - run: cd src/sdk/python && hatch build
      - name: Test package
        run: |
          cd src/sdk/python
          pip install dist/*.whl
          python -c "import openagentvisualizer; print(openagentvisualizer.__version__)"
      - name: Publish to PyPI
        run: cd src/sdk/python && hatch publish
        env:
          HATCH_INDEX_USER: __token__
          HATCH_INDEX_AUTH: ${{ secrets.PYPI_TOKEN }}
```

### 9.4 GitHub Actions — Node.js SDK Publish

```yaml
# .github/workflows/sdk-node-publish.yml
name: Publish Node.js SDK
on: workflow_dispatch

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://registry.npmjs.org"
      - run: cd src/sdk/node && npm install
      - run: cd src/sdk/node && npm test
      - run: cd src/sdk/node && npm run build
      - run: cd src/sdk/node && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 9.5 GitHub Actions — Docker Build & Push

```yaml
# .github/workflows/docker-build.yml
name: Docker Build
on: workflow_dispatch

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/ashishkots/openagentvisualizer

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [backend, frontend, otlp-gateway]
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: src/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:latest
            ${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:${{ github.sha }}
          target: prod
```

### 9.6 Pipeline Summary

| Workflow | Trigger | Runs | Publishes |
|----------|---------|------|-----------|
| `backend-ci.yml` | `workflow_dispatch` | Lint + Test + Coverage | Coverage report |
| `frontend-ci.yml` | `workflow_dispatch` | Lint + Type-check + Test + Build | -- |
| `sdk-python-publish.yml` | `workflow_dispatch` | Build + Test + Publish | PyPI package |
| `sdk-node-publish.yml` | `workflow_dispatch` | Build + Test + Publish | npm package |
| `docker-build.yml` | `workflow_dispatch` | Build 3 images | GHCR images |

All workflows use `workflow_dispatch` only — never auto-triggered on push/PR per project policy.

---

## Appendix: Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| SDK event overhead | <5ms per event | Ring buffer write + normalize |
| SDK memory | <10MB RSS | Pre-allocated buffer, lazy imports |
| End-to-end latency (streaming) | <100ms p50 | SDK → dashboard pixel |
| End-to-end latency (batch) | <600ms p99 | Dominated by batch interval |
| Ingestion throughput | 50K events/sec/tenant | Redis Streams + consumer groups |
| WebSocket fanout | 10K events/sec/connection | Batched mode for high volume |
| Frontend render budget | 16ms/frame | 60fps with 100+ agents |
| TimescaleDB write | 100K rows/sec | Batch INSERT with COPY |
| Cold start (SDK init) | <200ms | Lazy adapter loading |
```
