# OpenAgentVisualizer — Product Context

## Product Identity
- **Name:** OpenAgentVisualizer
- **Domain:** Gamified AI Agent Observability & Management
- **Tagline:** "Gamified Virtual World for AI Agent Management"

## What OpenAgentVisualizer Does

OpenAgentVisualizer is a real-time animated observability and gamification platform for AI agent teams. It transforms the traditionally dry experience of monitoring multi-agent systems into an immersive, gamified virtual world where agents are represented as animated avatars with real-time state visualization.

Key capabilities:

- **Virtual World Canvas** — PixiJS-powered 2D canvas displaying agent avatars in a gamified virtual world. Agents appear as animated sprites with visual state indicators (idle, active, waiting, error, complete). Canvas renders 50+ agents at 60fps with zoom, pan, and click-to-inspect interactions.
- **Real-Time Agent State Visualization** — XState finite state machines drive agent avatar animations. State transitions are animated via GSAP and Rive, providing immediate visual feedback when agents start, wait, fail, or complete tasks.
- **OTLP Event Ingestion** — OpenTelemetry-native event ingestion via gRPC (port 4317) and HTTP (port 4318). Spans from any OTLP-compatible source are transformed into visual events on the canvas.
- **Gamification Engine** — XP accumulation, leveling, and achievements for agent performance. Agents earn XP for successful task completions, and teams can track agent performance through gamified metrics.
- **Agent Loop Detection** — Automatic detection of agent loops with configurable thresholds. Alerts fire when agents enter repetitive patterns, preventing runaway costs.
- **Cost Tracking** — Per-agent cost attribution based on token consumption and API call data from ingested spans.
- **Session Replay** — Historical event replay with timeline scrubbing, allowing engineers to step through past agent interactions for debugging.
- **Real-Time Dashboard** — Metrics aggregation and visualization using Recharts, showing agent activity, cost trends, error rates, and gamification leaderboards.
- **Multi-Framework SDK** — Python SDK with adapters for LangChain, CrewAI, AutoGen, OpenAI, and Anthropic, enabling any agent framework to emit events to the visualizer.

## Feature Boundaries
- **OWNS:** Virtual world canvas (PixiJS), agent avatar rendering, XState FSMs, GSAP/Rive animations, gamification engine (XP, levels, achievements), OTLP ingestion, real-time WebSocket push, Redis Streams event pipeline, loop detection, cost tracking, session replay, metrics dashboard, alert management, multi-framework Python SDK
- **DELEGATES TO OpenTrace:** Deep distributed tracing infrastructure, trace storage at scale, trace querying and analysis
- **DELEGATES TO OpenHandoff:** Human approval workflows, escalation routing, kill switch functionality
- **DELEGATES TO OpenMind:** Long-term agent memory, knowledge graph for agent relationships

## Target Users

- **AI/ML engineers** monitoring production multi-agent systems who want real-time visual feedback on agent behavior
- **Team leads** who want gamified performance tracking for their AI agent teams
- **Product managers** who need intuitive dashboards to understand agent workflow health without reading logs
- **On-call engineers** debugging agent issues who need session replay to understand what happened
- **Platform engineers** with agents in LangChain/CrewAI/AutoGen/OpenAI who want observability without changing their framework

## Key Technical Challenges

- **Canvas rendering at scale** — PixiJS must render 50+ animated agent sprites at 60fps with GSAP animations, requiring efficient sprite batching, culling, and memory management
- **Real-time event pipeline latency** — Events must flow from OTLP ingestion through Redis Streams, Celery processing, and WebSocket delivery to the canvas within 2 seconds end-to-end
- **XState FSM memory management** — Each agent gets its own XState machine instance; 50+ concurrent machines must not leak memory on agent disconnect/reconnect
- **Rive animation assets** — .riv files for agent avatars need to be created and loaded efficiently; fallback to GSAP animations when Rive assets unavailable
- **TimescaleDB operational complexity** — Hypertable management for time-series event data adds operational overhead
- **SDK adapter compatibility** — Five different agent frameworks (LangChain, CrewAI, AutoGen, OpenAI, Anthropic) have different APIs for intercepting agent actions

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Rendering:** PixiJS 8.1 (@pixi/react) + Rive Canvas + GSAP 3.12
- **State Machines:** XState 5.13 (agent FSMs) + Zustand (UI state)
- **Backend:** Python 3.12 / FastAPI / SQLAlchemy 2.0 (async) / Alembic
- **Database:** PostgreSQL 16 + TimescaleDB (time-series events) + Redis (Streams + Pub/Sub)
- **Task Queue:** Celery 5.4 (Redis broker)
- **Real-time:** WebSocket (FastAPI) + Redis Pub/Sub
- **OTLP:** opentelemetry-proto + protobuf + grpcio
- **Infrastructure:** Docker Compose (local dev)
- **SDK:** Python with LangChain, CrewAI, AutoGen, OpenAI, Anthropic adapters

## Cross-Product Dependencies

| Product | Relationship | Integration |
|---------|-------------|-------------|
| **OpenTrace** | Complementary | OpenAgentVisualizer provides gamified visual layer; OpenTrace provides deep tracing infrastructure. OAV can forward events to OpenTrace for persistent storage and analysis |
| **OpenHandoff** | API consumer | OAV can invoke OpenHandoff when agent alerts require human intervention or approval workflows |
| **OpenMind** | API consumer | OAV can use OpenMind for long-term agent performance memory and knowledge graph of agent relationships |

## AI Platform Support

OpenAgentVisualizer does not use AI models for its own features — it observes agents that use them. The SDK adapters support:

### Supported Frameworks
| Framework | Adapter |
|-----------|---------|
| LangChain | `langchain_adapter.py` |
| CrewAI | `crewai_adapter.py` |
| AutoGen | `autogen_adapter.py` |
| OpenAI | `openai_adapter.py` |
| Anthropic | `anthropic_adapter.py` |

### Ingestion Methods
- **OTLP gRPC:** Port 4317 for high-throughput span ingestion
- **OTLP HTTP:** Port 4318 for environments where gRPC is not available
- **REST API:** Direct event submission via backend API
- **Python SDK:** Drop-in adapters for supported frameworks
