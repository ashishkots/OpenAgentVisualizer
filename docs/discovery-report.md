# Discovery Report: OpenAgentVisualizer

## Product Summary
- **Name**: OpenAgentVisualizer
- **Tagline**: Gamified Virtual World for AI Agent Management
- **Type**: Real-time animated AI agent observability and gamification platform (SaaS)
- **Target Users**: AI/ML engineers, team leads, and product managers who want visual, gamified monitoring of AI agent teams in production
- **Discovery Date**: 2026-03-20

## Current State Assessment

### Tech Stack (Confirmed)
- **Backend**: Python 3.12 / FastAPI 0.110.3 / SQLAlchemy 2.0.31 (async) / Alembic 1.13.2
- **Frontend**: React 18.3 / TypeScript 5.4 / Vite 5.3 / Tailwind CSS 3.4
- **Rendering**: PixiJS 8.1 (@pixi/react 7.1) + Rive Canvas 2.21 + GSAP 3.12
- **State Management**: XState 5.13 (agent FSMs) + Zustand 4.5 (UI state)
- **Database**: PostgreSQL 16 + TimescaleDB (via asyncpg 0.29.0) + Redis 5.0.7 (Streams + Pub/Sub)
- **Task Queue**: Celery 5.4.0 (with Redis broker)
- **Real-time**: WebSocket (via FastAPI) + Redis Pub/Sub
- **OTLP**: opentelemetry-proto 1.24.0, protobuf 4.25.3, grpcio 1.64.1
- **Infrastructure**: Docker Compose (144 lines, local dev)
- **Key Backend Libraries**: bcrypt 4.0.1 (correctly pinned), email-validator 2.2.0, orjson, uuid7, python-dateutil, celery
- **Key Frontend Libraries**: React Query 5.45, ReactFlow 11.11, Recharts, Axios, date-fns, Vitest + Testing Library (test infrastructure present)
- **SDK**: Python SDK with adapters for LangChain, CrewAI, AutoGen, OpenAI, Anthropic + OTLP and REST exporters

### Existing Assets
- **Pipeline Docs**: Product_Documents/PIPELINE.md (6-wave, 14-agent pipeline); no agents/PIPELINE.md in standard location
- **Source Code**: Backend: ~50+ Python files; Frontend: 6 pages + PixiJS canvas + state machines + stores; SDK: 15+ Python files with adapters
- **Backend Routers**: 11 (auth, agents, events, otlp_receiver, websocket, sessions, metrics, alerts, gamification, spans, __init__)
- **Models**: 6 (agent, audit, event, gamification, metrics, user)
- **Services**: event_pipeline, cost_service, websocket_manager, gamification_service, loop_detector, otlp_service + background tasks
- **Backend Tests**: 13 test files (test_events, test_websocket, test_otlp_service, test_gamification, test_models, test_config, test_loop_detector, test_security, test_agents, test_alerts, test_auth, test_metrics, test_sessions)
- **SDK Tests**: 5 test files (test_tracer, test_ring_buffer, test_pii_redactor, test_otlp_exporter, test_langchain_adapter)
- **Frontend Tests**: Vitest configured with Testing Library; __tests__ directories in canvas and stores
- **Alembic Migrations**: 2 (001_initial_schema, 002_timescale_hypertables)
- **Handoffs**: Located in Product_Documents/agents/handoffs/ (non-standard path)
- **E2E Tests**: 1 (tests/e2e_smoke.py)
- **Other Docs**: Product_Documents/ with 14 agent subdirectories (PM, UX, UI, Gamification Expert, Motion Graphics, Infographics, Visualization Expert, Solution Architect, Agentic AI Architect, Frontend Expert, Backend Expert, Fullstack Expert, QA Expert, Design System); superpowers plans for UI/UX revamp, CLI integration, 3D viewer

### Key Features Implemented
- OTLP event ingestion (gRPC:4317 / HTTP:4318 receiver)
- Real-time WebSocket push to frontend
- PixiJS-based virtual world canvas with agent avatars
- XState finite state machines for agent state transitions
- Gamification engine (XP, leveling, achievements via gamification_service)
- Loop detection with automatic alerts
- Cost tracking per agent
- Session management
- Metrics aggregation and dashboard
- Alert management
- PII redaction in SDK pipeline
- Ring buffer for event batching in SDK
- Multi-framework SDK adapters (LangChain, CrewAI, AutoGen, OpenAI, Anthropic)
- Seed default user on startup (correctly implemented)
- Redis Streams for event pipeline
- Celery background tasks
- Frontend pages: Login, Dashboard, Virtual World, Alerts, Replay, Settings

### Gaps & Missing Pieces
- No MAL (Model Abstraction Layer) -- this product does not use AI models for its own features (it observes agents that use them)
- Pipeline docs are in Product_Documents/ not agents/ (non-standard location for the Open* suite)
- No standard agents/TEAM.md, agents/HANDOFF.md, agents/PERMISSIONS.md, agents/TOOLS.md
- Rive animation files (.riv) not present yet (animation spec exists in docs but no assets)
- No Tone.js audio integration yet (listed in tech stack)
- No leaderboard implementation visible in routers
- No quest/daily challenge system implemented
- No virtual economy (coins, avatar customization) implemented
- No session replay page connected to backend replay service
- Frontend package-lock.json not committed (npm install needed per CLAUDE.md known fix)
- No Apache ECharts integration yet (referenced for 10M+ data points)
- No Cytoscape.js integration yet (referenced for scale graph viz)

## Recommendations
- **Immediate Priority**: Add standard agents/ pipeline docs (PIPELINE.md, TEAM.md, etc.) or create symlinks from Product_Documents/; add Rive .riv animation assets for agent avatars; connect session replay frontend to backend
- **Architecture Notes**: Most mature codebase of all surveyed products -- correctly pins bcrypt==4.0.1, has email-validator==2.2.0, implements seed_default_user(), has 2 Alembic migrations including TimescaleDB hypertables, has test infrastructure on all 3 layers (backend, SDK, frontend), and has a working SDK with real framework adapters. The PixiJS + XState + Rive architecture is well-suited for the virtual world concept. OTLP integration via opentelemetry-proto is production-grade.
- **Risk Areas**: Gamification features beyond basic XP (leaderboards, quests, virtual economy) are described in product docs but not implemented; Rive animations require .riv asset files that do not exist yet; the virtual world rendering at scale (50+ agents at 60fps) is untested; TimescaleDB dependency adds operational complexity
