# Agent Integration Architecture — OpenAgentVisualizer

**Stage:** 1.3 — Agentic AI Solution Architect
**Date:** March 16, 2026
**Status:** Complete
**Version:** 1.0

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Supported Agent Frameworks](#2-supported-agent-frameworks)
3. [Data Ingestion Layer](#3-data-ingestion-layer)
4. [Event Schema Design](#4-event-schema-design)
5. [SDK Design](#5-sdk-design)
6. [Real-Time Event Pipeline](#6-real-time-event-pipeline)
7. [Agent Identity & Registry](#7-agent-identity--registry)
8. [Framework Adapter Pattern](#8-framework-adapter-pattern)
9. [Security Model](#9-security-model)
10. [Performance & Scalability](#10-performance--scalability)
11. [Error Handling & Resilience](#11-error-handling--resilience)
12. [API Contracts](#12-api-contracts)

---

## 1. Architecture Overview

### 1.1 System Context

OpenAgentVisualizer operates as a passive observability layer that intercepts, normalizes, and visualizes events emitted by heterogeneous AI agent frameworks. The architecture follows an event-driven, append-only model inspired by event sourcing — every agent action is an immutable event that feeds both the real-time visualization pipeline and the historical replay engine.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Agent Execution Environments                     │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ LangChain│  │  CrewAI  │  │  AutoGen │  │  OpenAI  │  │  Claude  │ │
│  │ LangGraph│  │          │  │          │  │ Assistants│  │ Tool Use │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │              │              │              │       │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐ │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │ │
│  │ (Python) │  │ (Python) │  │ (Python) │  │ (Python) │  │ (Python) │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       └──────────────┴──────────────┴──────┬─────┴──────────────┘       │
│                                            │                             │
│                              ┌─────────────▼──────────────┐             │
│                              │   OpenAgentVisualizer SDK   │             │
│                              │  (Event Normalization Layer)│             │
│                              └─────────────┬──────────────┘             │
└────────────────────────────────────────────┼────────────────────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │    OTLP (gRPC)   │   OTLP (HTTP)   │
                          │    port 4317     │   port 4318     │
                          └──────────┬───────┴────────┬────────┘
                                     │                │
                    ┌────────────────▼────────────────▼────────────────┐
                    │              Ingestion Gateway                    │
                    │  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
                    │  │ Auth &    │ │ Schema   │ │ Rate Limiter   │  │
                    │  │ Tenant ID │ │ Validator│ │ & Backpressure │  │
                    │  └─────┬─────┘ └────┬─────┘ └───────┬────────┘  │
                    └────────┼────────────┼───────────────┼───────────┘
                             │            │               │
                    ┌────────▼────────────▼───────────────▼───────────┐
                    │                  Event Bus                       │
                    │              (Redis Streams)                     │
                    │                                                  │
                    │  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
                    │  │ Live     │  │ Persist   │  │ Aggregation  │ │
                    │  │ Fanout   │  │ Writer    │  │ Engine       │ │
                    │  └────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
                    └───────┼──────────────┼───────────────┼──────────┘
                            │              │               │
               ┌────────────▼──┐    ┌──────▼─────┐  ┌─────▼──────┐
               │  WebSocket /  │    │ TimescaleDB │  │ Prometheus │
               │  SSE Server   │    │ (Events)    │  │ (Metrics)  │
               └───────┬───────┘    │ S3 (Cold)   │  └────────────┘
                       │            └─────────────┘
               ┌───────▼───────────────────────────────────────────┐
               │              Frontend (Browser)                    │
               │                                                    │
               │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
               │  │ PixiJS   │  │ XState   │  │ Yjs CRDT       │  │
               │  │ v8 World │  │ v5 Actors│  │ Collaboration  │  │
               │  │ Canvas   │  │          │  │ State          │  │
               │  └──────────┘  └──────────┘  └────────────────┘  │
               └───────────────────────────────────────────────────┘
```

### 1.2 Core Design Principles

1. **Framework-agnostic normalization**: All agent frameworks emit proprietary events. The SDK adapter layer normalizes them into a unified OpenAgentVisualizer Event Schema before transmission. The backend never processes framework-specific formats.

2. **Append-only event sourcing**: Every event is immutable and appended to a time-ordered log. This enables session replay, time-travel debugging, and audit trails for EU AI Act Article 72 compliance.

3. **Push model with backpressure**: Agents push events to the ingestion gateway. When the gateway is saturated, it signals the SDK to buffer locally and reduce transmission frequency rather than dropping events silently.

4. **XState actor model parity**: Each AI agent maps 1:1 to an XState v5 actor on the frontend. The actor's state machine mirrors the agent's lifecycle (spawn, idle, working, error, terminated), and the Inspect API feeds the PixiJS world canvas directly.

5. **OpenTelemetry-native**: The wire protocol is OTLP (OpenTelemetry Protocol). Agent events are encoded as OTel spans with GenAI semantic conventions. This means any OTel-compatible tool (Jaeger, Grafana Tempo, Datadog) can also consume our trace data if the user chooses.

6. **Sub-5ms SDK overhead**: The SDK must add less than 5ms of latency per event to the instrumented agent process. This is achieved through async batching, pre-allocated buffers, and zero-copy serialization where possible.

### 1.3 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Framework Adapter** | Hooks into framework-specific callbacks/events, translates to normalized schema | Python/Node.js per framework |
| **SDK Core** | Batching, compression, retry, context propagation, OTLP encoding | Python (`openagentvisualizer`), Node.js (`@oav/sdk`) |
| **Ingestion Gateway** | Auth, validation, rate limiting, tenant routing | FastAPI + uvicorn |
| **Event Bus** | Fan-out to consumers, ordering guarantees, consumer group management | Redis Streams |
| **Persist Writer** | Durable event storage with time-series indexing | TimescaleDB (hot), S3/MinIO (cold) |
| **Aggregation Engine** | Real-time metric computation (token rates, cost, error rates) | Redis + Prometheus |
| **Live Fanout** | WebSocket/SSE distribution to connected browsers | FastAPI WebSocket + Redis Pub/Sub |
| **Agent Registry** | Agent identity, metadata, health tracking, discovery | PostgreSQL + Redis cache |
| **Replay Engine** | Reconstruct and replay historical sessions from event log | TimescaleDB queries + WebSocket streaming |

---

## 2. Supported Agent Frameworks

### 2.1 LangChain / LangGraph

**Integration Method:** `BaseCallbackHandler` subclass

LangChain provides a callback system that fires on every LLM call, tool invocation, chain start/end, and agent action. LangGraph extends this with graph node execution events and state transitions.

```python
from openagentvisualizer import OAVCallbackHandler

# Three-line integration
handler = OAVCallbackHandler(api_key="oav_live_abc123")
chain = create_chain(callbacks=[handler])
chain.invoke({"input": "analyze market data"})
```

**Captured Events:**

| LangChain Callback | OAV Event Type | Data Extracted |
|-------------------|----------------|----------------|
| `on_chain_start` | `agent.task.started` | Chain name, input, run_id |
| `on_chain_end` | `agent.task.completed` | Output, duration |
| `on_chain_error` | `agent.error` | Exception type, message, traceback |
| `on_llm_start` | `agent.llm.request` | Model name, prompt tokens, temperature |
| `on_llm_end` | `agent.llm.response` | Completion tokens, cost, latency |
| `on_tool_start` | `agent.tool.invoked` | Tool name, input args |
| `on_tool_end` | `agent.tool.result` | Output, duration |
| `on_agent_action` | `agent.action` | Action type, tool, input |
| `on_agent_finish` | `agent.task.completed` | Final answer, total cost |

**LangGraph-Specific Events:**

| LangGraph Event | OAV Event Type | Data Extracted |
|----------------|----------------|----------------|
| Node execution start | `agent.graph.node_enter` | Node name, state snapshot |
| Node execution end | `agent.graph.node_exit` | Node name, output, next nodes |
| Conditional edge evaluation | `agent.graph.edge_decision` | Condition result, target node |
| State checkpoint | `agent.graph.checkpoint` | Full state dict (configurable redaction) |
| Graph recursion increment | `agent.graph.recursion_tick` | Current depth, max depth |

**Trace Format:** LangChain uses a hierarchical run tree. The adapter converts this to OTel spans where each run is a span, with parent-child relationships preserved. The LangGraph graph execution becomes the root span, with node executions as child spans.

**Loop Detection Hook:** The adapter monitors `on_agent_action` frequency. If the same tool is invoked with substantially similar arguments more than N times (configurable, default: 5) within a single run, it emits an `agent.anomaly.loop_detected` event with severity `warning` at threshold and `critical` at 2x threshold.

### 2.2 CrewAI

**Integration Method:** Agent hooks + task callbacks + crew lifecycle events

CrewAI organizes agents into crews with defined roles, goals, and task assignments. The adapter captures the crew's organizational structure as agent metadata and tracks task delegation events.

```python
from openagentvisualizer import OAVCrewMonitor

monitor = OAVCrewMonitor(api_key="oav_live_abc123")

crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, write_task, edit_task],
    callbacks=[monitor]
)
crew.kickoff()
```

**Captured Events:**

| CrewAI Event | OAV Event Type | Data Extracted |
|-------------|----------------|----------------|
| Crew kickoff | `crew.lifecycle.started` | Crew name, agent roster, task list |
| Agent assigned task | `agent.task.assigned` | Agent role, task description, expected output |
| Agent starts working | `agent.state.working` | Agent name, task context |
| Agent delegates to another | `agent.communication.delegation` | Delegator, delegate, task, reason |
| Task completed | `agent.task.completed` | Output, quality score if available |
| Agent uses tool | `agent.tool.invoked` | Tool name, arguments |
| Crew finished | `crew.lifecycle.completed` | Total duration, cost, task results |
| Crew error | `crew.lifecycle.error` | Error details, failed agent, failed task |

**CrewAI-Specific Metadata:** The adapter extracts each agent's `role`, `goal`, `backstory`, and `allow_delegation` flag, and registers them in the Agent Registry with framework type `crewai`. This enables the frontend to display role-based groupings in the virtual world (e.g., "Research Wing" for researcher agents, "Editing Floor" for editors).

### 2.3 AutoGen

**Integration Method:** Message hook middleware on `GroupChat` and `ConversableAgent`

AutoGen models multi-agent interaction as conversations. The adapter hooks into the message-passing layer to capture every inter-agent message, function call, and code execution event.

```python
from openagentvisualizer import OAVAutoGenMiddleware

middleware = OAVAutoGenMiddleware(api_key="oav_live_abc123")

# Wrap agents
assistant = middleware.wrap(AssistantAgent("assistant", llm_config=llm_config))
user_proxy = middleware.wrap(UserProxyAgent("user_proxy", code_execution_config=exec_config))

user_proxy.initiate_chat(assistant, message="Analyze this dataset")
```

**Captured Events:**

| AutoGen Event | OAV Event Type | Data Extracted |
|--------------|----------------|----------------|
| Message sent | `agent.communication.message_sent` | Sender, recipient, content hash, token count |
| Message received | `agent.communication.message_received` | Sender, recipient, processing time |
| Function call | `agent.tool.invoked` | Function name, arguments |
| Function result | `agent.tool.result` | Return value, execution time |
| Code execution | `agent.tool.code_execution` | Language, code hash, stdout/stderr, exit code |
| GroupChat speaker selection | `agent.communication.speaker_selected` | Selected agent, selection method, candidate list |
| Conversation termination | `agent.lifecycle.terminated` | Reason (max_turns, termination_msg, error) |

**Loop Detection:** AutoGen is particularly susceptible to infinite conversation loops. The adapter tracks message exchange patterns: if Agent A sends to Agent B and Agent B responds to Agent A more than N times (default: 10) without a third-party agent speaking or a tool being invoked, it emits `agent.anomaly.conversation_loop` with the full exchange count and estimated cost of the loop so far.

### 2.4 OpenAI Assistants API

**Integration Method:** Run event streaming via `client.beta.threads.runs.stream()`

The OpenAI Assistants API provides a streaming event interface for run execution. The adapter wraps the streaming client to intercept events without modifying the user's application logic.

```python
from openagentvisualizer import OAVOpenAIWrapper

oav = OAVOpenAIWrapper(api_key="oav_live_abc123")
client = oav.wrap(OpenAI())

# Usage is identical — wrapper intercepts events transparently
with client.beta.threads.runs.stream(
    thread_id=thread.id,
    assistant_id=assistant.id
) as stream:
    for event in stream:
        handle_event(event)
```

**Captured Events:**

| Assistants API Event | OAV Event Type | Data Extracted |
|---------------------|----------------|----------------|
| `thread.run.created` | `agent.task.started` | Run ID, assistant ID, model, instructions |
| `thread.run.in_progress` | `agent.state.working` | Step count |
| `thread.run.step.created` | `agent.step.started` | Step type (message_creation, tool_calls) |
| `thread.run.step.delta` | `agent.step.progress` | Incremental output |
| `thread.run.step.completed` | `agent.step.completed` | Step output, tokens used |
| `thread.run.requires_action` | `agent.tool.pending_approval` | Tool calls awaiting submission |
| `thread.run.completed` | `agent.task.completed` | Total tokens, final output |
| `thread.run.failed` | `agent.error` | Error code, message |
| `thread.run.expired` | `agent.error` | Timeout details |

**Token & Cost Tracking:** The adapter extracts `usage.prompt_tokens` and `usage.completion_tokens` from each completed run step and computes cost based on the model's pricing table (maintained as a configuration file updated weekly).

### 2.5 Anthropic Claude (Tool Use & Streaming)

**Integration Method:** Message streaming event interception + tool use result tracking

Anthropic's Claude API provides streaming message events with explicit tool use blocks. The adapter wraps the Anthropic client to capture tool invocations, streaming content blocks, and token usage.

```python
from openagentvisualizer import OAVAnthropicWrapper

oav = OAVAnthropicWrapper(api_key="oav_live_abc123")
client = oav.wrap(Anthropic())

# Transparent wrapping
with client.messages.stream(
    model="claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": "Research competitors"}],
    tools=tools
) as stream:
    for text in stream.text_stream:
        print(text)
```

**Captured Events:**

| Claude Event | OAV Event Type | Data Extracted |
|-------------|----------------|----------------|
| `message_start` | `agent.llm.request` | Model, system prompt hash, input tokens |
| `content_block_start` (text) | `agent.llm.streaming` | Block index |
| `content_block_start` (tool_use) | `agent.tool.invoked` | Tool name, tool_use_id |
| `content_block_delta` (tool input) | `agent.tool.input_streaming` | Partial JSON input |
| `content_block_stop` | `agent.tool.input_complete` | Full tool input |
| Tool result submitted | `agent.tool.result` | Tool output, is_error flag |
| `message_stop` | `agent.llm.response` | Output tokens, stop reason |
| `message_delta` (stop_reason: tool_use) | `agent.state.awaiting_tool` | Pending tool calls |

**Multi-Turn Tool Use:** Claude's agentic patterns involve multi-turn tool use loops (message -> tool call -> tool result -> message -> ...). The adapter maintains a conversation-level span that groups all turns, tracking cumulative token usage and cost across the full agentic loop.

### 2.6 Custom HTTP Agents

**Integration Method:** Webhook receiver + polling endpoint + generic OTLP

For agents not built on a supported framework (custom Python scripts, Go services, Rust agents, etc.), three integration paths are available:

**Option A — Webhook Push (Recommended):**

```python
import requests

# Agent pushes events directly
requests.post("https://ingest.openagentvisualizer.io/v1/events", json={
    "agent_id": "custom-agent-001",
    "event_type": "agent.task.completed",
    "timestamp": "2026-03-16T10:30:00Z",
    "data": {
        "task_name": "data_extraction",
        "duration_ms": 4500,
        "tokens_used": 1200,
        "cost_usd": 0.036
    }
}, headers={"Authorization": "Bearer oav_live_abc123"})
```

**Option B — OTLP Direct:**

Any agent that can emit OpenTelemetry spans can send them directly to the OAV OTLP receiver without using the SDK at all. The receiver accepts standard OTLP/gRPC on port 4317 and OTLP/HTTP on port 4318. Agent-specific attributes are extracted from OTel resource attributes and span attributes following GenAI semantic conventions.

**Option C — Polling (Pull Model):**

For agents that expose a status endpoint but cannot push events, OAV provides a lightweight poller that queries the agent's health/status endpoint at configurable intervals (default: 5 seconds) and converts responses into events:

```yaml
# oav-poller-config.yml
agents:
  - id: "legacy-agent-001"
    endpoint: "http://localhost:8080/status"
    poll_interval_seconds: 5
    auth:
      type: bearer
      token_env: "LEGACY_AGENT_TOKEN"
    field_mapping:
      state: "$.status"
      current_task: "$.active_task.name"
      tokens_used: "$.metrics.total_tokens"
```

### 2.7 Open Source Models: Llama, Ollama, HuggingFace

**Integration Method:** Inference server hooks + model-agnostic wrappers

Open-source model deployments differ from API-based models because the inference server is local. The adapter hooks vary by deployment method:

**Ollama:**

```python
from openagentvisualizer import OAVOllamaWrapper

oav = OAVOllamaWrapper(api_key="oav_live_abc123")
client = oav.wrap_ollama()  # Wraps ollama.Client()

response = client.chat(model="llama3.2", messages=[...])
# Events captured: model load time, prompt eval time, token generation rate, total tokens
```

**Captured Metrics Specific to Local Models:**

| Metric | Source | Why It Matters |
|--------|--------|---------------|
| Model load time | Ollama `/api/generate` timing | Cold start detection |
| Tokens per second | Ollama `eval_count / eval_duration` | Hardware performance monitoring |
| GPU memory usage | `nvidia-smi` or `torch.cuda.memory_allocated` | Resource exhaustion detection |
| Prompt eval tokens/sec | Ollama `prompt_eval_count / prompt_eval_duration` | Prompt complexity monitoring |
| Context window utilization | Token count / model max context | Approaching context limits |

**HuggingFace Transformers:**

```python
from openagentvisualizer import OAVHuggingFaceCallback

callback = OAVHuggingFaceCallback(api_key="oav_live_abc123")

# Works with pipeline API
pipe = pipeline("text-generation", model="meta-llama/Llama-3.2-3B", callbacks=[callback])
result = pipe("Analyze this data")

# Works with direct generate()
model.generate(**inputs, callbacks=[callback])
```

**HuggingFace Inference Endpoints:**

For HuggingFace-hosted inference endpoints, the adapter wraps `InferenceClient` and captures request/response metrics including queue time, inference time, and token counts.

**vLLM / TGI (Text Generation Inference):**

For production deployments using vLLM or HuggingFace TGI, the adapter provides an OpenAI-compatible client wrapper (since both expose OpenAI-compatible APIs):

```python
from openagentvisualizer import OAVOpenAICompatWrapper

oav = OAVOpenAICompatWrapper(
    api_key="oav_live_abc123",
    base_url="http://localhost:8000/v1",  # vLLM server
    framework_tag="vllm"
)
client = oav.client()
```

---

## 3. Data Ingestion Layer

### 3.1 OpenTelemetry GenAI Semantic Conventions Compliance

OpenAgentVisualizer adopts the OpenTelemetry GenAI Semantic Conventions (currently in experimental status as of March 2026, with active contributions from IBM, Google, and Microsoft) as the canonical wire format. This ensures interoperability with the broader observability ecosystem.

**Adopted Conventions:**

| OTel GenAI Attribute | OAV Usage | Example |
|---------------------|-----------|---------|
| `gen_ai.system` | Framework identifier | `langchain`, `crewai`, `openai` |
| `gen_ai.request.model` | Model name | `gpt-4o`, `claude-sonnet-4-20250514`, `llama-3.2-70b` |
| `gen_ai.request.max_tokens` | Max output tokens requested | `4096` |
| `gen_ai.request.temperature` | Sampling temperature | `0.7` |
| `gen_ai.usage.input_tokens` | Prompt token count | `1500` |
| `gen_ai.usage.output_tokens` | Completion token count | `800` |
| `gen_ai.response.finish_reasons` | Stop reason | `["stop"]`, `["tool_calls"]` |

**OAV-Extended Attributes (Namespace: `oav.*`):**

| Attribute | Type | Description |
|-----------|------|-------------|
| `oav.agent.id` | string | Unique agent identifier |
| `oav.agent.name` | string | Human-readable agent name |
| `oav.agent.role` | string | Agent role (researcher, writer, reviewer) |
| `oav.agent.framework` | string | Source framework |
| `oav.task.id` | string | Task identifier |
| `oav.task.name` | string | Task description |
| `oav.cost.usd` | float | Computed cost in USD |
| `oav.session.id` | string | Session grouping for replay |
| `oav.tenant.id` | string | Multi-tenant isolation key |
| `oav.loop.depth` | int | Current recursion/loop depth |
| `oav.loop.max_depth` | int | Configured maximum depth |

### 3.2 OTLP Receiver (gRPC + HTTP)

The ingestion gateway exposes two OTLP endpoints:

**gRPC Receiver (port 4317):**
- Protocol: `opentelemetry.proto.collector.trace.v1.TraceService/Export`
- Compression: gzip (default), zstd (optional)
- Max message size: 16 MB
- Connection multiplexing: HTTP/2 streams
- Best for: High-throughput SDK clients, backend-to-backend communication

**HTTP Receiver (port 4318):**
- Endpoint: `POST /v1/traces`
- Content-Type: `application/x-protobuf` or `application/json`
- Compression: gzip
- Max payload size: 16 MB
- Best for: Browser-based agents, serverless functions, environments where gRPC is unavailable

**Custom REST Receiver (port 443, path `/v1/events`):**
- For agents that cannot emit OTLP, a JSON REST endpoint accepts the simplified OAV event format
- The gateway internally converts these to OTLP spans before writing to the event bus

```
                    ┌─────────────────────────────┐
                    │       Ingestion Gateway       │
                    │                               │
  OTLP/gRPC:4317 ──▶  ┌─────────────────────┐    │
                    │  │ Proto Deserializer   │    │
  OTLP/HTTP:4318 ──▶  ├─────────────────────┤    │
                    │  │ JSON Deserializer    │    │──▶ Redis Streams
  REST/JSON:443  ──▶  ├─────────────────────┤    │
                    │  │ Webhook Receiver     │    │
                    │  └──────────┬──────────┘    │
                    │             │                │
                    │  ┌──────────▼──────────┐    │
                    │  │ Auth │ Validate │ Tag│    │
                    │  └─────────────────────┘    │
                    └─────────────────────────────┘
```

### 3.3 Custom SDK for Each Framework

Each framework adapter is distributed as an optional extra of the main Python SDK:

```bash
# Core SDK (framework-agnostic)
pip install openagentvisualizer

# Framework-specific adapters
pip install openagentvisualizer[langchain]
pip install openagentvisualizer[crewai]
pip install openagentvisualizer[autogen]
pip install openagentvisualizer[openai]
pip install openagentvisualizer[anthropic]
pip install openagentvisualizer[ollama]
pip install openagentvisualizer[huggingface]

# Install all adapters
pip install openagentvisualizer[all]
```

**Dependency Policy:** The core SDK has zero required dependencies beyond the Python standard library and `protobuf`. Framework adapters only add a dependency on the framework they wrap (e.g., `openagentvisualizer[langchain]` requires `langchain-core>=0.3.0`). This ensures the SDK never forces unwanted dependencies.

### 3.4 Event Schema (Spans, Traces, Metrics, Logs)

**Spans:** Every discrete agent action (LLM call, tool invocation, task execution) is a span. Spans have a start time, end time, parent span ID, and attribute map.

**Traces:** A trace is a tree of spans sharing a single `trace_id`. A trace represents one complete agent session or crew execution. Traces are the unit of replay.

**Metrics:** Computed from spans in real-time by the aggregation engine:

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `oav_agent_tokens_total` | Counter | agent_id, model, direction | Cumulative token count |
| `oav_agent_cost_usd_total` | Counter | agent_id, model | Cumulative cost |
| `oav_agent_tasks_total` | Counter | agent_id, status | Task count by status |
| `oav_agent_latency_seconds` | Histogram | agent_id, operation | Operation latency distribution |
| `oav_agent_errors_total` | Counter | agent_id, error_type | Error count by type |
| `oav_agent_active_count` | Gauge | tenant_id, framework | Currently active agents |
| `oav_event_ingest_rate` | Gauge | tenant_id | Events per second ingested |
| `oav_loop_detections_total` | Counter | agent_id, severity | Loop detection alert count |

**Logs:** Structured log events for debugging and audit trails. Every event that modifies agent state also emits a log entry with the full before/after state diff, satisfying EU AI Act Article 72 audit requirements.

### 3.5 Batch vs Streaming Ingestion

The SDK supports two ingestion modes, selected automatically based on event volume:

**Batch Mode (Default):**
- Events are buffered locally for up to 500ms or 100 events (whichever comes first)
- Batch is compressed (gzip) and sent as a single OTLP ExportTraceServiceRequest
- Reduces network overhead by 80-95% compared to per-event transmission
- Retry on failure with exponential backoff (100ms, 200ms, 400ms, 800ms, max 5s)
- Local buffer capacity: 10,000 events (configurable). If exceeded, oldest events are dropped with a warning metric incremented

**Streaming Mode (Opt-in):**
- Events are sent immediately as they are generated
- Used when sub-second latency is critical (e.g., live demo, debugging session)
- Higher network overhead but events appear in the visualization within 50-100ms
- Activated per-session: `handler.set_mode("streaming")`

**Hybrid Mode:**
- Streaming for high-priority events (errors, loop detections, state changes)
- Batch for low-priority events (token counts, progress updates)
- Default behavior when streaming mode is not explicitly requested

```python
from openagentvisualizer import OAVClient

client = OAVClient(
    api_key="oav_live_abc123",
    mode="batch",              # "batch" | "streaming" | "hybrid"
    batch_size=100,            # Max events per batch
    batch_interval_ms=500,     # Max time before flush
    buffer_capacity=10000,     # Local buffer size
    compression="gzip",        # "gzip" | "zstd" | "none"
    endpoint="https://ingest.openagentvisualizer.io"
)
```

---

## 4. Event Schema Design

### 4.1 Agent Lifecycle Events

Agent lifecycle events track the state transitions of an agent from creation to termination. These map directly to XState v5 actor states on the frontend.

```json
{
  "event_type": "agent.lifecycle",
  "timestamp": "2026-03-16T10:30:00.000Z",
  "agent_id": "agent_abc123",
  "session_id": "session_xyz789",
  "tenant_id": "tenant_001",
  "trace_id": "0af7651916cd43dd8448eb211c80319c",
  "span_id": "b7ad6b7169203331",
  "data": {
    "state": "working",
    "previous_state": "idle",
    "trigger": "task_assigned",
    "metadata": {
      "task_id": "task_456",
      "task_name": "Extract competitor pricing",
      "assigned_by": "agent_orchestrator_001"
    }
  }
}
```

**State Machine Definition:**

```
                    ┌──────────────────────────────────────┐
                    │                                      │
   ┌────────┐   task_assigned   ┌─────────┐   error    ┌──▼──┐
   │ SPAWNED├──────────────────▶│ WORKING ├───────────▶│ERROR│
   └───┬────┘                   └────┬────┘            └──┬──┘
       │                             │                    │
       │ no_task                     │ task_completed     │ recovered
       ▼                             ▼                    │
   ┌────────┐◀───────────────── ┌─────────┐             │
   │  IDLE  │   all_tasks_done  │COMPLETED│◀────────────┘
   └───┬────┘                   └─────────┘
       │
       │ shutdown / max_idle_timeout
       ▼
   ┌────────────┐
   │ TERMINATED │
   └────────────┘
```

**Valid States:**

| State | Description | Visual in World Canvas |
|-------|-------------|----------------------|
| `spawned` | Agent just created, initializing | Fade-in animation, pulsing outline |
| `idle` | Waiting for task assignment | Subtle breathing animation, dimmed color |
| `working` | Actively processing a task | Bright color, active particle trail, task icon overlay |
| `completed` | Task finished successfully | Green flash, XP increment animation |
| `error` | Encountered an error | Red pulsing glow, warning icon, shake animation |
| `terminated` | Agent shut down | Fade-out animation, ghost trail |

### 4.2 Task Events

```json
{
  "event_type": "agent.task",
  "timestamp": "2026-03-16T10:30:05.000Z",
  "agent_id": "agent_abc123",
  "session_id": "session_xyz789",
  "tenant_id": "tenant_001",
  "trace_id": "0af7651916cd43dd8448eb211c80319c",
  "span_id": "c8be6c8279314442",
  "parent_span_id": "b7ad6b7169203331",
  "data": {
    "action": "started",
    "task_id": "task_456",
    "task_name": "Extract competitor pricing",
    "task_type": "data_extraction",
    "priority": "high",
    "assigned_by": "agent_orchestrator_001",
    "expected_duration_ms": 30000,
    "context": {
      "input_summary": "Extract pricing data from 5 competitor websites",
      "tools_available": ["web_scraper", "pdf_parser", "calculator"]
    }
  }
}
```

**Task Action Types:**

| Action | Trigger | Visual Effect |
|--------|---------|---------------|
| `assigned` | Orchestrator assigns task | Task object animates from orchestrator to agent |
| `started` | Agent begins processing | Agent avatar changes to working state |
| `progress` | Incremental update (0-100%) | Progress bar fills on agent card |
| `delegated` | Agent delegates to another agent | Task object animates to delegate with delegation trail |
| `completed` | Task finished successfully | Completion burst animation, XP awarded |
| `failed` | Task failed | Red flash, error tooltip, task returns to queue |
| `retried` | Task being retried | Retry icon overlay, counter incremented |
| `cancelled` | Task cancelled externally | Task fades out with strikethrough |

### 4.3 Communication Events

Communication events capture inter-agent messaging, which is critical for visualizing collaboration patterns and detecting conversation loops.

```json
{
  "event_type": "agent.communication",
  "timestamp": "2026-03-16T10:30:10.000Z",
  "agent_id": "agent_abc123",
  "session_id": "session_xyz789",
  "tenant_id": "tenant_001",
  "trace_id": "0af7651916cd43dd8448eb211c80319c",
  "span_id": "d9cf7d9389425553",
  "data": {
    "action": "message_sent",
    "from_agent_id": "agent_abc123",
    "to_agent_id": "agent_def456",
    "message_type": "task_handoff",
    "content_hash": "sha256:a1b2c3d4...",
    "content_preview": "Here are the extracted pricing figures...",
    "token_count": 450,
    "tool_calls": [
      {
        "tool_name": "web_scraper",
        "tool_id": "call_001",
        "input_summary": "scrape(url='https://competitor.com/pricing')",
        "status": "completed",
        "duration_ms": 2300,
        "output_summary": "Extracted 3 pricing tiers"
      }
    ]
  }
}
```

**Communication Action Types:**

| Action | Description | Visual |
|--------|-------------|--------|
| `message_sent` | Agent sends message to another | Animated dashed line from sender to receiver |
| `message_received` | Agent receives message | Receiver avatar briefly highlights |
| `broadcast` | Agent sends to all agents in group | Radial pulse from sender |
| `tool_call` | Agent invokes external tool | Tool icon appears with connection line |
| `function_result` | Tool returns result | Result packet animates back to agent |
| `handoff` | Agent transfers control to another | Visible state transfer animation |

### 4.4 Resource Events

```json
{
  "event_type": "agent.resource",
  "timestamp": "2026-03-16T10:30:15.000Z",
  "agent_id": "agent_abc123",
  "session_id": "session_xyz789",
  "tenant_id": "tenant_001",
  "data": {
    "token_usage": {
      "input_tokens": 1500,
      "output_tokens": 800,
      "total_tokens": 2300,
      "model": "gpt-4o",
      "cost_usd": 0.0345
    },
    "latency": {
      "llm_call_ms": 2100,
      "tool_execution_ms": 450,
      "total_step_ms": 2550
    },
    "cumulative": {
      "session_tokens": 15000,
      "session_cost_usd": 0.45,
      "session_duration_ms": 120000,
      "tasks_completed": 3,
      "tasks_failed": 0
    },
    "budget": {
      "allocated_usd": 5.00,
      "consumed_usd": 0.45,
      "remaining_usd": 4.55,
      "consumption_rate_usd_per_min": 0.225
    }
  }
}
```

### 4.5 Error and Anomaly Events

```json
{
  "event_type": "agent.anomaly",
  "timestamp": "2026-03-16T10:31:00.000Z",
  "agent_id": "agent_abc123",
  "session_id": "session_xyz789",
  "tenant_id": "tenant_001",
  "severity": "critical",
  "data": {
    "anomaly_type": "loop_detected",
    "details": {
      "loop_count": 12,
      "threshold": 5,
      "pattern": "agent_abc123 -> tool:web_scraper -> agent_abc123 (repeated)",
      "estimated_wasted_cost_usd": 3.60,
      "estimated_wasted_tokens": 12000,
      "first_occurrence": "2026-03-16T10:28:00.000Z",
      "duration_ms": 180000
    },
    "recommended_action": "kill_run",
    "auto_action_taken": "alert_emitted"
  }
}
```

**Anomaly Types:**

| Type | Detection Method | Severity | Auto-Action |
|------|-----------------|----------|-------------|
| `loop_detected` | Same tool + similar args > N times | critical | Alert + optional auto-kill |
| `conversation_loop` | A->B->A->B without progress > N rounds | critical | Alert |
| `rate_limit_hit` | HTTP 429 from LLM provider | warning | Backoff notification |
| `timeout` | Step exceeds max duration | warning | Alert |
| `cost_threshold_exceeded` | Session cost > configured limit | critical | Alert + optional auto-kill |
| `hallucination_flag` | External validator flags output | warning | Alert + flag in replay |
| `context_overflow` | Token count approaching model limit | warning | Alert |
| `error_cascade` | 3+ consecutive errors in pipeline | critical | Alert + circuit breaker |

---

## 5. SDK Design

### 5.1 Python SDK (Primary)

**Package:** `openagentvisualizer` on PyPI
**Python Version:** 3.9+
**Dependencies (core):** `protobuf>=4.0.0` (only required dependency)

**Architecture:**

```
openagentvisualizer/
├── __init__.py              # Public API surface
├── client.py                # OAVClient — transport and batching
├── context.py               # Context propagation (trace_id, span_id, session_id)
├── schema.py                # Event dataclasses and validation
├── transport/
│   ├── grpc.py              # OTLP gRPC transport
│   ├── http.py              # OTLP HTTP transport
│   └── buffer.py            # Ring buffer for local event storage
├── adapters/
│   ├── langchain.py         # OAVCallbackHandler
│   ├── crewai.py            # OAVCrewMonitor
│   ├── autogen.py           # OAVAutoGenMiddleware
│   ├── openai_assistants.py # OAVOpenAIWrapper
│   ├── anthropic_claude.py  # OAVAnthropicWrapper
│   ├── ollama.py            # OAVOllamaWrapper
│   ├── huggingface.py       # OAVHuggingFaceCallback
│   └── generic.py           # OAVGenericAdapter (webhook/REST)
├── auto_instrument.py       # Auto-detection and patching
├── pricing.py               # Model pricing tables (updated weekly)
└── _internal/
    ├── clock.py             # Monotonic clock for ordering
    ├── dedup.py             # Event deduplication
    └── sampling.py          # Head/tail sampling logic
```

**Initialization:**

```python
import openagentvisualizer as oav

# Minimal initialization (3 lines to first event)
oav.init(api_key="oav_live_abc123")

# Full configuration
oav.init(
    api_key="oav_live_abc123",
    endpoint="https://ingest.openagentvisualizer.io",
    transport="grpc",               # "grpc" | "http"
    mode="hybrid",                  # "batch" | "streaming" | "hybrid"
    batch_size=100,
    batch_interval_ms=500,
    buffer_capacity=10000,
    sample_rate=1.0,                # 1.0 = 100%, 0.1 = 10%
    auto_instrument=True,           # Auto-detect and patch frameworks
    pii_redaction=True,             # Redact emails, phone numbers, SSNs
    debug=False,
    tags={"environment": "production", "team": "research"},
    on_error=lambda e: logging.warning(f"OAV SDK error: {e}")
)
```

**Auto-Instrumentation:**

When `auto_instrument=True`, the SDK scans `sys.modules` for known frameworks and automatically patches them:

```python
# Auto-instrument detects LangChain is imported and patches it
import langchain  # User's existing import
import openagentvisualizer as oav

oav.init(api_key="oav_live_abc123", auto_instrument=True)
# LangChain callbacks are now automatically attached — zero code changes to existing agent
```

Detection order: LangChain -> CrewAI -> AutoGen -> OpenAI -> Anthropic -> Ollama -> HuggingFace. If multiple frameworks are detected, all are instrumented simultaneously.

**Context Propagation:**

The SDK maintains a thread-local (and async-task-local) context that automatically links related events:

```python
# Context is propagated automatically through async boundaries
async def agent_workflow():
    with oav.session("market_research_run") as session:
        # All events within this block share the same session_id
        result = await agent.run("research competitors")
        # If agent.run() triggers sub-agents, their events are
        # linked to the same trace via context propagation
```

**Manual Instrumentation:**

For cases where auto-instrumentation is insufficient:

```python
import openagentvisualizer as oav

# Register an agent
agent = oav.register_agent(
    agent_id="custom-analyzer",
    name="Market Analyzer",
    role="researcher",
    framework="custom",
    model="gpt-4o",
    capabilities=["web_search", "data_analysis"]
)

# Emit events manually
with agent.task("analyze_competitors") as task:
    task.progress(10, "Fetching competitor list")
    competitors = fetch_competitors()

    task.progress(50, "Analyzing pricing")
    with agent.tool_call("web_scraper", {"url": "https://..."}) as tool:
        result = scrape_pricing()
        tool.result(result)

    task.progress(100, "Analysis complete")
    task.complete(result=analysis)
```

### 5.2 Node.js SDK

**Package:** `@openagentvisualizer/sdk` on npm
**Node Version:** 18+
**TypeScript:** First-class support with full type definitions

```typescript
import { OAVClient, OAVOpenAIAdapter } from '@openagentvisualizer/sdk';

// Initialize
const oav = new OAVClient({
  apiKey: 'oav_live_abc123',
  transport: 'http',  // Node.js default is HTTP; gRPC available
  mode: 'hybrid',
});

// Wrap OpenAI client
const openai = oav.wrapOpenAI(new OpenAI());

// Or wrap Vercel AI SDK
import { generateText } from 'ai';
const wrappedGenerate = oav.wrapVercelAI(generateText);
const result = await wrappedGenerate({
  model: openai('gpt-4o'),
  prompt: 'Analyze this data'
});
```

**Supported Node.js Frameworks:**

| Framework | Adapter | Auto-Instrument |
|-----------|---------|----------------|
| OpenAI Node SDK | `OAVOpenAIAdapter` | Yes |
| Anthropic Node SDK | `OAVAnthropicAdapter` | Yes |
| Vercel AI SDK | `OAVVercelAIAdapter` | Yes |
| LangChain.js | `OAVLangChainJSAdapter` | Yes |
| Custom agents | `OAVGenericAdapter` | No (manual) |

### 5.3 REST API Fallback

For languages without an SDK (Go, Rust, Java, etc.), the REST API provides full functionality:

```bash
# Register an agent
curl -X POST https://api.openagentvisualizer.io/v1/agents \
  -H "Authorization: Bearer oav_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "go-agent-001",
    "name": "Go Data Processor",
    "role": "processor",
    "framework": "custom",
    "model": "claude-sonnet-4-20250514"
  }'

# Emit an event
curl -X POST https://api.openagentvisualizer.io/v1/events \
  -H "Authorization: Bearer oav_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "go-agent-001",
    "event_type": "agent.task.completed",
    "timestamp": "2026-03-16T10:30:00Z",
    "data": {
      "task_name": "process_batch_47",
      "duration_ms": 1200,
      "tokens_used": 500,
      "cost_usd": 0.015
    }
  }'
```

### 5.4 SDK Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Per-event overhead | < 5ms | Time from event creation to local buffer write |
| Memory footprint | < 10 MB | RSS increase after SDK init |
| Batch flush latency | < 50ms | Time from flush trigger to network send start |
| CPU overhead | < 1% | CPU time attributed to SDK at 100 events/sec |
| Network bandwidth | < 100 KB/s | At 100 events/sec with gzip compression |
| Cold start time | < 200ms | Time from `oav.init()` to ready state |

**Implementation Techniques:**

1. **Pre-allocated ring buffer:** The event buffer is a fixed-size ring buffer allocated at init time. No dynamic allocation during event emission.
2. **Zero-copy serialization:** Events are serialized to protobuf directly from struct fields without intermediate dictionary creation.
3. **Background flush thread:** A dedicated daemon thread handles network I/O. Event emission never blocks the calling thread.
4. **Monotonic clock:** Uses `time.monotonic_ns()` for ordering guarantees, with wall clock only for display timestamps.
5. **Lazy adapter loading:** Framework adapters are imported only when their framework is detected, keeping the base import lightweight.

---

## 6. Real-Time Event Pipeline

### 6.1 WebSocket Architecture for Live Updates

The frontend connects to the backend via a single WebSocket connection per browser session. The WebSocket carries all live agent events for the user's tenant.

```
Browser                    Load Balancer         WebSocket Server          Redis
  │                            │                       │                    │
  │── WS upgrade ─────────────▶│                       │                    │
  │                            │── route (sticky) ────▶│                    │
  │                            │                       │── SUBSCRIBE ──────▶│
  │                            │                       │   tenant:{id}      │
  │                            │                       │                    │
  │                            │                       │◀── event ──────────│
  │◀── JSON message ───────────│◀──────────────────────│                    │
  │                            │                       │                    │
  │── ping (30s) ─────────────▶│──────────────────────▶│                    │
  │◀── pong ──────────────────│◀──────────────────────│                    │
```

**WebSocket Message Format:**

```json
{
  "type": "agent.event",
  "seq": 1042,
  "timestamp": "2026-03-16T10:30:00.000Z",
  "payload": {
    "event_type": "agent.lifecycle",
    "agent_id": "agent_abc123",
    "data": { "state": "working", "previous_state": "idle" }
  }
}
```

**Connection Management:**
- Heartbeat: Client sends ping every 30 seconds; server responds with pong within 5 seconds or connection is considered dead
- Reconnection: Exponential backoff starting at 1 second, max 30 seconds, with jitter
- Catch-up: On reconnect, client sends last received `seq` number; server replays missed events from Redis stream
- Max reconnect attempts: 10 before falling back to polling mode

**Message Types:**

| Type | Direction | Purpose |
|------|-----------|---------|
| `agent.event` | Server -> Client | Real-time agent event |
| `agent.batch` | Server -> Client | Batched events (high-volume mode) |
| `agent.state_sync` | Server -> Client | Full state snapshot (on connect/reconnect) |
| `command.subscribe` | Client -> Server | Subscribe to specific agents/sessions |
| `command.unsubscribe` | Client -> Server | Unsubscribe from agents/sessions |
| `command.kill_agent` | Client -> Server | Send kill signal to agent (via SDK) |
| `command.set_filter` | Client -> Server | Set event filter (severity, agent_id, etc.) |
| `ping` / `pong` | Bidirectional | Connection keepalive |

### 6.2 SSE for Metrics Streams

Server-Sent Events are used for one-way metrics streams that power dashboard widgets (charts, gauges, counters). SSE is preferred over WebSocket for metrics because it scales horizontally with HTTP/2 multiplexing, auto-reconnects, and works through all CDN/proxy configurations.

```
GET /v1/streams/metrics?tenant_id=001&agents=all HTTP/1.1
Accept: text/event-stream

event: metric
data: {"name":"oav_agent_active_count","value":12,"labels":{"framework":"langchain"},"ts":"2026-03-16T10:30:00Z"}

event: metric
data: {"name":"oav_agent_cost_usd_total","value":4.56,"labels":{"agent_id":"abc123"},"ts":"2026-03-16T10:30:05Z"}

event: metric
data: {"name":"oav_event_ingest_rate","value":847,"labels":{},"ts":"2026-03-16T10:30:05Z"}
```

**Metric Stream Channels:**

| Channel | Update Frequency | Data |
|---------|-----------------|------|
| `metrics.overview` | 5 seconds | Active agents, total events, total cost, error rate |
| `metrics.agent.{id}` | 2 seconds | Per-agent tokens, cost, latency, state |
| `metrics.cost` | 10 seconds | Cost by agent, model, team, session |
| `metrics.topology` | 5 seconds | Agent communication graph edges and weights |
| `metrics.alerts` | Real-time | New alerts, severity changes |

### 6.3 Redis Pub/Sub for Event Distribution

Redis Streams serve as the central event bus with consumer group support for reliable delivery:

```
Producer (Ingestion Gateway)
    │
    ▼
Redis Stream: "events:{tenant_id}"
    │
    ├── Consumer Group: "websocket-fanout"
    │   ├── Consumer: ws-server-1 (handles clients A, B)
    │   └── Consumer: ws-server-2 (handles clients C, D)
    │
    ├── Consumer Group: "persist-writer"
    │   └── Consumer: persist-1 (writes to TimescaleDB)
    │
    ├── Consumer Group: "aggregation"
    │   └── Consumer: agg-1 (computes real-time metrics)
    │
    └── Consumer Group: "alert-engine"
        └── Consumer: alert-1 (loop detection, cost alerts)
```

**Redis Stream Configuration:**
- Max stream length: 100,000 entries per tenant (MAXLEN with approximate trimming)
- Consumer group acknowledgment: Events must be ACKed within 60 seconds or are re-delivered
- Dead letter after: 3 failed delivery attempts

### 6.4 Event Ordering and Deduplication

**Ordering:** Events carry a monotonic sequence number (`seq`) assigned by the ingestion gateway using a Redis INCR counter per tenant. The frontend uses `seq` to detect gaps and request replays. Within a single agent, events are also ordered by the SDK's local monotonic clock to handle out-of-order network delivery.

**Deduplication:** Each event carries a deterministic `event_id` computed as `SHA-256(agent_id + trace_id + span_id + timestamp_ns)`. The ingestion gateway maintains a Redis SET of recent event IDs (TTL: 5 minutes) and silently drops duplicates. This handles retry-induced duplicates from SDK reconnections.

### 6.5 Backpressure Handling

When event volume exceeds processing capacity, the system applies backpressure at multiple layers:

| Layer | Signal | Response |
|-------|--------|----------|
| **SDK** | HTTP 429 or gRPC RESOURCE_EXHAUSTED from gateway | Increase batch interval, enable sampling |
| **Ingestion Gateway** | Redis Stream lag > 10,000 entries | Return HTTP 429 to SDKs, enable head sampling |
| **WebSocket Server** | Client send buffer > 1 MB | Switch to batched mode (50 events/message) |
| **Frontend** | > 60 events/frame (16ms) | Queue events, process max 60/frame, show "high volume" indicator |

**Adaptive Sampling Under Load:**

When the gateway detects sustained high volume (>50K events/sec per tenant), it activates tail-based sampling:
1. All error events, anomaly events, and state change events are always kept (100%)
2. LLM request/response events are sampled at 50%
3. Progress events are sampled at 10%
4. Token usage metrics are aggregated rather than per-event

The sampling rate is communicated to the frontend via a `system.sampling_active` WebSocket message so the UI can display a warning indicator.

---

## 7. Agent Identity & Registry

### 7.1 Agent Registration

Agents register themselves when the SDK first emits an event for an unknown `agent_id`. Registration can also be explicit via the REST API or SDK method.

**Auto-Registration (Implicit):**

When the ingestion gateway receives an event with an `agent_id` not in the registry, it creates a registry entry using metadata from the event's OTel resource attributes:

```
Resource Attributes:
  oav.agent.id = "agent_abc123"
  oav.agent.name = "Market Researcher"
  oav.agent.role = "researcher"
  oav.agent.framework = "crewai"
  gen_ai.request.model = "gpt-4o"
```

**Explicit Registration (Recommended):**

```python
import openagentvisualizer as oav

oav.init(api_key="oav_live_abc123")

agent = oav.register_agent(
    agent_id="market-researcher-v2",
    name="Market Researcher",
    role="researcher",
    framework="crewai",
    model="gpt-4o",
    capabilities=["web_search", "pdf_analysis", "data_extraction"],
    tags={"team": "research", "version": "2.1", "environment": "production"},
    avatar_seed="researcher-blue",    # Deterministic avatar generation seed
    budget_usd=10.00,                 # Per-session cost budget
    max_loop_count=10,                # Loop detection threshold
    metadata={
        "crewai_role": "Senior Research Analyst",
        "crewai_goal": "Find comprehensive market data",
        "crewai_backstory": "Expert analyst with 10 years experience"
    }
)
```

### 7.2 Agent Metadata Schema

```json
{
  "agent_id": "market-researcher-v2",
  "tenant_id": "tenant_001",
  "name": "Market Researcher",
  "role": "researcher",
  "framework": "crewai",
  "framework_version": "0.108.0",
  "model": "gpt-4o",
  "model_provider": "openai",
  "capabilities": ["web_search", "pdf_analysis", "data_extraction"],
  "tags": {
    "team": "research",
    "version": "2.1",
    "environment": "production"
  },
  "avatar_seed": "researcher-blue",
  "config": {
    "budget_usd": 10.00,
    "max_loop_count": 10,
    "max_idle_timeout_ms": 300000,
    "pii_redaction": true
  },
  "stats": {
    "total_tasks_completed": 847,
    "total_tasks_failed": 23,
    "total_tokens_used": 2450000,
    "total_cost_usd": 73.50,
    "avg_task_duration_ms": 4500,
    "error_rate_7d": 0.027,
    "uptime_streak_days": 14,
    "xp": 8470,
    "level": 12,
    "badges": ["first_task", "hundred_tasks", "zero_error_day", "cost_optimizer"]
  },
  "health": {
    "status": "healthy",
    "last_seen": "2026-03-16T10:30:00Z",
    "last_error": "2026-03-14T08:15:00Z",
    "current_state": "idle"
  },
  "created_at": "2026-02-01T00:00:00Z",
  "updated_at": "2026-03-16T10:30:00Z"
}
```

### 7.3 Agent Discovery and Health Checks

**Discovery:** The Agent Registry exposes a query API that the frontend uses to populate the world canvas:

```
GET /v1/agents?tenant_id=001&status=active&framework=crewai&role=researcher
```

Response includes all registered agents matching the filter, with their current state and summary stats.

**Health Checks:**

The registry considers an agent healthy based on:

| Criterion | Healthy | Degraded | Unhealthy |
|-----------|---------|----------|-----------|
| Last event received | < 5 minutes ago | 5-15 minutes ago | > 15 minutes ago |
| Error rate (1h window) | < 5% | 5-20% | > 20% |
| Consecutive errors | 0-2 | 3-5 | > 5 |
| Loop detected | No | Warning level | Critical level |
| Budget remaining | > 20% | 5-20% | < 5% or exceeded |

Health status is recomputed every 30 seconds and pushed to connected frontends via the WebSocket `agent.health` message type.

### 7.4 Multi-Tenant Agent Isolation

Every event, agent registration, and API call is scoped to a `tenant_id` derived from the API key. Isolation is enforced at every layer:

| Layer | Isolation Mechanism |
|-------|-------------------|
| **Ingestion Gateway** | API key -> tenant_id mapping; events tagged on ingestion |
| **Redis Streams** | Separate stream per tenant: `events:{tenant_id}` |
| **TimescaleDB** | Row-level security policies on `tenant_id` column |
| **WebSocket** | Server only subscribes to the authenticated tenant's stream |
| **API** | All queries include mandatory `tenant_id` filter |
| **S3 Cold Storage** | Separate prefix per tenant: `s3://oav-events/{tenant_id}/` |

Cross-tenant data leakage is prevented by design: there is no API or internal path that can query across tenants.

---

## 8. Framework Adapter Pattern

### 8.1 Adapter Interface Specification

All framework adapters implement the `OAVAdapter` abstract base class:

```python
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from openagentvisualizer.schema import OAVEvent, AgentMetadata

class OAVAdapter(ABC):
    """Base class for all framework adapters."""

    def __init__(self, client: 'OAVClient', config: Dict[str, Any] = None):
        self._client = client
        self._config = config or {}
        self._agent_registry: Dict[str, AgentMetadata] = {}

    @abstractmethod
    def instrument(self, target: Any) -> Any:
        """
        Attach monitoring hooks to the target framework object.
        Returns the instrumented object (may be the same object or a wrapper).
        """
        pass

    @abstractmethod
    def extract_agent_metadata(self, framework_obj: Any) -> AgentMetadata:
        """
        Extract agent identity and metadata from a framework-specific object.
        Called once per new agent encountered.
        """
        pass

    def emit(self, event: OAVEvent) -> None:
        """Send a normalized event to the OAV client for batching and transmission."""
        self._client.emit(event)

    def register_agent(self, metadata: AgentMetadata) -> None:
        """Register a new agent in the local cache and remote registry."""
        self._agent_registry[metadata.agent_id] = metadata
        self._client.register_agent(metadata)

    @abstractmethod
    def get_framework_name(self) -> str:
        """Return the framework identifier string (e.g., 'langchain', 'crewai')."""
        pass

    @abstractmethod
    def get_supported_versions(self) -> str:
        """Return semver range of supported framework versions (e.g., '>=0.3.0,<1.0.0')."""
        pass

    def on_shutdown(self) -> None:
        """Called when the OAV client is shutting down. Clean up hooks."""
        pass
```

### 8.2 Writing a Custom Adapter

To support a new agent framework, implement the `OAVAdapter` interface:

```python
from openagentvisualizer.adapters import OAVAdapter
from openagentvisualizer.schema import OAVEvent, AgentMetadata
import my_custom_framework

class MyFrameworkAdapter(OAVAdapter):
    def get_framework_name(self) -> str:
        return "my_framework"

    def get_supported_versions(self) -> str:
        return ">=1.0.0,<3.0.0"

    def instrument(self, agent: my_custom_framework.Agent) -> my_custom_framework.Agent:
        metadata = self.extract_agent_metadata(agent)
        self.register_agent(metadata)

        original_run = agent.run

        async def wrapped_run(*args, **kwargs):
            self.emit(OAVEvent(
                event_type="agent.task.started",
                agent_id=metadata.agent_id,
                data={"task_name": str(args[0]) if args else "unknown"}
            ))
            try:
                result = await original_run(*args, **kwargs)
                self.emit(OAVEvent(
                    event_type="agent.task.completed",
                    agent_id=metadata.agent_id,
                    data={"result_summary": str(result)[:200]}
                ))
                return result
            except Exception as e:
                self.emit(OAVEvent(
                    event_type="agent.error",
                    agent_id=metadata.agent_id,
                    data={"error_type": type(e).__name__, "message": str(e)}
                ))
                raise

        agent.run = wrapped_run
        return agent

    def extract_agent_metadata(self, agent: my_custom_framework.Agent) -> AgentMetadata:
        return AgentMetadata(
            agent_id=f"myfw-{agent.name}-{id(agent)}",
            name=agent.name,
            role=getattr(agent, 'role', 'unknown'),
            framework="my_framework",
            model=getattr(agent, 'model_name', 'unknown')
        )
```

**Register the custom adapter for auto-detection:**

```python
from openagentvisualizer import register_adapter

register_adapter(
    framework_module="my_custom_framework",
    adapter_class=MyFrameworkAdapter,
    auto_detect=True  # Enable auto-instrumentation detection
)
```

### 8.3 Event Normalization Layer

The normalization layer sits between adapters and the transport, ensuring all events conform to the canonical OAV schema regardless of source:

```
Framework-specific event
        │
        ▼
┌─────────────────────┐
│   Adapter            │  Framework-specific -> OAVEvent
│   (per-framework)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Normalizer         │  Ensures required fields, computes derived fields
│                      │  - Assigns event_id (dedup key)
│                      │  - Assigns seq from monotonic clock
│                      │  - Computes cost from token counts + model pricing
│                      │  - Applies PII redaction if enabled
│                      │  - Validates against JSON schema
│                      │  - Truncates oversized fields
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Transport Buffer   │  Ring buffer -> batch -> compress -> send
└─────────────────────┘
```

**Normalization Rules:**

| Rule | Action | Reason |
|------|--------|--------|
| Missing `timestamp` | Set to `time.time_ns()` | Every event must be time-ordered |
| Missing `agent_id` | Reject event with warning | Cannot route unidentified events |
| Missing `session_id` | Generate from current context | Session grouping for replay |
| `cost_usd` not set but tokens present | Compute from pricing table | Cost attribution requires USD values |
| Content fields > 10 KB | Truncate with `[truncated]` marker | Prevent memory bloat |
| PII detected (email, phone, SSN) | Replace with `[REDACTED]` | GDPR/privacy compliance |
| Unknown `event_type` | Pass through with `custom.` prefix | Extensibility for custom events |

### 8.4 Framework Version Compatibility Matrix

| Framework | Minimum Version | Maximum Tested | Auto-Instrument | Notes |
|-----------|----------------|---------------|----------------|-------|
| LangChain | 0.3.0 | 0.5.x | Yes | Callback API stable since 0.3 |
| LangGraph | 0.2.0 | 0.4.x | Yes | Requires LangChain >=0.3.0 |
| CrewAI | 0.80.0 | 0.110.x | Yes | Callback API changed in 0.80 |
| AutoGen | 0.4.0 | 0.6.x | Yes | Post-AG2 fork supported |
| OpenAI Python SDK | 1.0.0 | 1.60.x | Yes | Streaming API stable since 1.0 |
| Anthropic Python SDK | 0.30.0 | 0.50.x | Yes | Tool use API stable since 0.30 |
| Ollama Python | 0.3.0 | 0.5.x | Yes | Chat API |
| HuggingFace Transformers | 4.35.0 | 4.48.x | Yes | Callback API required |
| OpenAI Node SDK | 4.0.0 | 4.80.x | Yes | Streaming support |
| Anthropic Node SDK | 0.30.0 | 0.50.x | Yes | Tool use support |
| Vercel AI SDK | 3.0.0 | 4.x | Yes | generateText/streamText |
| LangChain.js | 0.3.0 | 0.5.x | Yes | Callback system |

Adapters are tested against the minimum and maximum versions in CI. When a new framework version is released, the compatibility matrix is updated within 5 business days.

---

## 9. Security Model

### 9.1 API Key Management

**Key Format:** `oav_{environment}_{32_random_alphanumeric}`
- `oav_live_abc123...` — Production key
- `oav_test_xyz789...` — Test/development key (events stored separately, 24h retention)

**Key Properties:**
- Generated via cryptographically secure random bytes (`secrets.token_urlsafe(32)`)
- Stored as bcrypt hash in the database; the raw key is shown once at creation and never stored
- Scoped to a single tenant
- Support for key rotation: two active keys per tenant at any time (old key valid for 24h after new key created)
- Rate-limited per key: 10,000 events/second per key (configurable per plan)

**Key Permissions:**

| Permission | Description | Default |
|-----------|-------------|---------|
| `events:write` | Emit events via SDK/API | Yes |
| `agents:register` | Register new agents | Yes |
| `agents:read` | Query agent registry | Yes |
| `agents:command` | Send commands to agents (kill, pause) | No |
| `replay:read` | Access session replays | Yes |
| `admin:manage` | Manage keys, team members, billing | No |

### 9.2 Agent Authentication

Agents authenticate via the API key embedded in the SDK configuration. The ingestion gateway validates the key on every request (cached in Redis for 60 seconds to avoid database lookups on every event).

**Agent Identity Verification:**
- Each agent's `agent_id` is bound to the tenant on first registration
- If an `agent_id` is seen from a different tenant, the event is rejected with a `403 Forbidden`
- Agent IDs are immutable after creation; to change an agent's identity, create a new registration

### 9.3 Data Encryption

| Path | Encryption | Method |
|------|-----------|--------|
| SDK to Ingestion Gateway | In transit | TLS 1.3 (mandatory) |
| Ingestion Gateway to Redis | In transit | TLS (Redis 6+ native TLS) |
| Redis to TimescaleDB | In transit | TLS |
| TimescaleDB at rest | At rest | AES-256 (transparent data encryption) |
| S3 Cold Storage | At rest | AES-256 (S3 SSE-S3 or SSE-KMS) |
| API Key storage | At rest | bcrypt (cost factor 12) |
| WebSocket to Browser | In transit | WSS (WebSocket over TLS) |

### 9.4 PII Detection and Masking

The SDK and ingestion gateway both apply PII detection before events are stored:

**SDK-Side (Pre-Transmission):**
- Regex-based detection for emails, phone numbers, SSNs, credit card numbers
- Configurable: `pii_redaction=True` (default) in SDK init
- Content fields (message content, tool inputs/outputs) are scanned
- Detected PII is replaced with `[REDACTED:{type}]` (e.g., `[REDACTED:email]`)

**Server-Side (Post-Ingestion):**
- Secondary scan using a trained NER model for names, addresses, and medical terms
- Runs asynchronously; does not block event processing
- If PII is detected server-side that was missed by the SDK, the stored event is updated in-place
- Audit log entry created for every PII redaction

**Configurable Allow-Lists:**
- Tenants can configure fields that should never be redacted (e.g., agent names that look like emails)
- Tenants can configure additional patterns to redact (e.g., internal project codes)

### 9.5 RBAC for Agent Access

| Role | View Agents | View Events | View Replays | Manage Agents | Manage Team | Manage Billing |
|------|------------|-------------|-------------|--------------|------------|---------------|
| **Viewer** | Yes | Yes | Yes | No | No | No |
| **Engineer** | Yes | Yes | Yes | Yes | No | No |
| **Admin** | Yes | Yes | Yes | Yes | Yes | No |
| **Owner** | Yes | Yes | Yes | Yes | Yes | Yes |

**Workspace-Level Isolation:**
- A tenant can create multiple workspaces (e.g., "Production", "Staging", "Dev")
- Each workspace has its own agent registry and event stream
- Users can be assigned different roles per workspace (e.g., Engineer in Production, Admin in Dev)

---

## 10. Performance & Scalability

### 10.1 Target Performance Envelope

| Metric | Target | Architecture Approach |
|--------|--------|----------------------|
| Concurrent agents | 10,000 | Horizontal WebSocket servers, Redis fan-out |
| Events per second (ingest) | 100,000 | Partitioned Redis Streams, multiple gateway instances |
| Events per second (per tenant) | 10,000 | Per-tenant rate limiting and stream partitioning |
| Event ingestion latency (p99) | < 100ms | In-memory processing, async writes |
| WebSocket delivery latency (p99) | < 200ms | Redis pub/sub, co-located WebSocket servers |
| Dashboard load time | < 2 seconds | Pre-computed aggregates, CDN-cached static assets |
| Replay startup time | < 3 seconds | Time-series index on TimescaleDB, chunked streaming |
| API query response (p99) | < 500ms | PostgreSQL indexes, Redis caching |

### 10.2 Connection Pooling Strategy

```
                    ┌──────────────────────┐
                    │   Load Balancer       │
                    │   (HAProxy/nginx)     │
                    │   - Sticky sessions   │
                    │     (by tenant_id)    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼────────┐ ┌────▼──────────┐
     │ WS Server 1   │ │ WS Server 2   │ │ WS Server N   │
     │ ~5,000 conns  │ │ ~5,000 conns  │ │ ~5,000 conns  │
     │               │ │               │ │               │
     │ Redis Pool:   │ │ Redis Pool:   │ │ Redis Pool:   │
     │  20 conns     │ │  20 conns     │ │  20 conns     │
     │               │ │               │ │               │
     │ DB Pool:      │ │ DB Pool:      │ │ DB Pool:      │
     │  10 conns     │ │  10 conns     │ │  10 conns     │
     └───────────────┘ └───────────────┘ └───────────────┘
```

**Connection Pool Sizes:**

| Resource | Pool Size Per Server | Max Total (10 servers) | Rationale |
|----------|---------------------|----------------------|-----------|
| Redis | 20 connections | 200 | Redis handles 100K+ ops/sec per conn |
| TimescaleDB | 10 connections | 100 | Write-heavy; batch inserts reduce conn pressure |
| S3 | HTTP connection pool: 50 | 500 | Async uploads, high concurrency |
| WebSocket (clients) | 5,000 per server | 50,000 | Practical limit per process; scale horizontally |

### 10.3 Event Sampling for High-Volume Scenarios

When agent density exceeds comfortable rendering thresholds, sampling is applied at multiple levels:

**SDK-Level Sampling (Configurable):**

```python
oav.init(
    api_key="...",
    sample_rate=0.5,           # Sample 50% of non-critical events
    always_sample=[            # These event types are never sampled
        "agent.lifecycle",
        "agent.anomaly",
        "agent.error",
        "agent.task.completed",
        "agent.task.failed"
    ]
)
```

**Server-Level Adaptive Sampling:**

The aggregation engine monitors ingest rate per tenant and activates sampling tiers:

| Ingest Rate | Sampling Strategy |
|------------|-------------------|
| < 1,000 events/sec | No sampling (100% retention) |
| 1,000 - 5,000 events/sec | Progress/streaming events sampled at 50% |
| 5,000 - 20,000 events/sec | Progress at 10%, LLM streaming at 25% |
| > 20,000 events/sec | Only state changes, errors, and completions at 100%; all else at 5% |

**Frontend-Level LOD (Level of Detail):**

The PixiJS renderer applies LOD based on viewport:
- **Full detail:** Agents in viewport center (animation, trails, badges, metrics)
- **Medium detail:** Agents at viewport edges (simplified animation, no trails)
- **Low detail:** Off-screen agents (static dot, color indicates state)
- **Hidden:** Agents beyond 2x viewport distance (not rendered, only in data layer)

### 10.4 Storage Tiering (Hot / Warm / Cold)

| Tier | Storage | Retention | Query Latency | Data |
|------|---------|-----------|--------------|------|
| **Hot** | Redis Streams | 1 hour | < 10ms | Live events, recent state |
| **Warm** | TimescaleDB | 90 days (configurable) | < 500ms | Full event history, metrics |
| **Cold** | S3 / MinIO | Unlimited (per plan) | 1-5 seconds | Compressed event archives, replay data |

**Tiering Flow:**

```
Event ingested
    │
    ▼
Redis Stream (hot) ── 1 hour ──▶ TimescaleDB (warm) ── 90 days ──▶ S3 (cold)
                                     │
                                     ├── Continuous aggregation
                                     │   (1-min, 5-min, 1-hour rollups)
                                     │
                                     └── Hypertable compression
                                         (after 7 days, ~10x compression)
```

**TimescaleDB Configuration:**
- Hypertable chunk interval: 1 day
- Compression enabled after 7 days (reduces storage by 90%)
- Continuous aggregates for 1-minute, 5-minute, and 1-hour metric rollups
- Retention policy: automatic drop of chunks older than tenant's plan limit

---

## 11. Error Handling & Resilience

### 11.1 Circuit Breaker Pattern for Framework Connections

The SDK implements a circuit breaker for the connection to the OAV ingestion gateway:

```
        ┌──────────────┐
        │    CLOSED     │  Normal operation; events transmitted
        │  (healthy)    │
        └──────┬───────┘
               │
               │  5 consecutive failures within 60 seconds
               ▼
        ┌──────────────┐
        │     OPEN      │  Events buffered locally; no transmission
        │  (tripped)    │  attempted. Duration: 30 seconds.
        └──────┬───────┘
               │
               │  30 seconds elapsed
               ▼
        ┌──────────────┐
        │  HALF-OPEN    │  Single probe request sent
        │  (testing)    │  Success -> CLOSED / Failure -> OPEN
        └──────────────┘
```

**Circuit Breaker Configuration:**

```python
oav.init(
    api_key="...",
    circuit_breaker={
        "failure_threshold": 5,       # Failures before opening
        "failure_window_seconds": 60,  # Window for counting failures
        "open_duration_seconds": 30,   # Time in open state
        "half_open_max_requests": 1,   # Probe requests in half-open
    }
)
```

**Behavior During Open State:**
- Events continue to be buffered in the local ring buffer (capacity: 10,000 events)
- If buffer fills while circuit is open, oldest events are dropped (counter incremented)
- When circuit closes, buffered events are flushed in order
- Agent's local functionality is never impacted; the circuit breaker only affects observability transmission

### 11.2 Dead Letter Queue for Failed Events

Events that fail processing after 3 attempts are moved to a dead letter stream:

```
Redis Stream: "events:{tenant_id}"
    │
    │  Processing failure (3x)
    ▼
Redis Stream: "dlq:{tenant_id}"
    │
    │  Manual review / automated retry (hourly)
    ▼
TimescaleDB: "dead_letter_events" table
    │
    │  Dashboard: Admin can view, retry, or discard
```

**Common DLQ Reasons:**

| Reason | Frequency | Auto-Recovery |
|--------|-----------|--------------|
| Schema validation failure | Rare | No — requires SDK update |
| TimescaleDB write timeout | Occasional | Yes — hourly retry |
| Tenant quota exceeded | Common | Yes — after quota reset |
| Corrupted protobuf payload | Very rare | No — logged for investigation |

### 11.3 Retry Policies

| Component | Retry Strategy | Max Retries | Backoff |
|-----------|---------------|-------------|---------|
| **SDK -> Gateway** | Exponential backoff + jitter | 5 | 100ms, 200ms, 400ms, 800ms, 1600ms |
| **Gateway -> Redis** | Immediate retry | 3 | 10ms, 50ms, 100ms |
| **Redis -> TimescaleDB** | Exponential backoff | 5 | 500ms, 1s, 2s, 4s, 8s |
| **WebSocket reconnection** | Exponential backoff + jitter | 10 | 1s, 2s, 4s, 8s, 16s, 30s (max) |
| **SSE reconnection** | Browser-native (auto) | Unlimited | 3 seconds (browser default) |

**Jitter Formula:** `actual_delay = base_delay * (0.5 + random() * 0.5)`

This prevents thundering herd problems when many SDKs reconnect simultaneously after a gateway restart.

### 11.4 Graceful Degradation When Frameworks Are Unreachable

| Scenario | SDK Behavior | User Experience |
|----------|-------------|-----------------|
| OAV gateway unreachable | Buffer locally, circuit breaker opens | Agent runs normally; events delayed |
| Redis down | Gateway returns 503; SDK buffers | Events delayed; live view stale |
| TimescaleDB down | Events stay in Redis; persist writer retries | Live view works; history unavailable |
| WebSocket server down | Frontend reconnects; catches up via `seq` | Brief disconnect indicator; auto-reconnect |
| S3 down | Cold tier writes queued; warm tier extended | No impact on live features |
| Complete backend outage | SDK buffers up to 10K events; drops oldest after | Agent runs normally; observability paused |

**Golden Rule:** The SDK must never crash the agent it is monitoring. All SDK errors are caught, logged to stderr, and reported via the `on_error` callback. The instrumented agent's behavior is identical whether or not OAV is reachable.

---

## 12. API Contracts

### 12.1 REST API Endpoints (OpenAPI Summary)

**Base URL:** `https://api.openagentvisualizer.io/v1`
**Auth:** Bearer token (`Authorization: Bearer oav_live_...`)

#### Agent Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/agents` | List registered agents (filter by status, framework, role, tag) |
| `POST` | `/agents` | Register a new agent |
| `GET` | `/agents/{agent_id}` | Get agent details, stats, and health |
| `PATCH` | `/agents/{agent_id}` | Update agent metadata or config |
| `POST` | `/agents/{agent_id}/command` | Send command (kill, pause, resume, set_budget) |

#### Event Ingestion

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/events` | Ingest a single event |
| `POST` | `/events/batch` | Ingest up to 1,000 events in one request |

#### Traces & Replay

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/traces` | List traces (filter by agent, time range, errors, cost) |
| `GET` | `/traces/{trace_id}` | Get full trace with all spans |
| `GET` | `/traces/{trace_id}/replay` | Get ordered events for animated playback |

#### Metrics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/metrics/agents` | Aggregated agent metrics (tokens, cost, latency, errors) |
| `GET` | `/metrics/cost` | Cost breakdown by agent, model, team, time period |
| `GET` | `/metrics/topology` | Agent communication graph with edge weights |

#### Alerts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/alerts` | List active and recent alerts |
| `POST` | `/alerts/{alert_id}/acknowledge` | Acknowledge an alert |
| `POST` | `/alerts/{alert_id}/resolve` | Resolve an alert |

#### Streams

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/streams/metrics` | SSE stream of real-time metrics |
| `WS` | `/ws/live` | WebSocket for real-time agent events |

### 12.2 WebSocket Message Schemas

**Connection URL:** `wss://ws.openagentvisualizer.io/v1/live?token={api_key}`

**Client -> Server:**

```typescript
// Subscribe to agents
{ "type": "command.subscribe", "agents": ["agent_abc", "agent_def"] | "all" }

// Unsubscribe
{ "type": "command.unsubscribe", "agents": ["agent_abc"] }

// Send kill command to agent
{ "type": "command.kill_agent", "agent_id": "agent_abc" }

// Set event filter
{ "type": "command.set_filter", "filters": {
    "agents": ["agent_abc"],
    "event_types": ["agent.lifecycle", "agent.anomaly"],
    "min_severity": "warning"
  }
}

// Keepalive
{ "type": "ping", "ts": 1710590400000 }
```

**Server -> Client:**

```typescript
// Single event
{
  "type": "agent.event",
  "seq": 1042,
  "timestamp": "2026-03-16T10:30:00.000Z",
  "payload": {
    "event_type": "agent.lifecycle",
    "agent_id": "agent_abc123",
    "session_id": "session_xyz",
    "data": { "state": "working", "previous_state": "idle" }
  }
}

// Batched events (high-volume mode)
{
  "type": "agent.batch",
  "seq_start": 1042,
  "seq_end": 1091,
  "events": [ /* array of payload objects */ ]
}

// Full state sync (on connect/reconnect)
{
  "type": "agent.state_sync",
  "agents": [
    {
      "agent_id": "agent_abc123",
      "name": "Market Researcher",
      "role": "researcher",
      "framework": "crewai",
      "current_state": "working",
      "current_task": "Extract competitor pricing",
      "health": "healthy",
      "stats": { "xp": 8470, "level": 12, "tasks_completed": 847 }
    }
  ],
  "last_seq": 1041
}

// Health update
{
  "type": "agent.health",
  "agent_id": "agent_abc123",
  "status": "degraded",
  "details": { "error_rate_1h": 0.15, "consecutive_errors": 3 }
}

// System notification
{ "type": "system.sampling_active", "message": "High volume detected; sampling at 50%", "data": { "sample_rate": 0.5 } }

// Keepalive response
{ "type": "pong", "ts": 1710590400000, "server_ts": 1710590400005 }
```

### 12.3 SDK Public Interface

**Python SDK — Complete Public API:**

```python
# Module: openagentvisualizer

# --- Initialization ---
def init(api_key: str, endpoint: str = "...", transport: str = "grpc",
         mode: str = "hybrid", batch_size: int = 100, batch_interval_ms: int = 500,
         buffer_capacity: int = 10000, sample_rate: float = 1.0,
         auto_instrument: bool = True, pii_redaction: bool = True,
         debug: bool = False, tags: dict = None,
         on_error: Callable = None, circuit_breaker: dict = None) -> None

# --- Agent Registration ---
def register_agent(agent_id: str, name: str, role: str = "unknown",
                   framework: str = "custom", model: str = None,
                   capabilities: list = None, tags: dict = None,
                   config: dict = None, metadata: dict = None) -> AgentHandle

# --- Session Context ---
@contextmanager
def session(session_name: str, tags: dict = None) -> SessionContext

# --- Manual Event Emission ---
def emit(event: OAVEvent) -> None

# --- Shutdown ---
def shutdown(timeout_seconds: float = 5.0) -> None

# --- Custom Adapter Registration ---
def register_adapter(framework_module: str, adapter_class: type,
                     auto_detect: bool = True) -> None

# --- AgentHandle ---
class AgentHandle:
    def task(self, task_name: str, **kwargs) -> TaskContext
    def tool_call(self, tool_name: str, input: dict) -> ToolContext
    def set_state(self, state: str) -> None
    def log(self, message: str, level: str = "info") -> None
    def set_budget(self, budget_usd: float) -> None

# --- TaskContext (context manager) ---
class TaskContext:
    def progress(self, percent: int, message: str = "") -> None
    def complete(self, result: Any = None) -> None
    def fail(self, error: Exception) -> None

# --- ToolContext (context manager) ---
class ToolContext:
    def result(self, output: Any) -> None
    def error(self, error: Exception) -> None
```

### 12.4 Webhook Payload Format

For outbound alert notifications (Slack, PagerDuty, Discord, custom webhooks):

```json
{
  "webhook_version": "1.0",
  "event_id": "evt_abc123def456",
  "timestamp": "2026-03-16T10:31:00Z",
  "tenant_id": "tenant_001",
  "alert": {
    "alert_id": "alert_789",
    "type": "loop_detected",
    "severity": "critical",
    "agent_id": "agent_abc123",
    "agent_name": "Market Researcher",
    "message": "Agent 'Market Researcher' has looped 12 times on tool 'web_scraper'. Estimated wasted cost: $3.60. Threshold: 5 loops.",
    "data": {
      "loop_count": 12,
      "threshold": 5,
      "estimated_cost_usd": 3.60,
      "estimated_tokens": 12000,
      "tool_name": "web_scraper",
      "duration_seconds": 180,
      "trace_id": "0af7651916cd43dd8448eb211c80319c",
      "session_url": "https://app.openagentvisualizer.io/replay/0af7651916cd43dd8448eb211c80319c"
    }
  },
  "links": {
    "agent": "https://app.openagentvisualizer.io/agents/agent_abc123",
    "replay": "https://app.openagentvisualizer.io/replay/0af7651916cd43dd8448eb211c80319c",
    "dashboard": "https://app.openagentvisualizer.io/dashboard"
  }
}
```

**Webhook Security:**
- All outbound webhooks include an `X-OAV-Signature` header containing an HMAC-SHA256 signature of the payload body using the tenant's webhook secret
- Webhook endpoints must respond with 2xx within 10 seconds or the delivery is retried (3 attempts with exponential backoff)
- Failed webhook deliveries are logged and visible in the admin dashboard

---

## Appendix A: EU AI Act Article 72 Compliance Mapping

| Article 72 Requirement | OAV Feature |
|------------------------|-------------|
| Active collection of AI system performance data | Continuous event ingestion from all agent frameworks |
| Documentation of system behavior over lifetime | Append-only event log with configurable retention (unlimited on Enterprise) |
| Post-market monitoring plan | Alert engine with configurable thresholds, webhook notifications |
| Systematic reporting of serious incidents | Critical alert webhooks, audit log export (PDF/CSV) |
| Analysis of performance data | Aggregation engine, time-series metrics, agent comparison |
| Identification of risks that may emerge | Anomaly detection (loops, cost spikes, error cascades, hallucination flags) |
| Corrective actions when risks materialize | Agent command API (kill, pause), automatic budget enforcement |

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Adapter** | Framework-specific code that translates proprietary events to OAV schema |
| **Agent** | An AI agent instance (LangChain agent, CrewAI agent, etc.) being monitored |
| **Event** | A single immutable record of an agent action |
| **Session** | A logical grouping of events representing one complete agent workflow execution |
| **Span** | An OTel span representing a single operation with start/end times |
| **Trace** | A tree of spans sharing a trace ID; one complete execution flow |
| **Tenant** | An organization account; the unit of data isolation |
| **DLQ** | Dead letter queue; storage for events that failed processing |
| **LOD** | Level of detail; rendering optimization for the PixiJS world canvas |
| **OTLP** | OpenTelemetry Protocol; the wire format for event transmission |

---

*Document produced by Agentic AI Solution Architect Agent — Stage 1.3*
*Date: March 16, 2026*
*Status: Complete*
