# OpenAgentVisualizer -- System Architecture Document

**Stage:** 4.1 -- Solution Architect
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** Solution Architect Agent
**Depends On:** PRD (Stage 1.1), Agent Integration Architecture (Stage 1.3), Gamification System Design (Stage 1.2), UX Design Spec (Stage 2.1), Design System Spec (Stage 3.3)
**Feeds Into:** Frontend Expert (2.2a), Backend Expert (2.2b), Code Reviewer (2.3), QA Engineer (2.4), DevOps (Convergence)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Database Schema](#4-database-schema)
5. [API Design](#5-api-design)
6. [Real-Time Architecture](#6-real-time-architecture)
7. [Event Processing Pipeline](#7-event-processing-pipeline)
8. [Caching Strategy](#8-caching-strategy)
9. [Security Architecture](#9-security-architecture)
10. [Scalability and Performance](#10-scalability-and-performance)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Migration Strategy](#13-migration-strategy)
14. [Technical Risks and Mitigations](#14-technical-risks-and-mitigations)

---

## 1. Architecture Overview

### 1.1 High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            AGENT EXECUTION ENVIRONMENTS                          │
│                                                                                  │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐ │
│   │ LangChain │ │  CrewAI   │ │  AutoGen  │ │  OpenAI   │ │ Claude / Ollama / │ │
│   │ LangGraph │ │           │ │           │ │ Assistants│ │ HuggingFace       │ │
│   └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └────────┬──────────┘ │
│         └──────────────┴──────────────┴──────┬──────┴────────────────┘            │
│                                              │                                    │
│                              ┌───────────────▼────────────────┐                  │
│                              │   OpenAgentVisualizer SDK       │                  │
│                              │  (Python / Node.js / REST)      │                  │
│                              └───────────────┬────────────────┘                  │
└──────────────────────────────────────────────┼───────────────────────────────────┘
                                               │
                          OTLP gRPC:4317 / HTTP:4318 / REST:443
                                               │
┌──────────────────────────────────────────────┼───────────────────────────────────┐
│                         BACKEND SERVICES CLUSTER                                  │
│                                              │                                    │
│  ┌───────────────────────────────────────────▼──────────────────────────────────┐ │
│  │                        NGINX REVERSE PROXY (:80/:443)                        │ │
│  │   /api/* → FastAPI    /ws/* → WebSocket    /otlp/* → OTLP Gateway           │ │
│  └──────┬──────────────────────┬─────────────────────────┬─────────────────────┘ │
│         │                      │                         │                        │
│  ┌──────▼──────┐   ┌──────────▼──────────┐   ┌──────────▼──────────┐            │
│  │  FastAPI    │   │  WebSocket Server   │   │  OTLP Ingestion    │            │
│  │  REST API   │   │  (uvicorn ws)       │   │  Gateway           │            │
│  │  (:8000)    │   │  (:8001)            │   │  (:4317/:4318)     │            │
│  └──────┬──────┘   └──────────┬──────────┘   └──────────┬──────────┘            │
│         │                      │                         │                        │
│         └──────────────────────┴─────────────┬───────────┘                        │
│                                              │                                    │
│  ┌───────────────────────────────────────────▼──────────────────────────────────┐ │
│  │                           REDIS (Event Bus + Cache)                           │ │
│  │                                                                               │ │
│  │   Streams: event ingestion    Pub/Sub: live fanout    Cache: sessions/queries │ │
│  └──────┬──────────────┬──────────────────────┬─────────────────────────────────┘ │
│         │              │                      │                                    │
│  ┌──────▼──────┐ ┌─────▼──────────┐  ┌───────▼──────────┐                       │
│  │  Persist    │ │  Aggregation   │  │  Celery Workers  │                       │
│  │  Writer     │ │  Engine        │  │  (async tasks)   │                       │
│  │  (consumer) │ │  (consumer)    │  │                  │                       │
│  └──────┬──────┘ └─────┬──────────┘  └───────┬──────────┘                       │
│         │              │                      │                                    │
│  ┌──────▼──────────────▼──────────────────────▼─────────────────────────────────┐ │
│  │                     DATA LAYER                                                │ │
│  │   ┌──────────────────────┐  ┌─────────────────┐  ┌──────────────────────┐    │ │
│  │   │ PostgreSQL 16        │  │ TimescaleDB     │  │ Redis               │    │ │
│  │   │ + TimescaleDB ext    │  │ (hypertables)   │  │ (cache + sessions)  │    │ │
│  │   │                      │  │                 │  │                      │    │ │
│  │   │ users, workspaces,   │  │ events, spans,  │  │ session tokens,     │    │ │
│  │   │ agents, tasks,       │  │ metrics_raw,    │  │ query cache,        │    │ │
│  │   │ achievements, alerts │  │ metrics_agg     │  │ computed metrics,   │    │ │
│  │   │ api_keys, audit_log  │  │                 │  │ leaderboard cache   │    │ │
│  │   └──────────────────────┘  └─────────────────┘  └──────────────────────┘    │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                WebSocket / SSE / HTTPS
                                               │
┌──────────────────────────────────────────────▼───────────────────────────────────┐
│                              FRONTEND (Browser)                                   │
│                                                                                   │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │ PixiJS v8   │  │ XState v5   │  │ Zustand      │  │ TanStack Query       │  │
│   │ World Canvas│  │ Actor Model │  │ UI State     │  │ Server State         │  │
│   │ (WebGL)     │  │ (per agent) │  │              │  │                      │  │
│   └─────────────┘  └─────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                                   │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │ Rive        │  │ React Flow  │  │ Recharts /   │  │ GSAP                 │  │
│   │ (avatars)   │  │ (topology)  │  │ ECharts      │  │ (transitions)        │  │
│   └─────────────┘  └─────────────┘  └──────────────┘  └──────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Style

OpenAgentVisualizer follows an **event-driven microservices architecture** with the following characteristics:

**Event Sourcing:** Every agent action is an immutable event appended to a time-ordered log. Current state is derived from replaying events. This enables session replay, time-travel debugging, and EU AI Act Article 72 compliance audit trails.

**CQRS (Command Query Responsibility Segregation):** Write operations (event ingestion) flow through Redis Streams to the Persist Writer. Read operations (dashboard queries, agent state) are served from materialized views and Redis cache. This separates the hot write path from the read path, allowing independent scaling.

**Actor Model on Frontend:** Each AI agent maps 1:1 to an XState v5 actor in the browser. The actor's state machine mirrors the agent's lifecycle (spawned, idle, working, completed, error, terminated). WebSocket events drive state transitions. The PixiJS world canvas renders the current state of all actors.

**Push-First with Backpressure:** Agents push events to the ingestion gateway. When saturated, the gateway signals the SDK to buffer locally and reduce transmission frequency. This prevents data loss without blocking agent execution.

### 1.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary protocol | OTLP (OpenTelemetry) | Industry standard, interoperable with Jaeger/Grafana/Datadog; GenAI semantic conventions adopted |
| Event bus | Redis Streams | Low latency (<1ms), built-in consumer groups, persistence, simpler than Kafka for initial scale |
| Time-series storage | TimescaleDB | Native PostgreSQL extension, hypertable compression, continuous aggregates, no separate infrastructure |
| Frontend rendering | PixiJS v8 WebGL | 60fps with 100+ agents, GPU-accelerated, mature ecosystem, pixi-react bindings available |
| State management | XState v5 actors + Zustand | XState for per-agent lifecycle FSM; Zustand for global UI state; clean separation of concerns |
| Avatar animation | Rive | State-machine-driven animations, tiny file size (~5KB per avatar), 120fps on mobile, runtime state blending |
| Real-time transport | WebSocket + SSE | WebSocket for bidirectional agent events; SSE for unidirectional metric streams; graceful fallback |
| Auth strategy | JWT + bcrypt + OAuth2 | Stateless JWT for API; bcrypt 4.0.1 for password hashing; OAuth2 for GitHub/Google; optional SAML for enterprise |
| Database | PostgreSQL 16 | Single database engine with TimescaleDB extension; reduces operational complexity vs. separate TSDB |
| Task queue | Celery + Redis broker | Mature Python ecosystem, retry policies, task chaining, beat scheduler for periodic gamification tasks |
| CSS framework | Tailwind CSS | Utility-first, design token integration, tree-shakeable, consistent with Design System Spec |

---

## 2. Technology Stack

### 2.1 Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 18.x | Component architecture, concurrent rendering |
| Language | TypeScript | 5.4+ | Type safety across entire frontend |
| Build | Vite | 5.x | Fast HMR, ESBuild bundling, optimized production builds |
| World Canvas | PixiJS | v8.x | WebGL-rendered 2D virtual world with 60fps target |
| React-Pixi Bridge | @pixi/react | 8.x | Declarative React components for PixiJS scenes |
| Agent Avatars | Rive | 2.x | State-machine-driven animations (idle, working, error, etc.) |
| Agent State Machines | XState | v5.x | Per-agent actor model with inspect API feeding PixiJS |
| Global State | Zustand | 4.x | Lightweight global UI state (sidebar, modals, preferences) |
| Server State | TanStack Query | v5.x | Caching, deduplication, background refetch for REST API calls |
| Topology View | React Flow | 12.x | Node-edge graph visualization for agent relationships |
| Standard Charts | Recharts | 2.x | Dashboard metric charts (line, bar, area, sparklines) |
| Heavy Data Charts | Apache ECharts | 5.x | High-density time-series charts with 100K+ data points |
| Animation Library | GSAP | 3.x | DOM transitions, UI motion, celebration animations |
| CSS | Tailwind CSS | 3.x | Utility-first styling with design token integration |
| Router | React Router | 6.x | Client-side routing with lazy-loaded route components |
| WebSocket Client | Native WebSocket | -- | Wrapped in reconnecting client with exponential backoff |
| Date/Time | date-fns | 3.x | Lightweight date formatting and manipulation |
| Forms | React Hook Form | 7.x | Performant form handling with Zod validation |
| Schema Validation | Zod | 3.x | Runtime type validation for API responses and forms |

### 2.2 Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | FastAPI | 0.110+ | Async REST API, WebSocket, OpenAPI auto-documentation |
| Language | Python | 3.12 | Performance improvements, type hints, pattern matching |
| ORM | SQLAlchemy | 2.0 | Async ORM with typed models, relationship loading |
| Migrations | Alembic | 1.13+ | Schema versioning with auto-generation support |
| Cache / Pub-Sub | Redis | 7.2+ | Event bus (Streams), cache (string/hash), pub/sub (WebSocket fanout) |
| Task Queue | Celery | 5.4+ | Async background tasks, periodic beats, retry policies |
| ASGI Server | Uvicorn | 0.29+ | High-performance ASGI server with HTTP/2 support |
| Password Hashing | bcrypt | 4.0.1 | Pinned version for passlib 1.7.4 compatibility |
| JWT | python-jose | 3.3+ | JWT token encoding/decoding with RS256 support |
| Validation | Pydantic | 2.x | Request/response schema validation, settings management |
| Email Validation | email-validator | 2.2.0 | RFC-compliant email validation |
| HTTP Client | httpx | 0.27+ | Async HTTP client for external API calls |
| OTLP Protocol | opentelemetry-proto | 1.24+ | Protobuf definitions for OTLP ingestion |
| Protobuf | protobuf | 4.x | Binary serialization for OTLP messages |
| Testing | pytest + pytest-asyncio | 8.x | Async test runner with fixtures |

### 2.3 Database

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Primary Database | PostgreSQL | 16.x | Relational data (users, agents, tasks, achievements) |
| Time-Series Extension | TimescaleDB | 2.14+ | Hypertables for events, spans, metrics; continuous aggregates |
| Cache Layer | Redis | 7.2+ | Session cache, query cache, computed metric cache, leaderboard cache |
| Connection Pooling | asyncpg | 0.29+ | Async PostgreSQL driver with built-in connection pooling |

### 2.4 Real-Time

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Agent Events | WebSocket (FastAPI) | Bidirectional real-time agent state updates, task assignments |
| Metric Streams | Server-Sent Events | Unidirectional dashboard metric feeds |
| Event Bus | Redis Streams | Event ordering, consumer groups, persistence |
| Fan-out | Redis Pub/Sub | Distribute WebSocket messages to all connected clients |
| Heartbeat | WebSocket ping/pong | Connection health detection, 30-second interval |

### 2.5 Authentication

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Session Tokens | JWT (HS256/RS256) | Stateless API authentication, 15-min access + 7-day refresh |
| Password Storage | bcrypt 4.0.1 | Argon2-equivalent security, passlib-compatible |
| OAuth2 Providers | Google, GitHub | Social login with PKCE flow |
| Enterprise SSO | SAML 2.0 (optional) | Okta, Azure AD, Google Workspace integration |
| API Keys | Prefixed tokens (`oav_live_*`, `oav_test_*`) | SDK authentication, per-workspace scoping |

### 2.6 Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Service isolation, reproducible builds |
| Orchestration | Docker Compose | Local development and single-node deployment |
| Reverse Proxy | Nginx | TLS termination, routing, static file serving, WebSocket upgrade |
| CI/CD | GitHub Actions | Build, test, lint, deploy (workflow_dispatch only) |
| Monitoring | Prometheus + Grafana | Internal service metrics and dashboards |
| Logging | Structured JSON (stdout) | Container-native log aggregation |

---

## 3. System Architecture Diagram

### 3.1 Detailed Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NGINX (:80/:443)                                │
│                                                                              │
│  location /api/        → upstream fastapi_backend (port 8000)               │
│  location /ws/         → upstream websocket_server (port 8001)              │
│  location /otlp/       → upstream otlp_gateway    (port 4318)              │
│  location /            → upstream frontend_spa     (port 3000)              │
│  location /static/     → direct file serving from /var/www/static/          │
└──────────┬──────────┬──────────┬──────────┬─────────────────────────────────┘
           │          │          │          │
    ┌──────▼──┐ ┌─────▼────┐ ┌──▼───────┐ ┌▼──────────┐
    │ FastAPI │ │WebSocket │ │  OTLP    │ │ Frontend  │
    │  REST   │ │ Server   │ │ Gateway  │ │ Dev Server│
    │  API    │ │          │ │          │ │ (Vite)    │
    │ :8000   │ │ :8001    │ │ :4318    │ │ :3000     │
    └────┬────┘ └────┬─────┘ └────┬─────┘ └───────────┘
         │           │            │
         │    ┌──────▼────────────▼─────────────────────────────┐
         │    │                REDIS 7.2 (:6379)                 │
         │    │                                                   │
         │    │  ┌─────────────────────────────────────────────┐ │
         │    │  │ STREAMS                                      │ │
         │    │  │  oav:events:{tenant_id}  — raw event ingest │ │
         │    │  │  oav:deadletter          — failed events    │ │
         │    │  └─────────────────────────────────────────────┘ │
         │    │                                                   │
         │    │  ┌─────────────────────────────────────────────┐ │
         │    │  │ PUB/SUB                                      │ │
         │    │  │  oav:ws:{workspace_id}  — WebSocket fanout  │ │
         │    │  │  oav:alerts:{workspace}  — alert broadcasts │ │
         │    │  └─────────────────────────────────────────────┘ │
         │    │                                                   │
         │    │  ┌─────────────────────────────────────────────┐ │
         │    │  │ CACHE (key-value)                            │ │
         │    │  │  session:{token}         — JWT blocklist     │ │
         │    │  │  agent_state:{agent_id}  — latest state     │ │
         │    │  │  metrics:{workspace}:{key} — computed vals  │ │
         │    │  │  leaderboard:{scope}:{window} — rankings    │ │
         │    │  │  rate_limit:{api_key}    — request counters │ │
         │    │  └─────────────────────────────────────────────┘ │
         │    └───────────────────────────────────────────────────┘
         │                    │            │           │
         │         ┌──────────▼──┐  ┌──────▼────┐  ┌──▼──────────────┐
         │         │  Persist    │  │ Aggregation│  │ Celery Workers  │
         │         │  Writer     │  │ Engine     │  │ (x2 default)    │
         │         │  (stream    │  │ (stream    │  │                  │
         │         │   consumer) │  │  consumer) │  │ Tasks:           │
         │         └──────┬──────┘  └──────┬─────┘  │ - quest_generate │
         │                │                │         │ - leaderboard_calc│
         │                │                │         │ - achievement_eval│
         │                │                │         │ - report_generate │
         │                │                │         │ - alert_evaluate  │
         │                │                │         │ - replay_export   │
         │                │                │         └──────┬────────────┘
         │                │                │                │
    ┌────▼────────────────▼────────────────▼────────────────▼──────────────────┐
    │                      POSTGRESQL 16 + TimescaleDB (:5432)                  │
    │                                                                           │
    │   STANDARD TABLES              HYPERTABLES (TimescaleDB)                 │
    │   ┌─────────────────┐          ┌──────────────────────────────┐          │
    │   │ users            │          │ events          (time-part) │          │
    │   │ workspaces       │          │ spans           (time-part) │          │
    │   │ workspace_members│          │ metrics_raw     (time-part) │          │
    │   │ agents           │          │ metrics_aggregated          │          │
    │   │ agent_sessions   │          └──────────────────────────────┘          │
    │   │ tasks            │                                                    │
    │   │ task_assignments │          CONTINUOUS AGGREGATES                     │
    │   │ task_results     │          ┌──────────────────────────────┐          │
    │   │ achievements     │          │ metrics_1min                  │          │
    │   │ user_achievements│          │ metrics_1hour                 │          │
    │   │ xp_ledger        │          │ metrics_1day                  │          │
    │   │ leaderboard_snap │          │ agent_daily_summary           │          │
    │   │ alerts           │          └──────────────────────────────┘          │
    │   │ alert_rules      │                                                    │
    │   │ notifications    │                                                    │
    │   │ api_keys         │                                                    │
    │   │ audit_log        │                                                    │
    │   └─────────────────┘                                                    │
    └───────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend Component Architecture

```
App.tsx
├── AuthProvider (JWT context, refresh token rotation)
├── WebSocketProvider (connection lifecycle, reconnection)
├── QueryClientProvider (TanStack Query)
├── ThemeProvider (dark/light/professional mode)
│
├── Layout
│   ├── TopBar (workspace selector, global cost counter, alerts, user menu)
│   ├── LeftSidebar (navigation: World, Dashboard, Tasks, Alerts, Replay, Settings)
│   ├── MainContent (route-based)
│   │   ├── WorldPage
│   │   │   ├── PixiApplication (pixi-react)
│   │   │   │   ├── WorldViewport (pan, zoom, culling)
│   │   │   │   ├── AgentSprite[] (Rive avatar + status ring + XP bar)
│   │   │   │   ├── TaskObject[] (animated task cards)
│   │   │   │   ├── ConnectionLine[] (agent-to-agent animated lines)
│   │   │   │   ├── ParticleEffects (XP gain, level-up, completion bursts)
│   │   │   │   └── Minimap
│   │   │   ├── AgentDetailPanel (slide-in right panel)
│   │   │   └── ActivityFeed (real-time event stream)
│   │   │
│   │   ├── DashboardPage
│   │   │   ├── WorkspaceOverview (summary cards with sparklines)
│   │   │   ├── AgentGrid (agent cards with key metrics)
│   │   │   └── AgentDashboard (single-agent deep dive: tabs)
│   │   │       ├── OverviewTab (metrics grid, trend chart, activity timeline)
│   │   │       ├── TasksTab (sortable filterable table)
│   │   │       ├── TracesTab (session list with waterfall drill-down)
│   │   │       ├── CostTab (breakdown by model/task/time)
│   │   │       └── AchievementsTab (badge grid with progress)
│   │   │
│   │   ├── TasksPage (task queue with drag-and-drop assignment)
│   │   ├── AlertsPage (alert rules CRUD, alert history)
│   │   ├── ReplayPage (session list, timeline scrubber, playback controls)
│   │   ├── LeaderboardPage (time window tabs, ranking table)
│   │   ├── CostPage (cost attribution dashboard)
│   │   └── SettingsPage (workspace, team, integrations, gamification toggle)
│   │
│   └── CommandPalette (Cmd+K global search and action launcher)
│
└── XState Actor System
    ├── AgentActor[] (one per connected agent, FSM: spawned→idle→working→...)
    └── WorkspaceActor (workspace-level state: connection status, agent registry)
```

---

## 4. Database Schema

### 4.1 Core Tables

#### users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),           -- NULL for OAuth-only users
    display_name    VARCHAR(100) NOT NULL,
    avatar_url      VARCHAR(500),
    oauth_provider  VARCHAR(20),            -- 'google', 'github', NULL
    oauth_id        VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    preferences     JSONB NOT NULL DEFAULT '{}',  -- theme, gamification_mode, notifications
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,

    CONSTRAINT uq_oauth UNIQUE (oauth_provider, oauth_id)
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_oauth ON users (oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;
```

#### workspaces

```sql
CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier            VARCHAR(20) NOT NULL DEFAULT 'free',  -- free, pro, team, business, enterprise
    settings        JSONB NOT NULL DEFAULT '{}',
    gamification_enabled BOOLEAN NOT NULL DEFAULT true,
    professional_mode    BOOLEAN NOT NULL DEFAULT false,
    monthly_budget_usd   DECIMAL(10,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner ON workspaces (owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces (slug);
```

#### workspace_members

```sql
CREATE TABLE workspace_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer',  -- owner, admin, engineer, viewer
    invited_by      UUID REFERENCES users(id),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_wm_workspace ON workspace_members (workspace_id);
CREATE INDEX idx_wm_user ON workspace_members (user_id);
```

#### agents

```sql
CREATE TABLE agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_external_id VARCHAR(255) NOT NULL,  -- SDK-provided agent ID
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(100),              -- researcher, writer, reviewer, etc.
    framework       VARCHAR(50) NOT NULL,      -- langchain, crewai, autogen, openai, anthropic, custom
    model           VARCHAR(100),              -- gpt-4o, claude-sonnet-4-20250514, etc.
    avatar_config   JSONB NOT NULL DEFAULT '{}',  -- rive asset, color, accessories
    capabilities    TEXT[],
    tags            JSONB NOT NULL DEFAULT '{}',

    -- Gamification state (denormalized for read performance)
    xp_total        BIGINT NOT NULL DEFAULT 0,
    level           INTEGER NOT NULL DEFAULT 1,
    tier_name       VARCHAR(20) NOT NULL DEFAULT 'Rookie',
    streak_days     INTEGER NOT NULL DEFAULT 0,
    streak_start    DATE,

    -- Operational state
    current_state   VARCHAR(20) NOT NULL DEFAULT 'idle',  -- spawned, idle, working, completed, error, terminated
    last_heartbeat  TIMESTAMPTZ,
    total_tasks     INTEGER NOT NULL DEFAULT 0,
    total_cost_usd  DECIMAL(12,4) NOT NULL DEFAULT 0,
    total_tokens    BIGINT NOT NULL DEFAULT 0,
    total_errors    INTEGER NOT NULL DEFAULT 0,

    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_agent_external UNIQUE (workspace_id, agent_external_id)
);

CREATE INDEX idx_agents_workspace ON agents (workspace_id);
CREATE INDEX idx_agents_workspace_state ON agents (workspace_id, current_state);
CREATE INDEX idx_agents_framework ON agents (framework);
CREATE INDEX idx_agents_xp ON agents (workspace_id, xp_total DESC);
```

#### agent_sessions

```sql
CREATE TABLE agent_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    trace_id        VARCHAR(64) NOT NULL,     -- OpenTelemetry trace ID (hex)
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    duration_ms     INTEGER,
    total_tokens    INTEGER NOT NULL DEFAULT 0,
    total_cost_usd  DECIMAL(10,4) NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_failed    INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, completed, error, timeout

    CONSTRAINT uq_session_trace UNIQUE (trace_id)
);

CREATE INDEX idx_sessions_agent ON agent_sessions (agent_id, started_at DESC);
CREATE INDEX idx_sessions_workspace ON agent_sessions (workspace_id, started_at DESC);
CREATE INDEX idx_sessions_trace ON agent_sessions (trace_id);
```

#### agent_states (state change audit log)

```sql
CREATE TABLE agent_states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES agent_sessions(id),
    previous_state  VARCHAR(20) NOT NULL,
    new_state       VARCHAR(20) NOT NULL,
    trigger_event   VARCHAR(50) NOT NULL,
    event_data      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_states_agent ON agent_states (agent_id, created_at DESC);
```

### 4.2 Task Tables

#### tasks

```sql
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    external_task_id VARCHAR(255),             -- SDK-provided or null for UI-created
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    task_type       VARCHAR(100),              -- data_extraction, research, code_generation, etc.
    priority        VARCHAR(10) NOT NULL DEFAULT 'medium',  -- low, medium, high, critical
    complexity      VARCHAR(10),               -- trivial, low, medium, high, critical (auto-classified)
    complexity_score DECIMAL(5,2),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, assigned, in_progress, completed, failed, cancelled
    created_by_user UUID REFERENCES users(id),
    created_by_agent UUID REFERENCES agents(id),
    deadline        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_workspace ON tasks (workspace_id, status);
CREATE INDEX idx_tasks_status ON tasks (status, created_at DESC);
```

#### task_assignments

```sql
CREATE TABLE task_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES agent_sessions(id),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'assigned',  -- assigned, in_progress, completed, failed, delegated
    progress_pct    INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    delegated_to    UUID REFERENCES agents(id),

    CONSTRAINT uq_task_agent_active UNIQUE (task_id, agent_id, status)
);

CREATE INDEX idx_task_assign_agent ON task_assignments (agent_id, status);
CREATE INDEX idx_task_assign_task ON task_assignments (task_id);
```

#### task_results

```sql
CREATE TABLE task_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assignment_id   UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
    agent_id        UUID NOT NULL REFERENCES agents(id),
    result_data     JSONB,
    tokens_used     INTEGER NOT NULL DEFAULT 0,
    cost_usd        DECIMAL(10,4) NOT NULL DEFAULT 0,
    duration_ms     INTEGER NOT NULL DEFAULT 0,
    quality_score   DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1),
    error_count     INTEGER NOT NULL DEFAULT 0,
    retry_count     INTEGER NOT NULL DEFAULT 0,

    -- XP calculation inputs
    base_xp         INTEGER NOT NULL DEFAULT 0,
    quality_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    difficulty_modifier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    streak_bonus    DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    efficiency_xp   INTEGER NOT NULL DEFAULT 0,
    total_xp        INTEGER NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_results_agent ON task_results (agent_id, created_at DESC);
CREATE INDEX idx_task_results_task ON task_results (task_id);
```

### 4.3 Trace and Event Tables (TimescaleDB Hypertables)

#### events

```sql
CREATE TABLE events (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    agent_id        UUID NOT NULL,
    session_id      UUID,
    trace_id        VARCHAR(64) NOT NULL,
    span_id         VARCHAR(32) NOT NULL,
    parent_span_id  VARCHAR(32),
    event_type      VARCHAR(100) NOT NULL,     -- agent.lifecycle, agent.task, agent.communication, agent.resource, agent.anomaly
    event_action    VARCHAR(50),               -- started, completed, failed, message_sent, etc.
    severity        VARCHAR(10) DEFAULT 'info', -- info, warning, error, critical
    event_data      JSONB NOT NULL,
    resource_attrs  JSONB,                     -- OTel resource attributes
    span_attrs      JSONB,                     -- OTel span attributes
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('events', 'created_at',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => true
);

CREATE INDEX idx_events_workspace_time ON events (workspace_id, created_at DESC);
CREATE INDEX idx_events_agent_time ON events (agent_id, created_at DESC);
CREATE INDEX idx_events_trace ON events (trace_id, created_at);
CREATE INDEX idx_events_type ON events (event_type, created_at DESC);
CREATE INDEX idx_events_session ON events (session_id, created_at) WHERE session_id IS NOT NULL;
```

#### spans

```sql
CREATE TABLE spans (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    agent_id        UUID NOT NULL,
    session_id      UUID,
    trace_id        VARCHAR(64) NOT NULL,
    span_id         VARCHAR(32) NOT NULL,
    parent_span_id  VARCHAR(32),
    operation_name  VARCHAR(255) NOT NULL,     -- llm.chat, tool.web_search, task.execute, etc.
    span_kind       VARCHAR(20) NOT NULL,      -- internal, client, server, producer, consumer
    status_code     VARCHAR(10) NOT NULL DEFAULT 'ok',  -- ok, error, unset
    status_message  TEXT,

    -- Timing
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    duration_ms     INTEGER,

    -- GenAI attributes (denormalized for query performance)
    model           VARCHAR(100),
    input_tokens    INTEGER,
    output_tokens   INTEGER,
    cost_usd        DECIMAL(10,6),
    temperature     DECIMAL(3,2),

    -- Full attribute maps
    attributes      JSONB NOT NULL DEFAULT '{}',
    events_data     JSONB,                     -- span events (OTel events, not our events table)
    links           JSONB,                     -- span links to other traces

    PRIMARY KEY (id, start_time)
);

SELECT create_hypertable('spans', 'start_time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => true
);

CREATE INDEX idx_spans_trace ON spans (trace_id, start_time);
CREATE INDEX idx_spans_agent ON spans (agent_id, start_time DESC);
CREATE INDEX idx_spans_workspace ON spans (workspace_id, start_time DESC);
CREATE INDEX idx_spans_operation ON spans (operation_name, start_time DESC);
CREATE INDEX idx_spans_parent ON spans (parent_span_id, start_time) WHERE parent_span_id IS NOT NULL;
CREATE INDEX idx_spans_model ON spans (model, start_time DESC) WHERE model IS NOT NULL;
```

### 4.4 Metrics Tables (TimescaleDB Hypertables)

#### metrics_raw

```sql
CREATE TABLE metrics_raw (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    agent_id        UUID NOT NULL,
    metric_name     VARCHAR(100) NOT NULL,     -- oav_agent_tokens_total, oav_agent_cost_usd_total, etc.
    metric_type     VARCHAR(20) NOT NULL,       -- counter, gauge, histogram
    value           DOUBLE PRECISION NOT NULL,
    labels          JSONB NOT NULL DEFAULT '{}', -- {model: "gpt-4o", direction: "input"}
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, recorded_at)
);

SELECT create_hypertable('metrics_raw', 'recorded_at',
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => true
);

CREATE INDEX idx_metrics_raw_agent ON metrics_raw (agent_id, metric_name, recorded_at DESC);
CREATE INDEX idx_metrics_raw_workspace ON metrics_raw (workspace_id, metric_name, recorded_at DESC);
```

#### metrics_aggregated (TimescaleDB Continuous Aggregates)

```sql
-- 1-minute aggregates
CREATE MATERIALIZED VIEW metrics_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', recorded_at) AS bucket,
    workspace_id,
    agent_id,
    metric_name,
    COUNT(*)          AS sample_count,
    AVG(value)        AS avg_value,
    MIN(value)        AS min_value,
    MAX(value)        AS max_value,
    SUM(value)        AS sum_value
FROM metrics_raw
GROUP BY bucket, workspace_id, agent_id, metric_name
WITH NO DATA;

SELECT add_continuous_aggregate_policy('metrics_1min',
    start_offset    => INTERVAL '2 hours',
    end_offset      => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute'
);

-- 1-hour aggregates
CREATE MATERIALIZED VIEW metrics_1hour
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', bucket) AS bucket,
    workspace_id,
    agent_id,
    metric_name,
    SUM(sample_count) AS sample_count,
    AVG(avg_value)    AS avg_value,
    MIN(min_value)    AS min_value,
    MAX(max_value)    AS max_value,
    SUM(sum_value)    AS sum_value
FROM metrics_1min
GROUP BY time_bucket('1 hour', bucket), workspace_id, agent_id, metric_name
WITH NO DATA;

SELECT add_continuous_aggregate_policy('metrics_1hour',
    start_offset    => INTERVAL '2 days',
    end_offset      => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

-- 1-day aggregates
CREATE MATERIALIZED VIEW metrics_1day
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', bucket) AS bucket,
    workspace_id,
    agent_id,
    metric_name,
    SUM(sample_count) AS sample_count,
    AVG(avg_value)    AS avg_value,
    MIN(min_value)    AS min_value,
    MAX(max_value)    AS max_value,
    SUM(sum_value)    AS sum_value
FROM metrics_1hour
GROUP BY time_bucket('1 day', bucket), workspace_id, agent_id, metric_name
WITH NO DATA;

SELECT add_continuous_aggregate_policy('metrics_1day',
    start_offset    => INTERVAL '30 days',
    end_offset      => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day'
);

-- Agent daily summary (for leaderboard computation)
CREATE MATERIALIZED VIEW agent_daily_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', recorded_at) AS bucket,
    workspace_id,
    agent_id,
    SUM(CASE WHEN metric_name = 'oav_agent_tasks_total' AND labels->>'status' = 'completed' THEN value ELSE 0 END) AS tasks_completed,
    SUM(CASE WHEN metric_name = 'oav_agent_tasks_total' AND labels->>'status' = 'failed' THEN value ELSE 0 END) AS tasks_failed,
    SUM(CASE WHEN metric_name = 'oav_agent_cost_usd_total' THEN value ELSE 0 END) AS total_cost,
    SUM(CASE WHEN metric_name = 'oav_agent_tokens_total' THEN value ELSE 0 END) AS total_tokens,
    SUM(CASE WHEN metric_name = 'oav_agent_errors_total' THEN value ELSE 0 END) AS total_errors
FROM metrics_raw
GROUP BY bucket, workspace_id, agent_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('agent_daily_summary',
    start_offset    => INTERVAL '3 days',
    end_offset      => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day'
);
```

### 4.5 Gamification Tables

#### achievements

```sql
CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    category        VARCHAR(20) NOT NULL,      -- productivity, quality, reliability, collaboration, milestone, secret
    criteria        JSONB NOT NULL,            -- machine-readable unlock conditions
    xp_reward       INTEGER NOT NULL,
    rarity_tier     VARCHAR(15) NOT NULL,      -- common, uncommon, rare, epic, legendary
    icon_name       VARCHAR(50) NOT NULL,
    is_secret       BOOLEAN NOT NULL DEFAULT false,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements (category);
```

#### user_achievements (agent achievements)

```sql
CREATE TABLE user_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    achievement_id  UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress_data   JSONB,                    -- snapshot of progress at unlock time
    is_pinned       BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_agent_achievement UNIQUE (agent_id, achievement_id)
);

CREATE INDEX idx_user_achievements_agent ON user_achievements (agent_id);
CREATE INDEX idx_user_achievements_time ON user_achievements (unlocked_at DESC);
```

#### xp_ledger

```sql
CREATE TABLE xp_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_type     VARCHAR(30) NOT NULL,      -- task_completion, quality_bonus, efficiency_bonus, uptime, achievement, quest, weekly_bonus
    source_id       UUID,                      -- FK to task_results.id, achievement_id, quest_id, etc.
    xp_amount       INTEGER NOT NULL,
    xp_before       BIGINT NOT NULL,
    xp_after        BIGINT NOT NULL,
    level_before    INTEGER NOT NULL,
    level_after     INTEGER NOT NULL,
    breakdown       JSONB,                    -- {base: 40, quality_mult: 1.25, difficulty_mod: 1.0, streak: 1.05, efficiency: 15}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_ledger_agent ON xp_ledger (agent_id, created_at DESC);
CREATE INDEX idx_xp_ledger_workspace ON xp_ledger (workspace_id, created_at DESC);
CREATE INDEX idx_xp_ledger_source ON xp_ledger (source_type, created_at DESC);
```

#### leaderboard_snapshots

```sql
CREATE TABLE leaderboard_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    time_window     VARCHAR(10) NOT NULL,      -- daily, weekly, monthly, alltime
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,
    rankings        JSONB NOT NULL,            -- [{agent_id, rank, score, productivity, quality, efficiency, reliability}]
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_leaderboard_period UNIQUE (workspace_id, time_window, period_start)
);

CREATE INDEX idx_leaderboard_workspace ON leaderboard_snapshots (workspace_id, time_window, period_start DESC);
```

### 4.6 Alert and Notification Tables

#### alert_rules

```sql
CREATE TABLE alert_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    rule_type       VARCHAR(30) NOT NULL,      -- loop_detection, cost_threshold, error_rate, agent_offline, metric_threshold, anomaly
    conditions      JSONB NOT NULL,            -- {metric: "error_rate", operator: ">", threshold: 0.1, window_minutes: 15}
    severity        VARCHAR(10) NOT NULL DEFAULT 'warning',  -- info, warning, error, critical
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    cooldown_minutes INTEGER NOT NULL DEFAULT 15,
    notification_channels JSONB NOT NULL DEFAULT '[]',  -- [{type: "webhook", url: "..."}, {type: "slack", channel: "#alerts"}]
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_workspace ON alert_rules (workspace_id, is_enabled);
```

#### alerts

```sql
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    rule_id         UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
    alert_type      VARCHAR(30) NOT NULL,
    severity        VARCHAR(10) NOT NULL,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    alert_data      JSONB NOT NULL,            -- full context: metric values, thresholds, affected resources
    status          VARCHAR(20) NOT NULL DEFAULT 'firing',  -- firing, acknowledged, resolved, suppressed
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_workspace ON alerts (workspace_id, status, created_at DESC);
CREATE INDEX idx_alerts_agent ON alerts (agent_id, created_at DESC) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_alerts_status ON alerts (status, created_at DESC);
```

#### notifications

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL for broadcast
    notification_type VARCHAR(30) NOT NULL,     -- alert, achievement, level_up, quest_complete, system
    title           VARCHAR(200) NOT NULL,
    body            TEXT,
    payload         JSONB,                     -- {entity_type: "agent", entity_id: "...", action_url: "/..."}
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_workspace ON notifications (workspace_id, created_at DESC);
```

### 4.7 API Key and Audit Tables

#### api_keys

```sql
CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(100) NOT NULL,
    key_prefix      VARCHAR(12) NOT NULL,      -- oav_live_ or oav_test_
    key_hash        VARCHAR(255) NOT NULL,     -- SHA-256 hash of full key
    scopes          TEXT[] NOT NULL DEFAULT ARRAY['ingest', 'read'],  -- ingest, read, write, admin
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_workspace ON api_keys (workspace_id, is_active);
CREATE INDEX idx_api_keys_prefix ON api_keys (key_prefix);
CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys (key_hash);
```

#### audit_log

```sql
CREATE TABLE audit_log (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    actor_type      VARCHAR(10) NOT NULL,      -- user, agent, system
    actor_id        UUID NOT NULL,
    action          VARCHAR(100) NOT NULL,     -- agent.registered, task.created, alert.acknowledged, etc.
    resource_type   VARCHAR(50) NOT NULL,      -- agent, task, alert, workspace, api_key
    resource_id     UUID,
    before_state    JSONB,
    after_state     JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('audit_log', 'created_at',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => true
);

CREATE INDEX idx_audit_workspace ON audit_log (workspace_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log (actor_type, actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log (resource_type, resource_id, created_at DESC);
```

### 4.8 Data Retention and Partitioning Strategy

| Table | Retention Policy | Compression | Partitioning |
|-------|-----------------|-------------|--------------|
| events | 90 days (free), 1 year (pro), 2 years (enterprise) | TimescaleDB native compression after 7 days | Daily chunks by `created_at` |
| spans | 90 days (free), 1 year (pro), 2 years (enterprise) | TimescaleDB native compression after 7 days | Daily chunks by `start_time` |
| metrics_raw | 7 days (auto-rolled into aggregates) | Hourly chunks, compressed after 1 day | Hourly chunks by `recorded_at` |
| metrics_1min | 30 days | Compressed after 7 days | Auto-managed by continuous aggregate |
| metrics_1hour | 1 year | Compressed after 30 days | Auto-managed by continuous aggregate |
| metrics_1day | Indefinite | None needed (small volume) | Auto-managed by continuous aggregate |
| audit_log | 1 year (minimum), configurable up to 7 years | Compressed after 30 days | Weekly chunks by `created_at` |
| xp_ledger | Indefinite | None (low volume) | Standard table |
| leaderboard_snapshots | Indefinite | None (low volume) | Standard table |

```sql
-- Retention policies
SELECT add_retention_policy('events', INTERVAL '90 days');
SELECT add_retention_policy('spans', INTERVAL '90 days');
SELECT add_retention_policy('metrics_raw', INTERVAL '7 days');
SELECT add_retention_policy('audit_log', INTERVAL '1 year');

-- Compression policies
ALTER TABLE events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'workspace_id, agent_id',
    timescaledb.compress_orderby = 'created_at DESC'
);
SELECT add_compression_policy('events', INTERVAL '7 days');

ALTER TABLE spans SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'workspace_id, agent_id',
    timescaledb.compress_orderby = 'start_time DESC'
);
SELECT add_compression_policy('spans', INTERVAL '7 days');

ALTER TABLE metrics_raw SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'workspace_id, agent_id, metric_name',
    timescaledb.compress_orderby = 'recorded_at DESC'
);
SELECT add_compression_policy('metrics_raw', INTERVAL '1 day');
```

---

## 5. API Design

### 5.1 Authentication Endpoints

#### POST /api/v1/auth/register

Register a new user account.

```
Request:
{
    "email": "string (required, valid email)",
    "password": "string (required, min 8 chars)",
    "display_name": "string (required, max 100 chars)"
}

Response 201:
{
    "user": {
        "id": "uuid",
        "email": "string",
        "display_name": "string",
        "created_at": "datetime"
    },
    "workspace": {
        "id": "uuid",
        "name": "My Workspace",
        "slug": "my-workspace"
    },
    "api_key": {
        "key": "oav_live_xxxxxxxxxxxxxxxxxxxx",
        "name": "Default Key"
    },
    "tokens": {
        "access_token": "jwt_string",
        "refresh_token": "jwt_string",
        "token_type": "Bearer",
        "expires_in": 900
    }
}

Auth: None
Rate Limit: 5 requests/minute per IP
```

#### POST /api/v1/auth/login

Authenticate with email and password.

```
Request:
{
    "email": "string",
    "password": "string"
}

Response 200:
{
    "user": { "id": "uuid", "email": "string", "display_name": "string" },
    "tokens": {
        "access_token": "jwt_string",
        "refresh_token": "jwt_string",
        "token_type": "Bearer",
        "expires_in": 900
    }
}

Auth: None
Rate Limit: 10 requests/minute per IP (lockout after 5 failures for 15 minutes)
```

#### POST /api/v1/auth/refresh

Refresh an expired access token.

```
Request:
{
    "refresh_token": "string"
}

Response 200:
{
    "access_token": "jwt_string",
    "refresh_token": "jwt_string (rotated)",
    "token_type": "Bearer",
    "expires_in": 900
}

Auth: Valid refresh token
Rate Limit: 30 requests/minute
```

#### GET /api/v1/auth/oauth/{provider}/callback

OAuth2 callback handler for Google and GitHub.

```
Query Parameters:
    code: "string (authorization code)"
    state: "string (CSRF token)"

Response 302: Redirect to frontend with tokens in URL fragment

Providers: google, github
Auth: None
```

### 5.2 Agent Endpoints

#### POST /api/v1/agents

Register a new agent in the workspace.

```
Request:
{
    "agent_external_id": "string (required, unique per workspace)",
    "name": "string (required)",
    "role": "string (optional)",
    "framework": "string (required: langchain|crewai|autogen|openai|anthropic|ollama|huggingface|custom)",
    "model": "string (optional)",
    "capabilities": ["string"],
    "tags": {}
}

Response 201:
{
    "id": "uuid",
    "agent_external_id": "string",
    "name": "string",
    "role": "string",
    "framework": "string",
    "model": "string",
    "current_state": "idle",
    "xp_total": 0,
    "level": 1,
    "tier_name": "Rookie",
    "created_at": "datetime"
}

Auth: API Key (scope: ingest) or JWT
Rate Limit: 100 requests/minute
```

#### GET /api/v1/agents

List all agents in the workspace.

```
Query Parameters:
    state: "string (filter by current_state)"
    framework: "string"
    sort: "string (xp_total|level|total_tasks|total_cost|created_at)"
    order: "asc|desc (default: desc)"
    page: "int (default: 1)"
    page_size: "int (default: 50, max: 100)"

Response 200:
{
    "agents": [{ ...agent_object }],
    "total": 42,
    "page": 1,
    "page_size": 50
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### GET /api/v1/agents/{agent_id}

Get agent details including current state, metrics, and recent activity.

```
Response 200:
{
    "id": "uuid",
    "agent_external_id": "string",
    "name": "string",
    "role": "string",
    "framework": "string",
    "model": "string",
    "current_state": "working",
    "xp_total": 4200,
    "level": 12,
    "tier_name": "Expert",
    "streak_days": 23,
    "total_tasks": 847,
    "total_cost_usd": 15.42,
    "total_tokens": 1200000,
    "total_errors": 14,
    "avatar_config": {},
    "achievements": [{ "id": "uuid", "name": "string", "unlocked_at": "datetime" }],
    "recent_activity": [{ "event_type": "string", "timestamp": "datetime", "summary": "string" }],
    "created_at": "datetime",
    "last_heartbeat": "datetime"
}

Auth: JWT (role: viewer+)
Rate Limit: 120 requests/minute
```

#### PUT /api/v1/agents/{agent_id}

Update agent configuration (name, role, avatar, tags).

```
Request:
{
    "name": "string (optional)",
    "role": "string (optional)",
    "avatar_config": "{} (optional)",
    "tags": "{} (optional)"
}

Response 200: { ...updated_agent_object }

Auth: JWT (role: engineer+)
Rate Limit: 30 requests/minute
```

#### POST /api/v1/agents/{agent_id}/heartbeat

Agent heartbeat for health monitoring. SDK sends this every 30 seconds.

```
Request:
{
    "state": "string (current agent state)",
    "session_id": "uuid (optional)",
    "metrics": {
        "tokens_used": "int",
        "cost_usd": "float",
        "tasks_in_progress": "int"
    }
}

Response 200:
{
    "acknowledged": true,
    "server_time": "datetime",
    "commands": []   -- future: server-initiated commands (kill, pause, config update)
}

Auth: API Key (scope: ingest)
Rate Limit: 200 requests/minute
```

#### POST /api/v1/agents/{agent_id}/state

Update agent state (triggered by SDK on state transitions).

```
Request:
{
    "new_state": "string (spawned|idle|working|completed|error|terminated)",
    "trigger": "string (task_assigned|task_completed|error|recovered|shutdown)",
    "session_id": "uuid (optional)",
    "event_data": "{} (optional)"
}

Response 200:
{
    "previous_state": "idle",
    "new_state": "working",
    "transition_recorded": true
}

Auth: API Key (scope: ingest)
Rate Limit: 500 requests/minute
```

### 5.3 Task Endpoints

#### POST /api/v1/tasks

Create a new task (from UI or SDK).

```
Request:
{
    "title": "string (required)",
    "description": "string (optional)",
    "task_type": "string (optional)",
    "priority": "low|medium|high|critical (default: medium)",
    "assigned_agent_id": "uuid (optional, auto-assign if null)",
    "deadline": "datetime (optional)",
    "external_task_id": "string (optional, for SDK-created tasks)"
}

Response 201:
{
    "id": "uuid",
    "title": "string",
    "status": "pending|assigned",
    "assigned_agent": { "id": "uuid", "name": "string" } | null,
    "created_at": "datetime"
}

Auth: JWT (role: engineer+) or API Key (scope: write)
Rate Limit: 100 requests/minute
```

#### GET /api/v1/tasks

List tasks with filtering and pagination.

```
Query Parameters:
    status: "pending|assigned|in_progress|completed|failed|cancelled"
    agent_id: "uuid"
    priority: "low|medium|high|critical"
    task_type: "string"
    date_from: "datetime"
    date_to: "datetime"
    sort: "created_at|priority|status"
    order: "asc|desc"
    page: "int"
    page_size: "int"

Response 200:
{
    "tasks": [{ ...task_object_with_assignment }],
    "total": 147,
    "page": 1,
    "page_size": 50
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### PUT /api/v1/tasks/{task_id}

Update task status, priority, or assignment.

```
Request:
{
    "status": "string (optional)",
    "priority": "string (optional)",
    "assigned_agent_id": "uuid (optional)"
}

Response 200: { ...updated_task_object }

Auth: JWT (role: engineer+) or API Key (scope: write)
Rate Limit: 60 requests/minute
```

#### POST /api/v1/tasks/{task_id}/result

Submit task result (from SDK when agent completes a task).

```
Request:
{
    "agent_id": "uuid (required)",
    "session_id": "uuid (optional)",
    "result_data": "{} (optional)",
    "tokens_used": "int",
    "cost_usd": "float",
    "duration_ms": "int",
    "quality_score": "float (0.0-1.0, optional)",
    "error_count": "int (default: 0)",
    "retry_count": "int (default: 0)"
}

Response 200:
{
    "task_result_id": "uuid",
    "xp_awarded": {
        "base_xp": 40,
        "quality_multiplier": 1.25,
        "difficulty_modifier": 1.0,
        "streak_bonus": 1.05,
        "efficiency_xp": 15,
        "total_xp": 67
    },
    "level_up": false,
    "achievements_unlocked": []
}

Auth: API Key (scope: ingest)
Rate Limit: 500 requests/minute
```

### 5.4 Trace and Span Endpoints

#### POST /api/v1/traces/ingest

Bulk ingest events and spans (used by SDK batch mode).

```
Request:
{
    "events": [{
        "event_type": "string",
        "agent_id": "string",
        "session_id": "string",
        "trace_id": "string",
        "span_id": "string",
        "parent_span_id": "string|null",
        "event_data": {},
        "timestamp": "datetime"
    }],
    "spans": [{
        "trace_id": "string",
        "span_id": "string",
        "parent_span_id": "string|null",
        "operation_name": "string",
        "span_kind": "string",
        "start_time": "datetime",
        "end_time": "datetime|null",
        "status_code": "ok|error|unset",
        "attributes": {}
    }]
}

Response 202:
{
    "accepted": true,
    "events_count": 15,
    "spans_count": 8,
    "processing_id": "uuid"
}

Auth: API Key (scope: ingest)
Rate Limit: 1000 requests/minute
```

#### GET /api/v1/traces

Query traces with filtering.

```
Query Parameters:
    agent_id: "uuid"
    status: "active|completed|error"
    date_from: "datetime"
    date_to: "datetime"
    min_duration_ms: "int"
    max_duration_ms: "int"
    min_cost_usd: "float"
    sort: "start_time|duration|cost"
    page: "int"
    page_size: "int"

Response 200:
{
    "traces": [{
        "trace_id": "string",
        "agent_id": "uuid",
        "agent_name": "string",
        "started_at": "datetime",
        "ended_at": "datetime",
        "duration_ms": 4500,
        "span_count": 12,
        "total_tokens": 3400,
        "total_cost_usd": 0.102,
        "status": "completed"
    }],
    "total": 234,
    "page": 1
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### GET /api/v1/traces/{trace_id}

Get full trace detail with span tree.

```
Response 200:
{
    "trace_id": "string",
    "agent_id": "uuid",
    "root_span": {
        "span_id": "string",
        "operation_name": "string",
        "start_time": "datetime",
        "end_time": "datetime",
        "duration_ms": 4500,
        "attributes": {},
        "children": [{ ...recursive_span_tree }]
    },
    "summary": {
        "total_spans": 12,
        "total_tokens": 3400,
        "total_cost_usd": 0.102,
        "models_used": ["gpt-4o"],
        "tools_invoked": ["web_search", "calculator"]
    }
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### GET /api/v1/traces/{trace_id}/events

Get all events for a trace (for replay).

```
Query Parameters:
    event_type: "string (filter)"

Response 200:
{
    "events": [{
        "event_type": "string",
        "event_action": "string",
        "timestamp": "datetime",
        "agent_id": "uuid",
        "event_data": {}
    }],
    "total": 45
}

Auth: JWT (role: viewer+)
Rate Limit: 30 requests/minute
```

### 5.5 Metrics Endpoints

#### GET /api/v1/metrics/query

Query metrics with aggregation.

```
Query Parameters:
    metric_name: "string (required)"
    agent_id: "uuid (optional, workspace-wide if omitted)"
    aggregation: "avg|sum|min|max|count"
    interval: "1m|5m|15m|1h|6h|1d"
    date_from: "datetime (required)"
    date_to: "datetime (required)"
    labels: "json (optional filter)"

Response 200:
{
    "metric_name": "oav_agent_tokens_total",
    "interval": "1h",
    "data_points": [
        { "timestamp": "datetime", "value": 12500 },
        { "timestamp": "datetime", "value": 15200 }
    ],
    "summary": {
        "total": 245000,
        "average": 10208,
        "min": 3400,
        "max": 28000
    }
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### GET /api/v1/metrics/realtime

Get current real-time metric values for the workspace.

```
Response 200:
{
    "workspace_id": "uuid",
    "timestamp": "datetime",
    "agents_active": 8,
    "agents_total": 12,
    "events_per_second": 45.2,
    "tasks_in_progress": 5,
    "tasks_completed_today": 147,
    "total_cost_today_usd": 4.72,
    "total_tokens_today": 890000,
    "error_rate_1h": 0.02
}

Auth: JWT (role: viewer+)
Rate Limit: 120 requests/minute
```

### 5.6 Gamification Endpoints

#### GET /api/v1/gamification/agents/{agent_id}/xp

Get XP history for an agent.

```
Query Parameters:
    date_from: "datetime"
    date_to: "datetime"
    source_type: "task_completion|quality_bonus|efficiency_bonus|uptime|achievement|quest"
    page: "int"
    page_size: "int"

Response 200:
{
    "agent_id": "uuid",
    "current_xp": 4200,
    "current_level": 12,
    "xp_to_next_level": 6310,
    "tier_name": "Expert",
    "entries": [{
        "source_type": "task_completion",
        "xp_amount": 67,
        "breakdown": { "base": 40, "quality_mult": 1.25, "difficulty_mod": 1.0, "streak": 1.05, "efficiency": 15 },
        "created_at": "datetime"
    }],
    "total": 234,
    "page": 1
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### GET /api/v1/gamification/agents/{agent_id}/achievements

Get achievements for an agent (earned and progress toward unearned).

```
Response 200:
{
    "earned": [{
        "id": "uuid",
        "name": "Century Club",
        "category": "productivity",
        "rarity_tier": "uncommon",
        "xp_reward": 500,
        "unlocked_at": "datetime",
        "is_pinned": true
    }],
    "in_progress": [{
        "id": "uuid",
        "name": "Thousand Strong",
        "category": "productivity",
        "rarity_tier": "rare",
        "progress": 0.847,
        "progress_label": "847/1000 tasks",
        "is_secret": false
    }],
    "total_earned": 15,
    "total_available": 38
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### GET /api/v1/gamification/leaderboard

Get workspace leaderboard.

```
Query Parameters:
    time_window: "daily|weekly|monthly|alltime (default: weekly)"
    category: "string (optional agent role filter)"
    scope: "individual|team"
    page: "int"
    page_size: "int (default: 10, max: 100)"

Response 200:
{
    "time_window": "weekly",
    "period_start": "datetime",
    "period_end": "datetime",
    "rankings": [{
        "rank": 1,
        "agent_id": "uuid",
        "agent_name": "ResearchAgent",
        "level": 12,
        "tier_name": "Expert",
        "score": 847,
        "productivity_score": 0.92,
        "quality_score": 0.88,
        "efficiency_score": 0.76,
        "reliability_score": 0.99,
        "rank_change": 2,
        "tasks_completed": 87,
        "total_cost_usd": 2.14
    }],
    "my_agents": [{ "agent_id": "uuid", "rank": 3, "score": 782 }],
    "total": 42
}

Auth: JWT (role: viewer+)
Rate Limit: 30 requests/minute
```

#### GET /api/v1/gamification/agents/{agent_id}/quests

Get active and available quests for an agent.

```
Response 200:
{
    "active": [{
        "id": "uuid",
        "type": "daily",
        "title": "Task Burst",
        "description": "Complete 25 tasks today",
        "progress": 0.64,
        "progress_label": "16/25 tasks",
        "xp_reward": 30,
        "expires_at": "datetime"
    }],
    "completed_today": [{
        "id": "uuid",
        "title": "Error-Free Day",
        "xp_awarded": 25,
        "completed_at": "datetime"
    }],
    "daily_bonus_eligible": false
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

### 5.7 Alert Endpoints

#### POST /api/v1/alerts/rules

Create an alert rule.

```
Request:
{
    "name": "string (required)",
    "description": "string (optional)",
    "rule_type": "loop_detection|cost_threshold|error_rate|agent_offline|metric_threshold|anomaly",
    "conditions": {
        "metric": "string",
        "operator": ">|<|>=|<=|==",
        "threshold": "float",
        "window_minutes": "int",
        "agent_id": "uuid (optional, all agents if null)"
    },
    "severity": "info|warning|error|critical",
    "cooldown_minutes": "int (default: 15)",
    "notification_channels": [{
        "type": "webhook|slack|discord|pagerduty|email",
        "config": {}
    }]
}

Response 201: { ...alert_rule_object }

Auth: JWT (role: admin+)
Rate Limit: 30 requests/minute
```

#### GET /api/v1/alerts/rules

List alert rules for the workspace.

```
Response 200:
{
    "rules": [{ ...alert_rule_object }],
    "total": 8
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### GET /api/v1/alerts

List fired alerts with filtering.

```
Query Parameters:
    status: "firing|acknowledged|resolved|suppressed"
    severity: "info|warning|error|critical"
    agent_id: "uuid"
    date_from: "datetime"
    date_to: "datetime"
    page: "int"
    page_size: "int"

Response 200:
{
    "alerts": [{ ...alert_object }],
    "total": 23,
    "page": 1
}

Auth: JWT (role: viewer+)
Rate Limit: 60 requests/minute
```

#### PUT /api/v1/alerts/{alert_id}/acknowledge

Acknowledge a firing alert.

```
Response 200:
{
    "id": "uuid",
    "status": "acknowledged",
    "acknowledged_by": "uuid",
    "acknowledged_at": "datetime"
}

Auth: JWT (role: engineer+)
Rate Limit: 30 requests/minute
```

### 5.8 WebSocket Endpoints

#### WS /ws/v1/workspace/{workspace_id}

Real-time event stream for a workspace.

```
Connection:
    Protocol: WebSocket
    Auth: JWT token in query parameter ?token=xxx or first message
    Heartbeat: ping/pong every 30 seconds

Server → Client Messages:
{
    "type": "agent.state_change",
    "agent_id": "uuid",
    "data": { "previous_state": "idle", "new_state": "working", "trigger": "task_assigned" },
    "timestamp": "datetime"
}

{
    "type": "agent.task_event",
    "agent_id": "uuid",
    "data": { "action": "completed", "task_id": "uuid", "xp_awarded": 67 },
    "timestamp": "datetime"
}

{
    "type": "agent.communication",
    "data": { "from_agent_id": "uuid", "to_agent_id": "uuid", "action": "handoff" },
    "timestamp": "datetime"
}

{
    "type": "alert.fired",
    "data": { "alert_id": "uuid", "type": "loop_detected", "agent_id": "uuid", "severity": "critical" },
    "timestamp": "datetime"
}

{
    "type": "gamification.xp_earned",
    "agent_id": "uuid",
    "data": { "xp_amount": 67, "source": "task_completion", "new_total": 4267 },
    "timestamp": "datetime"
}

{
    "type": "gamification.level_up",
    "agent_id": "uuid",
    "data": { "new_level": 13, "tier_name": "Expert" },
    "timestamp": "datetime"
}

{
    "type": "gamification.achievement_unlocked",
    "agent_id": "uuid",
    "data": { "achievement_name": "Century Club", "xp_reward": 500 },
    "timestamp": "datetime"
}

{
    "type": "metrics.update",
    "data": {
        "agents_active": 8,
        "events_per_second": 45.2,
        "total_cost_today_usd": 4.72
    },
    "timestamp": "datetime"
}

Client → Server Messages:
{
    "type": "subscribe",
    "channels": ["agent_events", "alerts", "gamification", "metrics"]
}

{
    "type": "unsubscribe",
    "channels": ["metrics"]
}

{
    "type": "agent.command",
    "agent_id": "uuid",
    "command": "kill"
}
```

### 5.9 OTLP Receiver Endpoints

#### POST /otlp/v1/traces (HTTP)

Receive OTLP trace data over HTTP.

```
Request:
    Content-Type: application/x-protobuf OR application/json
    Body: ExportTraceServiceRequest (protobuf or JSON)
    Headers:
        Authorization: Bearer oav_live_xxx
        Content-Encoding: gzip (optional)

Response 200:
{
    "partialSuccess": {
        "rejectedSpans": 0,
        "errorMessage": ""
    }
}

Auth: API Key (scope: ingest)
Rate Limit: 5000 requests/minute
Max Payload: 16 MB
```

#### gRPC :4317 — TraceService/Export

Receive OTLP trace data over gRPC.

```
Service: opentelemetry.proto.collector.trace.v1.TraceService
Method: Export
Request: ExportTraceServiceRequest
Response: ExportTraceServiceResponse
Auth: API Key in metadata (authorization header)
Compression: gzip, zstd
Max message size: 16 MB
```

### 5.10 Dashboard Endpoints

#### GET /api/v1/dashboard/overview

Get workspace overview dashboard data.

```
Response 200:
{
    "workspace_id": "uuid",
    "summary": {
        "total_agents": 12,
        "active_agents": 8,
        "tasks_today": 147,
        "tasks_completed_today": 132,
        "tasks_failed_today": 3,
        "total_cost_today_usd": 4.72,
        "total_tokens_today": 890000,
        "error_rate_24h": 0.022,
        "avg_latency_ms": 2300
    },
    "agents": [{
        "id": "uuid",
        "name": "string",
        "level": 12,
        "current_state": "working",
        "tasks_today": 47,
        "cost_today_usd": 0.84,
        "avg_latency_ms": 2300,
        "quality_avg": 0.92,
        "sparkline_tokens_24h": [1200, 1400, 980, ...]
    }],
    "cost_trend_7d": [{ "date": "string", "cost_usd": "float" }],
    "alerts_active": 2
}

Auth: JWT (role: viewer+)
Rate Limit: 30 requests/minute
```

#### GET /api/v1/dashboard/agents/{agent_id}

Get single-agent dashboard data.

```
Query Parameters:
    date_from: "datetime (default: 30 days ago)"
    date_to: "datetime (default: now)"

Response 200:
{
    "agent": { ...full_agent_object },
    "metrics": {
        "tasks_completed": 847,
        "success_rate": 0.942,
        "tokens_used": 1200000,
        "avg_cost_per_task": 0.018,
        "avg_latency_ms": 2100,
        "error_count": 14
    },
    "trends": {
        "tasks_per_day": [{ "date": "string", "count": "int" }],
        "cost_per_day": [{ "date": "string", "cost_usd": "float" }],
        "quality_per_day": [{ "date": "string", "avg_quality": "float" }]
    },
    "cost_breakdown": {
        "by_model": [{ "model": "gpt-4o", "cost_usd": 9.25, "percentage": 0.60 }],
        "by_task_type": [{ "type": "research", "cost_usd": 6.17, "percentage": 0.40 }]
    },
    "recent_tasks": [{ ...task_with_result, limit: 20 }],
    "recent_activity": [{ "event_type": "string", "timestamp": "datetime", "summary": "string", limit: 20 }]
}

Auth: JWT (role: viewer+)
Rate Limit: 30 requests/minute
```

#### GET /api/v1/dashboard/costs

Get cost attribution dashboard data.

```
Query Parameters:
    date_from: "datetime"
    date_to: "datetime"
    group_by: "agent|model|task_type|day"

Response 200:
{
    "total_cost_usd": 45.67,
    "budget_usd": 500.00,
    "budget_consumed_pct": 0.091,
    "burn_rate_usd_per_day": 4.72,
    "projected_monthly_usd": 141.60,
    "breakdown": [{
        "key": "string (agent name, model name, etc.)",
        "cost_usd": "float",
        "tokens": "int",
        "tasks": "int",
        "percentage": "float"
    }],
    "daily_trend": [{ "date": "string", "cost_usd": "float" }],
    "anomalies": [{
        "date": "string",
        "expected_cost": "float",
        "actual_cost": "float",
        "deviation": "float"
    }]
}

Auth: JWT (role: viewer+)
Rate Limit: 30 requests/minute
```

---

## 6. Real-Time Architecture

### 6.1 WebSocket Connection Lifecycle

```
Browser                          Nginx                   WebSocket Server            Redis
  |                                |                           |                       |
  |  WSS /ws/v1/workspace/{id}     |                           |                       |
  |  ?token=jwt_xxx               |                           |                       |
  |-------------------------------+>                           |                       |
  |                                |  Upgrade: websocket       |                       |
  |                                |-------------------------->|                       |
  |                                |                           |  Validate JWT         |
  |                                |                           |  Extract workspace_id |
  |                                |                           |  Extract user_id      |
  |                                |                           |                       |
  |                                |                           |  SUBSCRIBE            |
  |                                |                           |  oav:ws:{workspace_id}|
  |                                |                           |---------------------->|
  |                                |                           |                       |
  |  Connection Established        |                           |                       |
  |<---------------------------------------------------------------                   |
  |                                |                           |                       |
  |  {"type":"subscribe",          |                           |                       |
  |   "channels":["agent_events",  |                           |                       |
  |    "alerts","gamification"]}   |                           |                       |
  |--------------------------------------------------------------->                   |
  |                                |                           |  Store subscription   |
  |                                |                           |  preferences in       |
  |                                |                           |  connection state     |
  |                                |                           |                       |
  |              ... real-time event flow ...                  |                       |
  |                                |                           |                       |
  |                                |                           |  Receive PUB/SUB msg  |
  |                                |                           |<----------------------|
  |                                |                           |                       |
  |                                |                           |  Filter by client's   |
  |                                |                           |  subscribed channels  |
  |                                |                           |                       |
  |  {"type":"agent.state_change", |                           |                       |
  |   "agent_id":"...",            |                           |                       |
  |   "data":{...}}               |                           |                       |
  |<---------------------------------------------------------------                   |
  |                                |                           |                       |
  |  PING (every 30s from server) |                           |                       |
  |<---------------------------------------------------------------                   |
  |  PONG                          |                           |                       |
  |--------------------------------------------------------------->                   |
  |                                |                           |                       |
  |  Connection lost / closed      |                           |                       |
  |                                |                           |  UNSUBSCRIBE          |
  |                                |                           |  oav:ws:{workspace_id}|
  |                                |                           |---------------------->|
  |                                |                           |                       |
  |  Auto-reconnect (client-side)  |                           |                       |
  |  Exponential backoff:          |                           |                       |
  |  1s, 2s, 4s, 8s, 16s, 30s max |                           |                       |
```

### 6.2 Event Fan-Out via Redis Pub/Sub

When an event arrives at the ingestion gateway, it follows this fan-out path:

```
OTLP Gateway / REST API
        |
        v
  Redis Stream: oav:events:{tenant_id}
        |
        +----------------------+----------------------+
        v                      v                      v
  Persist Writer         Aggregation Engine     Live Fanout Consumer
  (consumer group:       (consumer group:       (consumer group:
   "persist")             "aggregate")           "fanout")
        |                      |                      |
        v                      v                      v
  TimescaleDB             Redis Cache            Redis Pub/Sub
  (events, spans)         (computed metrics)     oav:ws:{workspace_id}
                                                      |
                                          +-----------+-----------+
                                          v           v           v
                                      WS Conn 1  WS Conn 2  WS Conn N
                                      (user A)   (user B)   (user C)
```

Each consumer group processes events independently. If the Persist Writer is slow, it does not block the Live Fanout Consumer. Redis Streams consumer groups provide at-least-once delivery with acknowledgment.

The Live Fanout Consumer is responsible for:
1. Deserializing the event from the stream
2. Resolving the workspace_id from the event's tenant_id
3. Constructing the WebSocket message payload (lightweight, frontend-ready JSON)
4. Publishing to the Redis Pub/Sub channel `oav:ws:{workspace_id}`

### 6.3 SSE Channels for Metrics

For dashboard pages that need continuous metric updates without full WebSocket overhead, SSE endpoints provide unidirectional streams:

```
GET /api/v1/sse/metrics/{workspace_id}
Authorization: Bearer jwt_xxx
Accept: text/event-stream

Response (streaming):
event: metrics.update
data: {"agents_active":8,"events_per_second":45.2,"total_cost_today_usd":4.72}

event: metrics.update
data: {"agents_active":8,"events_per_second":42.8,"total_cost_today_usd":4.73}
```

SSE is used for:
- Dashboard overview metric counters (5-second push interval)
- Per-agent metric sparklines (10-second push interval)
- Cost burn rate (5-second push interval)

SSE advantages over WebSocket for metrics:
- Automatic reconnection built into the browser EventSource API
- Simpler Nginx configuration (no Upgrade header needed)
- Works through corporate proxies that block WebSocket

### 6.4 Connection Management and Scaling

**Connection Registry:** Each WebSocket server instance maintains an in-memory map of active connections:

```python
# Per-server connection state
connections: dict[str, dict[str, WebSocket]] = {
    "workspace_abc": {
        "conn_001": websocket_instance,
        "conn_002": websocket_instance,
    }
}
```

**Horizontal Scaling:** Multiple WebSocket server instances can run behind Nginx with sticky sessions (IP hash). Redis Pub/Sub ensures all instances receive workspace events regardless of which instance the event originated from. Each instance subscribes to the Pub/Sub channels for workspaces with active connections on that instance.

**Connection Limits:**

| Tier | Max Concurrent WebSocket Connections per Workspace |
|------|---------------------------------------------------|
| Free | 5 |
| Pro | 20 |
| Team | 50 |
| Business | 200 |
| Enterprise | 1000 |

**Memory Budget:** Each WebSocket connection consumes approximately 2-5 KB of server memory (connection state + subscription metadata + send buffer). At 1000 connections per workspace, this is 5 MB per workspace.

### 6.5 Heartbeat and Keepalive Strategy

**Server-to-Client Ping:** The WebSocket server sends a ping frame every 30 seconds. If no pong is received within 10 seconds, the connection is considered dead and cleaned up.

**Client-to-Server Heartbeat:** The frontend sends a heartbeat message every 60 seconds with the current viewport state (which agents are visible). The server uses this to optimize event delivery -- events for off-screen agents can be batched and delivered at lower frequency.

```json
{
    "type": "heartbeat",
    "viewport": {
        "visible_agent_ids": ["uuid1", "uuid2", "uuid3"],
        "zoom_level": 1.0
    }
}
```

**SDK Agent Heartbeat:** The SDK sends a heartbeat to `POST /api/v1/agents/{agent_id}/heartbeat` every 30 seconds. If no heartbeat is received for 90 seconds, the agent is marked as `offline` and an `agent_offline` alert is evaluated.

---

## 7. Event Processing Pipeline

### 7.1 Pipeline Architecture

```
SDK / Agent                    Ingestion Gateway              Redis Streams
    |                               |                              |
    |  OTLP/HTTP or REST            |                              |
    |------------------------------>|                              |
    |                               |                              |
    |                    +----------+-----------+                  |
    |                    | 1. Authenticate      |                  |
    |                    |    - Validate API key |                  |
    |                    |    - Extract tenant   |                  |
    |                    +---------------------+                  |
    |                    | 2. Rate Limit Check  |                  |
    |                    |    - Token bucket     |                  |
    |                    |    - Per API key      |                  |
    |                    +---------------------+                  |
    |                    | 3. Schema Validate    |                  |
    |                    |    - Required fields  |                  |
    |                    |    - Type checking    |                  |
    |                    |    - Size limits      |                  |
    |                    +---------------------+                  |
    |                    | 4. Normalize          |                  |
    |                    |    - Map OTLP to OAV |                  |
    |                    |    - Compute cost     |                  |
    |                    |    - Enrich metadata  |                  |
    |                    +---------------------+                  |
    |                    | 5. PII Redaction      |                  |
    |                    |    - Regex patterns   |                  |
    |                    |    - Content hashing  |                  |
    |                    +----------+-----------+                  |
    |                               |                              |
    |                               |  XADD oav:events:{tenant}   |
    |                               |----------------------------->|
    |                               |                              |
    |  HTTP 202 Accepted            |                              |
    |<------------------------------|                              |
```

**Stream Consumers:**

```
Redis Stream: oav:events:{tenant_id}
        |
        +------ Consumer Group: "persist" -----> Persist Writer ----> TimescaleDB
        |
        +------ Consumer Group: "aggregate" ---> Aggregation Engine -> Redis Cache
        |
        +------ Consumer Group: "fanout" -------> Live Fanout ------> Redis Pub/Sub -> WebSocket
```

### 7.2 Batch vs Streaming Processing

**Batch Processing (Persist Writer):**
- Collects events from Redis Streams in batches of 100 or every 500ms (whichever comes first)
- Performs a single multi-row INSERT into TimescaleDB per batch
- Uses `COPY` protocol for batches larger than 500 rows for maximum throughput
- Throughput target: 10,000 events/second per writer instance

**Streaming Processing (Aggregation Engine + Live Fanout):**
- Processes each event individually from the Redis Stream
- Aggregation Engine: Updates Redis counters atomically using MULTI/EXEC
- Live Fanout: Publishes to Pub/Sub immediately for sub-second dashboard updates
- Latency target: less than 100ms from event arrival to WebSocket delivery

### 7.3 Event Replay Capability

Event replay reconstructs historical sessions by reading events from TimescaleDB in chronological order and streaming them through the WebSocket at a configurable playback speed.

```
Client                    Replay Service              TimescaleDB
  |                            |                          |
  |  POST /api/v1/replay       |                          |
  |  {session_id, speed: 2x}   |                          |
  |--------------------------->|                          |
  |                            |  SELECT * FROM events    |
  |                            |  WHERE session_id = ?    |
  |                            |  ORDER BY created_at ASC |
  |                            |------------------------->|
  |                            |                          |
  |                            |  Events (sorted)         |
  |                            |<-------------------------|
  |                            |                          |
  |  event 1 (t=0ms)          |                          |
  |<---------------------------|                          |
  |  event 2 (t=500ms at 2x)  |                          |
  |<---------------------------|                          |
  |  event 3 (t=750ms at 2x)  |                          |
  |<---------------------------|                          |
```

Replay supports: 0.5x, 1x, 2x, 4x, 8x playback speeds; scrubbing to any timestamp; pause/resume; frame export for sharing specific moments.

### 7.4 Dead Letter Queue

Events that fail processing are routed to the dead letter stream:

```
oav:events:{tenant_id}  --[processing failure]-->  oav:deadletter
```

**Failure Reasons Tracked:**
- `schema_validation_failed` -- malformed event data
- `persist_write_failed` -- TimescaleDB write error (retried 3 times before DLQ)
- `unknown_agent_id` -- agent_external_id not registered in workspace
- `rate_limit_exceeded` -- tenant exceeded ingestion quota

Dead letter events are retained for 72 hours, inspectable via admin API endpoint `GET /api/v1/admin/deadletter`, retryable in bulk via `POST /api/v1/admin/deadletter/retry`, and monitored with an alert that fires if the DLQ exceeds 1000 events.

---

## 8. Caching Strategy

### 8.1 Redis Cache Layers

**Layer 1: Session Cache (Authentication)**

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `session:{jwt_jti}` | user_id, workspace_ids | 900s (15 min, matches access token) |
| `blocklist:{jwt_jti}` | `1` (revoked tokens) | 604800s (7 days, matches refresh token) |
| `refresh:{token_hash}` | user_id, expires_at | 604800s (7 days) |

**Layer 2: Entity Cache (Hot Data)**

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `agent:{agent_id}` | Full agent JSON | 300s (5 min) |
| `agent_state:{agent_id}` | Current state string | No TTL (write-through) |
| `workspace:{workspace_id}` | Workspace config JSON | 900s (15 min) |
| `api_key:{key_hash}` | workspace_id, scopes | 900s (15 min) |

**Layer 3: Query Cache (Computed Results)**

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `dashboard:{workspace_id}` | Overview JSON | 30s |
| `agent_dashboard:{agent_id}` | Agent metrics JSON | 30s |
| `cost_breakdown:{ws}:{range}` | Breakdown JSON | 60s |

**Layer 4: Computed Metrics (Real-Time)**

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `metrics:{workspace_id}:active_agents` | Integer | No TTL (continuous update) |
| `metrics:{workspace_id}:events_per_sec` | Float | No TTL (continuous update) |
| `metrics:{workspace_id}:cost_today` | Float | No TTL (continuous update) |
| `metrics:{agent_id}:tokens_session` | Integer | No TTL (continuous update) |

**Layer 5: Leaderboard Cache**

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `leaderboard:{ws}:daily` | Redis sorted set | 300s (5 min) |
| `leaderboard:{ws}:weekly` | Redis sorted set | 900s (15 min) |
| `leaderboard:{ws}:monthly` | Redis sorted set | 900s (15 min) |
| `leaderboard:{ws}:alltime` | Redis sorted set | 900s (15 min) |

**Layer 6: Rate Limiting**

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `ratelimit:{api_key}:{window}` | Counter | Window duration (60s or 3600s) |
| `ratelimit:{ip}:{endpoint}` | Counter | Window duration |

### 8.2 Cache Invalidation Patterns

| Data Type | Strategy | Trigger |
|-----------|----------|---------|
| Agent state | Write-through | Every state change event immediately updates cache |
| Agent entity | TTL + event-driven | 5-min TTL; invalidated on agent update API call |
| Dashboard overview | TTL only | 30-second TTL; recomputed on next request after expiry |
| Cost breakdown | TTL only | 60-second TTL; acceptable staleness |
| Leaderboard | TTL + scheduled | Recomputed by Celery beat task every 5 minutes |
| API key validation | Write-through + TTL | Cached on first use (15-min TTL); invalidated on revocation |
| Real-time metrics | Continuous update | Aggregation Engine updates atomically; no TTL needed |

---

## 9. Security Architecture

### 9.1 Authentication Flow Diagrams

**Flow 1: Email/Password Login**

```
Client                       FastAPI                        PostgreSQL       Redis
  |                             |                               |              |
  | POST /auth/login            |                               |              |
  | {email, password}           |                               |              |
  |---------------------------+>|                               |              |
  |                             | SELECT * FROM users           |              |
  |                             | WHERE email = ?               |              |
  |                             |------------------------------>|              |
  |                             |     user record               |              |
  |                             |<------------------------------|              |
  |                             |                               |              |
  |                             | bcrypt.verify(password, hash) |              |
  |                             |                               |              |
  |                             | Generate JWT access (15m)     |              |
  |                             | Generate JWT refresh (7d)     |              |
  |                             |                               |              |
  |                             | SET refresh:{hash}            |              |
  |                             |--------------------------------------------->|
  |                             |                               |              |
  |                             | INSERT INTO audit_log         |              |
  |                             |------------------------------>|              |
  |                             |                               |              |
  | {access_token, refresh_token, user}                        |              |
  |<----------------------------+                               |              |
```

**Flow 2: OAuth2 (GitHub Example)**

```
Client            FastAPI             GitHub OAuth         PostgreSQL    Redis
  |                  |                     |                    |           |
  | GET /auth/oauth/ |                     |                    |           |
  |   github         |                     |                    |           |
  |----------------->|                     |                    |           |
  |                  | Generate state      |                    |           |
  |                  | token (CSRF)        |                    |           |
  |                  | SET state:{token}   |                    |           |
  |                  |---------------------------------------------------->|
  |                  |                     |                    |           |
  | 302 Redirect to  |                     |                    |           |
  | github.com/oauth |                     |                    |           |
  |<-----------------+                     |                    |           |
  |                                        |                    |           |
  | User authorizes                        |                    |           |
  |--------------------------------------->|                    |           |
  |                                        |                    |           |
  | 302 callback?code=xxx&state=yyy        |                    |           |
  |----------------->|                     |                    |           |
  |                  | Validate state      |                    |           |
  |                  | Exchange code       |                    |           |
  |                  |-------------------->|                    |           |
  |                  |  access_token       |                    |           |
  |                  |<--------------------|                    |           |
  |                  | GET /user           |                    |           |
  |                  |-------------------->|                    |           |
  |                  |  user profile       |                    |           |
  |                  |<--------------------|                    |           |
  |                  |                     |                    |           |
  |                  | UPSERT user         |                    |           |
  |                  |------------------------------------>|           |
  |                  | Generate JWTs       |                    |           |
  |                  |                     |                    |           |
  | 302 /#/auth?     |                     |                    |           |
  |  access_token=.. |                     |                    |           |
  |<-----------------+                     |                    |           |
```

**Flow 3: API Key (SDK Authentication)**

```
SDK                     FastAPI                Redis              PostgreSQL
  |                        |                     |                    |
  | POST /v1/traces/ingest |                     |                    |
  | Authorization: Bearer  |                     |                    |
  |  oav_live_xxxxx        |                     |                    |
  |----------------------->|                     |                    |
  |                        | SHA-256(key)        |                    |
  |                        | GET api_key:{hash}  |                    |
  |                        |-------------------->|                    |
  |                        |                     |                    |
  |                   [cache hit]                |                    |
  |                        |  workspace_id,      |                    |
  |                        |  scopes             |                    |
  |                        |<--------------------|                    |
  |                        |                     |                    |
  |                   [cache miss]               |                    |
  |                        | SELECT FROM         |                    |
  |                        |  api_keys WHERE     |                    |
  |                        |  key_hash = ?       |                    |
  |                        |------------------------------------>|
  |                        |   key record        |                    |
  |                        |<------------------------------------|
  |                        | SET api_key:{hash}  |                    |
  |                        |  with 15m TTL       |                    |
  |                        |-------------------->|                    |
  |                        |                     |                    |
  |                        | Verify: is_active,  |                    |
  |                        |  not expired,       |                    |
  |                        |  has 'ingest' scope |                    |
  |                        |                     |                    |
  | HTTP 202 Accepted      |                     |                    |
  |<-----------------------+                     |                    |
```

### 9.2 Authorization (RBAC Model)

**Role Hierarchy:**

```
Owner (inherits all)
  +-- Admin (inherits viewer + engineer)
        +-- Engineer (inherits viewer)
              +-- Viewer (base)
```

**Permission Matrix:**

| Resource | Action | Viewer | Engineer | Admin | Owner |
|----------|--------|--------|----------|-------|-------|
| World Canvas | View | Y | Y | Y | Y |
| Dashboards | View | Y | Y | Y | Y |
| Agents | View | Y | Y | Y | Y |
| Agents | Create/Update | N | Y | Y | Y |
| Agents | Delete | N | N | Y | Y |
| Tasks | View | Y | Y | Y | Y |
| Tasks | Create/Assign | N | Y | Y | Y |
| Traces/Events | View | Y | Y | Y | Y |
| Traces/Events | Export | N | Y | Y | Y |
| Alert Rules | Create/Edit | N | N | Y | Y |
| Replays | Share | N | Y | Y | Y |
| API Keys | Create | N | Y | Y | Y |
| API Keys | Revoke any | N | N | Y | Y |
| Team Members | Invite/Remove | N | N | Y | Y |
| Team Members | Change role | N | N | N | Y |
| Workspace | Edit settings | N | N | Y | Y |
| Workspace | Delete | N | N | N | Y |
| Billing | Manage | N | N | N | Y |
| Audit Log | View/Export | N | N | Y | Y |
| Gamification | Toggle | N | N | Y | Y |

### 9.3 API Key Management

**Key Format:**

```
oav_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   (production keys, 40 chars total)
oav_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   (test/development keys)
```

**Key Lifecycle:**
1. Generated via `POST /api/v1/api-keys` (requires JWT auth, engineer+ role)
2. Full key shown ONCE at creation time; only the prefix is stored in plaintext
3. Key body is hashed with SHA-256 and stored in `api_keys.key_hash`
4. On each API request, the presented key is hashed and looked up
5. Keys can be revoked via `DELETE /api/v1/api-keys/{key_id}` (sets `is_active=false`)
6. Revoked keys are added to Redis blocklist for immediate propagation
7. Keys can have optional expiration dates

**Key Scopes:**

| Scope | Grants |
|-------|--------|
| `ingest` | Write events, spans, metrics; send heartbeats; update agent state |
| `read` | Query agents, tasks, traces, metrics, dashboards |
| `write` | Create tasks, update agents, manage alert rules |
| `admin` | All of the above plus workspace management |

### 9.4 Data Encryption

**In Transit:**
- All external connections use TLS 1.3 (Nginx terminates TLS)
- Internal service-to-service communication uses unencrypted HTTP within the Docker network (trusted network boundary)
- WebSocket connections use WSS (TLS-encrypted WebSocket)
- OTLP gRPC uses TLS when accessed externally

**At Rest:**
- PostgreSQL: `pgcrypto` extension available for field-level encryption
- Password hashes: bcrypt (already irreversible)
- API key hashes: SHA-256 (already irreversible)
- JSONB fields with sensitive event data: AES-256-GCM encrypted at application level when PII redaction mode is enabled
- Redis: ephemeral cache data; no at-rest encryption required
- Database backups: encrypted with AES-256 before storage

### 9.5 PII Handling

The ingestion pipeline includes a PII redaction stage that runs before events are stored:

**Redacted Patterns:**
- Email addresses: replaced with `[EMAIL_REDACTED]`
- Phone numbers: replaced with `[PHONE_REDACTED]`
- SSN/national IDs: replaced with `[ID_REDACTED]`
- Credit card numbers: replaced with `[CC_REDACTED]`
- API keys/tokens in event data: replaced with `[KEY_REDACTED]`
- Custom regex patterns configurable per workspace

**Implementation:**
- Regex-based scanner runs on all string fields in `event_data` JSONB
- Content hashing: original PII is SHA-256 hashed for correlation without storing the original value
- Redaction is irreversible
- PII redaction can be disabled per workspace for environments with no PII exposure

### 9.6 Rate Limiting Per Tier

| Endpoint Category | Free | Pro | Team | Business | Enterprise |
|-------------------|------|-----|------|----------|------------|
| Auth endpoints | 10/min | 10/min | 10/min | 10/min | 10/min |
| REST API (read) | 60/min | 300/min | 600/min | 1200/min | 6000/min |
| REST API (write) | 30/min | 150/min | 300/min | 600/min | 3000/min |
| Event ingestion | 500/min | 5000/min | 20000/min | 100000/min | Unlimited |
| WebSocket connections | 5 | 20 | 50 | 200 | 1000 |
| OTLP ingestion | 1000/min | 10000/min | 50000/min | 200000/min | Unlimited |

Rate limiting uses Redis token bucket algorithm with per-API-key counters. HTTP 429 returned with `Retry-After` header on limit breach.

---

## 10. Scalability and Performance

### 10.1 Horizontal Scaling Strategy

```
                    Load Balancer (Nginx)
                    +--------+--------+
                    |        |        |
              +-----v--++---v----++--v-----+
              |FastAPI ||FastAPI ||FastAPI |    REST API: stateless, scale by
              |  #1    ||  #2   ||  #3   |    adding instances
              +--------++-------++-------+
                    |        |        |
              +-----v--++---v----+
              |  WS    ||  WS   |              WebSocket: sticky sessions (IP hash)
              |  #1    ||  #2   |              Redis Pub/Sub for cross-instance fanout
              +--------++-------+
                    |        |
              +-----v--++---v----+
              |Persist ||Persist |              Persist Writer: scale by adding
              |Writer 1||Writer 2|              consumer group members
              +--------++-------+
                    |        |
              +-----v--++---v----+
              |Celery  ||Celery  |              Celery: scale by adding workers
              |Worker 1||Worker 2|
              +--------++-------+
```

**Scaling Triggers:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| FastAPI CPU > 70% | Sustained 5 min | Add FastAPI instance |
| WebSocket connections > 80% capacity | Immediate | Add WS instance |
| Redis Stream lag > 1000 events | Sustained 1 min | Add Persist Writer |
| Celery queue depth > 500 tasks | Sustained 2 min | Add Celery worker |
| PostgreSQL connections > 80% pool | Sustained 5 min | Increase pool size or add read replica |

### 10.2 Connection Pooling

**PostgreSQL Connection Pool (asyncpg):**

```python
DATABASE_POOL_CONFIG = {
    "min_size": 10,
    "max_size": 50,
    "max_inactive_connection_lifetime": 300,
    "command_timeout": 30,
}
```

Total pool budget: 50 connections x 3 FastAPI instances = 150 connections. PostgreSQL `max_connections` set to 200 (150 + buffer for Celery workers and admin connections).

**Redis Connection Pool:**

```python
REDIS_POOL_CONFIG = {
    "max_connections": 100,
    "socket_timeout": 5,
    "socket_connect_timeout": 5,
    "retry_on_timeout": True,
}
```

### 10.3 Database Query Optimization Patterns

**Pattern 1: Time-Range Queries on Hypertables**

TimescaleDB chunk exclusion automatically limits scans to relevant time chunks. All time-series queries must include a time range filter:

```sql
-- Efficient: chunk exclusion applies
SELECT * FROM events
WHERE workspace_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC LIMIT 100;
```

**Pattern 2: Denormalized Agent Metrics**

The `agents` table includes denormalized counters (`total_tasks`, `total_cost_usd`, `total_tokens`, `xp_total`) that are atomically incremented on each task completion, avoiding expensive aggregate queries for the most common dashboard reads.

**Pattern 3: Continuous Aggregates for Time-Series Charts**

Dashboard time-series charts query continuous aggregates instead of raw metrics. The 24-hour chart uses `metrics_1hour`, the 30-day chart uses `metrics_1day`. This reduces query time from seconds to single-digit milliseconds.

**Pattern 4: Indexed JSONB Queries**

For event_data filtering, GIN indexes on specific JSON paths:

```sql
CREATE INDEX idx_events_data_agent ON events USING GIN ((event_data -> 'agent_id'));
CREATE INDEX idx_events_data_task ON events USING GIN ((event_data -> 'task_id'));
```

### 10.4 Frontend Performance Budget

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| Initial load (LCP) | < 2.5s | Code splitting, lazy routes, preload critical CSS |
| First Input Delay | < 100ms | Web workers for heavy computation |
| Cumulative Layout Shift | < 0.1 | Reserved dimensions, skeleton loaders |
| JS bundle (gzipped) | < 200 KB initial | Tree-shaking, dynamic imports, vendor splitting |
| PixiJS canvas FPS | 60 fps (50 agents), 30 fps (100 agents) | Viewport culling, LOD, sprite batching |
| WebSocket message latency | < 100ms (p95) | Binary serialization for high-volume messages |
| Memory (browser tab) | < 200 MB with 100 agents | Object pooling, dispose off-screen textures |
| Rive animation file | < 5 KB per avatar | Vector assets, shared state machines |

**PixiJS Level of Detail (LOD) System:**

| Zoom Level | Rendered Detail | Render Time per Agent |
|------------|----------------|----------------------|
| < 50% | Status dot + color ring only | ~0.1ms |
| 50-100% | Avatar sprite + name + level badge | ~0.5ms |
| 100-200% | Full avatar + name + level + XP bar + task | ~1ms |
| > 200% | Full detail + metrics overlay + token counter | ~2ms |

### 10.5 Load Testing Targets

| Scenario | Target |
|----------|--------|
| Concurrent dashboard users | 500 per workspace, response < 500ms (p95) |
| Concurrent WebSocket connections | 1000 per workspace, delivery < 200ms (p95) |
| Event ingestion rate | 50,000 events/second, no drops, lag < 5s |
| REST API read latency | < 200ms (p50), < 500ms (p95) at 100 rps |
| REST API ingest latency | < 50ms (p50), < 200ms (p95) at 1000 rps |
| Database query time | < 50ms (p50), < 200ms (p95) for 30-day range |
| Canvas rendering | 60 fps with 50 agents on mid-range hardware |
| Session replay start time | < 2 seconds for 10,000-event sessions |
| Full page load (cold, 4G) | < 3 seconds |

---

## 11. Deployment Architecture

### 11.1 Docker Compose Configuration

```yaml
# docker-compose.yml
version: "3.9"

services:
  # ──────────────────────────────────────────
  # REVERSE PROXY
  # ──────────────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      backend:
        condition: service_healthy
      frontend:
        condition: service_started
      websocket:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  # ──────────────────────────────────────────
  # BACKEND API
  # ──────────────────────────────────────────
  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: >
      uvicorn app.main:app
      --host 0.0.0.0
      --port 8000
      --workers 4
      --loop uvloop
      --http httptools
    environment:
      - DATABASE_URL=postgresql+asyncpg://oav:${DB_PASSWORD}@postgres:5432/openagentvisualizer
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - JWT_ALGORITHM=HS256
      - JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
      - JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
      - CORS_ORIGINS=http://localhost:3000,https://app.openagentvisualizer.io
      - OAUTH_GITHUB_CLIENT_ID=${OAUTH_GITHUB_CLIENT_ID}
      - OAUTH_GITHUB_CLIENT_SECRET=${OAUTH_GITHUB_CLIENT_SECRET}
      - OAUTH_GOOGLE_CLIENT_ID=${OAUTH_GOOGLE_CLIENT_ID}
      - OAUTH_GOOGLE_CLIENT_SECRET=${OAUTH_GOOGLE_CLIENT_SECRET}
      - DEFAULT_USER_EMAIL=kotsai@gmail.com
      - DEFAULT_USER_PASSWORD=kots@123
      - ENVIRONMENT=${ENVIRONMENT:-development}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  # ──────────────────────────────────────────
  # WEBSOCKET SERVER
  # ──────────────────────────────────────────
  websocket:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: >
      uvicorn app.ws_server:app
      --host 0.0.0.0
      --port 8001
      --workers 2
      --loop uvloop
    environment:
      - DATABASE_URL=postgresql+asyncpg://oav:${DB_PASSWORD}@postgres:5432/openagentvisualizer
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  # ──────────────────────────────────────────
  # OTLP INGESTION GATEWAY
  # ──────────────────────────────────────────
  otlp_gateway:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: >
      uvicorn app.otlp_gateway:app
      --host 0.0.0.0
      --port 4318
      --workers 2
      --loop uvloop
    ports:
      - "4317:4317"  # gRPC (direct, not through Nginx)
      - "4318:4318"  # HTTP (also proxied through Nginx)
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql+asyncpg://oav:${DB_PASSWORD}@postgres:5432/openagentvisualizer
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  # ──────────────────────────────────────────
  # EVENT CONSUMERS
  # ──────────────────────────────────────────
  persist_writer:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: python -m app.consumers.persist_writer
    environment:
      - DATABASE_URL=postgresql+asyncpg://oav:${DB_PASSWORD}@postgres:5432/openagentvisualizer
      - REDIS_URL=redis://redis:6379/0
      - BATCH_SIZE=100
      - BATCH_INTERVAL_MS=500
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  aggregation_engine:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: python -m app.consumers.aggregation_engine
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  live_fanout:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: python -m app.consumers.live_fanout
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  # ──────────────────────────────────────────
  # CELERY WORKERS
  # ──────────────────────────────────────────
  celery_worker:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: >
      celery -A app.celery_app worker
      --loglevel=info
      --concurrency=4
      --queues=default,gamification,alerts,reports
    environment:
      - DATABASE_URL=postgresql+asyncpg://oav:${DB_PASSWORD}@postgres:5432/openagentvisualizer
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  celery_beat:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    command: >
      celery -A app.celery_app beat
      --loglevel=info
      --schedule=/tmp/celerybeat-schedule
    environment:
      - DATABASE_URL=postgresql+asyncpg://oav:${DB_PASSWORD}@postgres:5432/openagentvisualizer
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oav_network

  # ──────────────────────────────────────────
  # FRONTEND
  # ──────────────────────────────────────────
  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile
      target: deps
    environment:
      - VITE_API_URL=http://localhost/api
      - VITE_WS_URL=ws://localhost/ws
    restart: unless-stopped
    networks:
      - oav_network

  # ──────────────────────────────────────────
  # DATA STORES
  # ──────────────────────────────────────────
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      - POSTGRES_DB=openagentvisualizer
      - POSTGRES_USER=oav
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oav -d openagentvisualizer"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - oav_network

  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - oav_network

volumes:
  postgres_data:
  redis_data:

networks:
  oav_network:
    driver: bridge
```

### 11.2 Nginx Reverse Proxy Configuration

```nginx
# nginx/conf.d/default.conf

upstream fastapi_backend {
    server backend:8000;
}

upstream websocket_server {
    ip_hash;  # Sticky sessions for WebSocket
    server websocket:8001;
}

upstream otlp_gateway {
    server otlp_gateway:4318;
}

upstream frontend_spa {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend SPA
    location / {
        proxy_pass http://frontend_spa;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # REST API
    location /api/ {
        proxy_pass http://fastapi_backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Body size for event ingestion
        client_max_body_size 16m;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://websocket_server/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
    }

    # SSE (Server-Sent Events)
    location /api/v1/sse/ {
        proxy_pass http://fastapi_backend/api/v1/sse/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }

    # OTLP HTTP receiver
    location /otlp/ {
        proxy_pass http://otlp_gateway/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 16m;

        # Higher timeouts for batch ingestion
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no proxy, direct response)
    location /nginx-health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

### 11.3 Environment Variable Management

```bash
# .env.example
# ──────────────────────────────
# Database
# ──────────────────────────────
DB_PASSWORD=change_me_in_production
DATABASE_URL=postgresql+asyncpg://oav:${DB_PASSWORD}@postgres:5432/openagentvisualizer

# ──────────────────────────────
# Redis
# ──────────────────────────────
REDIS_URL=redis://redis:6379/0

# ──────────────────────────────
# Authentication
# ──────────────────────────────
JWT_SECRET_KEY=change_me_64_char_random_string_for_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ──────────────────────────────
# OAuth Providers
# ──────────────────────────────
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=

# ──────────────────────────────
# Default User (auto-seeded)
# ──────────────────────────────
DEFAULT_USER_EMAIL=kotsai@gmail.com
DEFAULT_USER_PASSWORD=kots@123

# ──────────────────────────────
# Application
# ──────────────────────────────
ENVIRONMENT=development
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:80

# ──────────────────────────────
# Frontend
# ──────────────────────────────
VITE_API_URL=http://localhost/api
VITE_WS_URL=ws://localhost/ws
```

### 11.4 Health Check Endpoints

| Service | Endpoint | Checks | Response |
|---------|----------|--------|----------|
| Backend API | `GET /health` | DB connection, Redis connection | `{"status":"healthy","db":"ok","redis":"ok","version":"1.0.0"}` |
| WebSocket Server | `GET /health` | Redis connection | `{"status":"healthy","redis":"ok","connections":42}` |
| OTLP Gateway | `GET /health` | Redis connection | `{"status":"healthy","redis":"ok","events_per_sec":145}` |
| PostgreSQL | `pg_isready` | Process running, accepting connections | Exit code 0 |
| Redis | `redis-cli ping` | Process running | `PONG` |
| Nginx | `GET /nginx-health` | Nginx process running | `OK` |

### 11.5 Logging and Monitoring

**Structured JSON Logging:**

All backend services emit structured JSON logs to stdout (Docker-native):

```json
{
    "timestamp": "2026-03-16T10:30:00.000Z",
    "level": "info",
    "service": "backend",
    "request_id": "uuid",
    "user_id": "uuid",
    "workspace_id": "uuid",
    "method": "GET",
    "path": "/api/v1/agents",
    "status_code": 200,
    "duration_ms": 45,
    "message": "Request completed"
}
```

**Internal Metrics (Prometheus-compatible):**

Each service exposes a `/metrics` endpoint (Prometheus format):

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `oav_http_requests_total` | Counter | method, path, status | HTTP request count |
| `oav_http_request_duration_seconds` | Histogram | method, path | Request latency |
| `oav_ws_connections_active` | Gauge | workspace_id | Active WebSocket connections |
| `oav_events_ingested_total` | Counter | tenant_id, event_type | Events ingested |
| `oav_events_processing_lag_seconds` | Gauge | consumer_group | Redis Stream consumer lag |
| `oav_db_pool_active` | Gauge | -- | Active database connections |
| `oav_db_pool_idle` | Gauge | -- | Idle database connections |
| `oav_cache_hits_total` | Counter | cache_layer | Cache hit count |
| `oav_cache_misses_total` | Counter | cache_layer | Cache miss count |
| `oav_celery_tasks_total` | Counter | task_name, status | Celery task count |
| `oav_deadletter_size` | Gauge | -- | Dead letter queue depth |

---

## 12. Data Flow Diagrams

### 12.1 Agent Registration Flow

```
SDK                     OTLP Gateway /         PostgreSQL            Redis
(agent startup)         REST API
  |                         |                      |                   |
  | POST /v1/agents         |                      |                   |
  | {agent_external_id,     |                      |                   |
  |  name, role, framework} |                      |                   |
  |------------------------>|                      |                   |
  |                         |                      |                   |
  |                         | Validate API key     |                   |
  |                         | Extract workspace_id |                   |
  |                         |                      |                   |
  |                         | INSERT INTO agents   |                   |
  |                         | (workspace_id,       |                   |
  |                         |  agent_external_id,  |                   |
  |                         |  name, role, ...)    |                   |
  |                         |--------------------->|                   |
  |                         |   agent record       |                   |
  |                         |<---------------------|                   |
  |                         |                      |                   |
  |                         | SET agent:{id}       |                   |
  |                         | SET agent_state:{id} |                   |
  |                         |   = "idle"           |                   |
  |                         |----------------------------------------->|
  |                         |                      |                   |
  |                         | PUBLISH oav:ws:      |                   |
  |                         |  {workspace_id}      |                   |
  |                         | {type: "agent.       |                   |
  |                         |  registered", ...}   |                   |
  |                         |----------------------------------------->|
  |                         |                      |                   |
  |                         | INSERT INTO          |                   |
  |                         |  audit_log           |                   |
  |                         |--------------------->|                   |
  |                         |                      |                   |
  | {id, name, level: 1,   |                      |                   |
  |  xp_total: 0, ...}     |                      |                   |
  |<------------------------|                      |                   |
```

### 12.2 Event Ingestion Flow

```
SDK              OTLP Gateway        Redis Stream       Persist     Aggregation    Live Fanout
  |                   |                    |             Writer        Engine          |
  | OTLP/HTTP batch   |                    |               |             |             |
  | (100 events)      |                    |               |             |             |
  |------------------>|                    |               |             |             |
  |                   |                    |               |             |             |
  |                   | Auth + Validate    |               |             |             |
  |                   | + Normalize        |               |             |             |
  |                   | + PII Redact       |               |             |             |
  |                   |                    |               |             |             |
  |                   | XADD (100 events)  |               |             |             |
  |                   |------------------->|               |             |             |
  |                   |                    |               |             |             |
  | HTTP 202 Accepted |                    |               |             |             |
  |<------------------|                    |               |             |             |
  |                   |                    |               |             |             |
  |                   |     XREADGROUP (persist)           |             |             |
  |                   |                    |-------------->|             |             |
  |                   |                    |               |             |             |
  |                   |                    |    Batch INSERT (events + spans)          |
  |                   |                    |               |---> TimescaleDB          |
  |                   |                    |               |             |             |
  |                   |                    |    XACK       |             |             |
  |                   |                    |<--------------|             |             |
  |                   |                    |               |             |             |
  |                   |     XREADGROUP (aggregate)         |             |             |
  |                   |                    |----------------------------+>|             |
  |                   |                    |               |             |             |
  |                   |                    |     INCR metrics counters  |             |
  |                   |                    |               |   Redis<---|             |
  |                   |                    |               |             |             |
  |                   |                    |     XACK      |             |             |
  |                   |                    |<-----------------------------|             |
  |                   |                    |               |             |             |
  |                   |     XREADGROUP (fanout)            |             |             |
  |                   |                    |--------------------------------------------+>
  |                   |                    |               |             |             |
  |                   |                    |     PUBLISH oav:ws:{workspace_id}         |
  |                   |                    |               |             |    Redis<---|
  |                   |                    |               |             |             |
  |                   |                    |     XACK      |             |             |
  |                   |                    |<--------------------------------------------|
```

### 12.3 Real-Time Dashboard Update Flow

```
Browser          WebSocket Server        Redis Pub/Sub       Aggregation Engine
  |                    |                       |                      |
  | (connected, subscribed to metrics)         |                      |
  |                    |                       |                      |
  |                    |                       |   New event arrives  |
  |                    |                       |   at stream consumer |
  |                    |                       |                      |
  |                    |                       |   INCR workspace     |
  |                    |                       |   cost counter       |
  |                    |                       |   INCR agent task    |
  |                    |                       |   counter            |
  |                    |                       |<---------------------|
  |                    |                       |                      |
  |                    |                       |   PUBLISH            |
  |                    |                       |   oav:ws:{workspace} |
  |                    |                       |   {type: "metrics.   |
  |                    |                       |    update", data:{}} |
  |                    |                       |<---------------------|
  |                    |                       |                      |
  |                    |  Receive Pub/Sub msg  |                      |
  |                    |<----------------------|                      |
  |                    |                       |                      |
  |                    | Filter: user is       |                      |
  |                    | subscribed to         |                      |
  |                    | "metrics" channel     |                      |
  |                    |                       |                      |
  | WS message:        |                       |                      |
  | {type:"metrics.    |                       |                      |
  |  update",          |                       |                      |
  |  data:{cost:4.73}} |                       |                      |
  |<-------------------|                       |                      |
  |                    |                       |                      |
  | Zustand store      |                       |                      |
  | update triggers    |                       |                      |
  | React re-render    |                       |                      |
  | of cost counter    |                       |                      |
```

### 12.4 Gamification Event Processing Flow

```
Task Result            Backend API          Celery Worker         PostgreSQL        Redis
(from SDK)                |                      |                    |              |
  |                       |                      |                    |              |
  | POST /tasks/{id}/     |                      |                    |              |
  |   result              |                      |                    |              |
  |---------------------->|                      |                    |              |
  |                       |                      |                    |              |
  |                       | INSERT task_results  |                    |              |
  |                       |--------------------->|------------>|              |
  |                       |                      |                    |              |
  |                       | Calculate XP:        |                    |              |
  |                       |  base * quality *    |                    |              |
  |                       |  difficulty * streak |                    |              |
  |                       |  + efficiency_bonus  |                    |              |
  |                       |                      |                    |              |
  |                       | INSERT xp_ledger     |                    |              |
  |                       |--------------------------------------------->|              |
  |                       |                      |                    |              |
  |                       | UPDATE agents SET    |                    |              |
  |                       |  xp_total += N,      |                    |              |
  |                       |  level = calc(xp)    |                    |              |
  |                       |--------------------------------------------->|              |
  |                       |                      |                    |              |
  |                       | PUBLISH gamification |                    |              |
  |                       |  event via Pub/Sub   |                    |              |
  |                       |------------------------------------------------------>|
  |                       |                      |                    |              |
  |                       | Enqueue async:       |                    |              |
  |                       |  check_achievements  |                    |              |
  |                       |  check_quest_progress|                    |              |
  |                       |---------------------->|                    |              |
  |                       |                      |                    |              |
  | {xp_awarded: 67,     |                      | Check each         |              |
  |  level_up: false,     |                      | achievement        |              |
  |  achievements: []}    |                      | criteria against   |              |
  |<----------------------|                      | agent stats        |              |
  |                       |                      |--------------------->|              |
  |                       |                      |                    |              |
  |                       |                      | If unlocked:       |              |
  |                       |                      |  INSERT user_      |              |
  |                       |                      |  achievements      |              |
  |                       |                      |--------------------->|              |
  |                       |                      |                    |              |
  |                       |                      | PUBLISH            |              |
  |                       |                      |  achievement event |              |
  |                       |                      |-------------------------------->|
  |                       |                      |                    |              |
  |                       |                      | Update quest       |              |
  |                       |                      |  progress          |              |
  |                       |                      |--------------------->|              |
```

### 12.5 Alert Evaluation Flow

```
Aggregation          Alert Evaluator         PostgreSQL        Redis Pub/Sub     Webhook
Engine               (Celery periodic)            |                |            Destination
  |                       |                       |                |                |
  | INCR error counter    |                       |                |                |
  | for agent_id          |                       |                |                |
  |----> Redis            |                       |                |                |
  |                       |                       |                |                |
  |   (every 10 seconds)  |                       |                |                |
  |                       | Load active           |                |                |
  |                       | alert_rules           |                |                |
  |                       |---------------------->|                |                |
  |                       |  rules list           |                |                |
  |                       |<----------------------|                |                |
  |                       |                       |                |                |
  |                       | For each rule:        |                |                |
  |                       |  GET metric from      |                |                |
  |                       |  Redis cache          |                |                |
  |                       |----> Redis            |                |                |
  |                       |                       |                |                |
  |                       | Evaluate condition:   |                |                |
  |                       |  error_rate > 0.1?    |                |                |
  |                       |                       |                |                |
  |                       | [TRIGGERED]           |                |                |
  |                       |                       |                |                |
  |                       | Check cooldown:       |                |                |
  |                       |  last alert for this  |                |                |
  |                       |  rule > 15 min ago?   |                |                |
  |                       |----> Redis            |                |                |
  |                       |                       |                |                |
  |                       | [Not in cooldown]     |                |                |
  |                       |                       |                |                |
  |                       | INSERT INTO alerts    |                |                |
  |                       |---------------------->|                |                |
  |                       |                       |                |                |
  |                       | INSERT INTO           |                |                |
  |                       |  notifications        |                |                |
  |                       |---------------------->|                |                |
  |                       |                       |                |                |
  |                       | PUBLISH alert event   |                |                |
  |                       |  via Pub/Sub          |                |                |
  |                       |------------------------------->|                |
  |                       |                       |                |                |
  |                       |                       |     -> WS clients see alert   |
  |                       |                       |                |                |
  |                       | Send webhook          |                |                |
  |                       |  notification         |                |                |
  |                       |-------------------------------------------------->|
  |                       |                       |                |                |
  |                       | SET cooldown key      |                |                |
  |                       |----> Redis (TTL=15m)  |                |                |
```

---

## 13. Migration Strategy

### 13.1 Alembic Migration Plan

**Directory Structure:**

```
src/backend/alembic/
  |-- env.py                    # Async engine configuration
  |-- script.py.mako            # Migration template
  |-- versions/
      |-- 001_initial_schema.py            # Core tables: users, workspaces, agents
      |-- 002_task_system.py               # Tasks, assignments, results
      |-- 003_events_and_spans.py          # TimescaleDB hypertables for events and spans
      |-- 004_metrics_hypertables.py       # metrics_raw + continuous aggregates
      |-- 005_gamification_tables.py       # achievements, xp_ledger, leaderboard_snapshots
      |-- 006_alerts_notifications.py      # alert_rules, alerts, notifications
      |-- 007_api_keys_audit.py            # api_keys, audit_log hypertable
      |-- 008_timescaledb_policies.py      # Compression, retention, continuous aggregate policies
      |-- 009_seed_achievements.py         # Seed 38 achievements with criteria
      |-- 010_seed_default_user.py         # Seed default user (kotsai@gmail.com / kots@123)
```

**Migration Execution Order:**

```bash
# Run all migrations
alembic upgrade head

# Run migrations up to a specific version
alembic upgrade 005

# Generate a new migration from model changes
alembic revision --autogenerate -m "description"

# Rollback last migration
alembic downgrade -1
```

**Alembic env.py Configuration:**

```python
# env.py (async support)
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.models import Base  # Import all models for autogenerate

target_metadata = Base.metadata

def run_migrations_online():
    connectable = create_async_engine(settings.DATABASE_URL)

    async def do_run_migrations(connection):
        await connection.run_sync(do_run_migrations_sync)

    async with connectable.connect() as connection:
        await do_run_migrations(connection)

def do_run_migrations_sync(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()
```

### 13.2 Data Seeding Strategy

**Default User Seed (runs on every startup):**

```python
# app/main.py — startup event
async def seed_default_user():
    async with async_session() as session:
        existing = await session.execute(
            select(User).where(User.email == settings.DEFAULT_USER_EMAIL)
        )
        if existing.scalar_one_or_none() is None:
            user = User(
                email=settings.DEFAULT_USER_EMAIL,
                password_hash=bcrypt.hashpw(
                    settings.DEFAULT_USER_PASSWORD.encode(),
                    bcrypt.gensalt()
                ).decode(),
                display_name="Admin",
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.flush()

            workspace = Workspace(
                name="Default Workspace",
                slug="default",
                owner_id=user.id,
                tier="team",
                gamification_enabled=True,
            )
            session.add(workspace)
            await session.flush()

            member = WorkspaceMember(
                workspace_id=workspace.id,
                user_id=user.id,
                role="owner",
            )
            session.add(member)

            api_key_raw = f"oav_live_{secrets.token_hex(16)}"
            api_key = ApiKey(
                workspace_id=workspace.id,
                created_by=user.id,
                name="Default Key",
                key_prefix=api_key_raw[:12],
                key_hash=hashlib.sha256(api_key_raw.encode()).hexdigest(),
                scopes=["ingest", "read", "write", "admin"],
            )
            session.add(api_key)
            await session.commit()

            logger.info(f"Default user seeded: {settings.DEFAULT_USER_EMAIL}")
            logger.info(f"Default API key: {api_key_raw}")
```

**Achievement Seed (migration 009):**

All 38 achievements from the Gamification System Design are inserted with their criteria as JSONB:

```python
achievements = [
    {"name": "First Steps", "category": "productivity", "criteria": {"type": "tasks_completed", "threshold": 1}, "xp_reward": 50, "rarity_tier": "common", "icon_name": "footprints", "is_secret": False},
    {"name": "Getting Warmed Up", "category": "productivity", "criteria": {"type": "tasks_in_day", "threshold": 10}, "xp_reward": 100, "rarity_tier": "common", "icon_name": "flame", "is_secret": False},
    {"name": "Century Club", "category": "productivity", "criteria": {"type": "tasks_completed", "threshold": 100}, "xp_reward": 500, "rarity_tier": "uncommon", "icon_name": "trophy_100", "is_secret": False},
    # ... all 38 achievements
]
```

**Sample Data Mode Seed:**

When a workspace has zero agents and the user activates Sample Data Mode, a Celery task generates 5 simulated agents with historical data:

```python
SAMPLE_AGENTS = [
    {"name": "ResearchAgent", "role": "researcher", "framework": "langchain", "model": "gpt-4o", "level": 12},
    {"name": "CoderAgent", "role": "coder", "framework": "autogen", "model": "claude-sonnet-4-20250514", "level": 8},
    {"name": "ReviewerAgent", "role": "reviewer", "framework": "crewai", "model": "gpt-4o-mini", "level": 15},
    {"name": "ManagerAgent", "role": "orchestrator", "framework": "custom", "model": "gpt-4o", "level": 20},
    {"name": "AnalystAgent", "role": "analyst", "framework": "langchain", "model": "claude-sonnet-4-20250514", "level": 6},
]
```

### 13.3 Zero-Downtime Deployment Approach

**Strategy: Rolling deployment with database migration guard.**

```
Step 1: Run database migrations
  - Migrations are backward-compatible (additive only: new tables, new columns with defaults)
  - No column renames or drops in the same release as code changes
  - Destructive migrations (drop column) happen in the NEXT release after code no longer references the column

Step 2: Deploy new backend instances alongside old
  - Docker Compose: deploy new container, wait for health check
  - Nginx upstream: add new instance to pool
  - Both old and new versions serve traffic simultaneously

Step 3: Drain old instances
  - Remove old instance from Nginx upstream
  - Wait for in-flight requests to complete (30s grace period)
  - Stop old container

Step 4: Deploy frontend
  - Build new frontend assets
  - Swap Nginx static file serving to new build directory
  - Old cached assets remain valid (content-hashed filenames)

Step 5: Verify
  - Health check all endpoints
  - Verify WebSocket connections re-established
  - Check event processing lag is zero
  - Confirm no errors in structured logs
```

**Database Migration Safety Rules:**
1. Never rename a column; add new column, migrate data, deprecate old column, drop in next release
2. Never drop a table in the same release
3. All new columns must have DEFAULT values or be nullable
4. TimescaleDB policy changes (compression, retention) are idempotent
5. Continuous aggregate creation is additive and safe

---

## 14. Technical Risks and Mitigations

### 14.1 Risk Matrix

| # | Risk | Likelihood | Impact | Severity | Mitigation |
|---|------|-----------|--------|----------|------------|
| R1 | PixiJS WebGL performance degrades with 100+ agents on low-end hardware | Medium | High | High | LOD system with 4 detail levels; viewport culling; sprite batching; fallback to Canvas2D renderer for older GPUs; performance budget enforced in CI |
| R2 | Redis becomes single point of failure (event bus, cache, pub/sub) | Medium | Critical | Critical | Redis Sentinel for automatic failover; SDK local buffer (10K events) survives Redis outage; graceful degradation: dashboard shows stale data from PostgreSQL if Redis is down |
| R3 | TimescaleDB hypertable query performance degrades with months of accumulated data | Low | High | Medium | Continuous aggregates pre-compute dashboards; retention policies auto-drop old chunks; compression policies reduce storage by 10x; query time assertions in CI test suite |
| R4 | WebSocket connection storms on server restart (thundering herd) | Medium | Medium | Medium | Client-side exponential backoff with jitter (1-30s); Nginx connection rate limiting; gradual health check transitions (not all instances healthy simultaneously) |
| R5 | Event ingestion rate exceeds processing capacity (backpressure failure) | Low | High | Medium | Redis Streams provide durability; consumer group lag monitoring with auto-scaling trigger; SDK backpressure signaling (HTTP 429 with Retry-After); dead letter queue prevents data loss |
| R6 | bcrypt version incompatibility with passlib | High | Medium | Medium | Pin `bcrypt==4.0.1` in requirements.txt; add version assertion in startup; automated dependency check in CI |
| R7 | OTLP protobuf schema versioning conflicts with upstream OpenTelemetry changes | Low | Medium | Low | Pin `opentelemetry-proto` version; schema validation at ingestion boundary; adapter layer absorbs upstream changes without backend modification |
| R8 | Gamification XP calculation exploits (farming trivial tasks) | Medium | Low | Low | Diminishing returns after 20 identical tasks; minimum complexity threshold for leaderboard; anomaly detection flags 3-sigma deviations; quality gate requires score > 0.5 |
| R9 | Multi-tenant data leakage (workspace isolation breach) | Low | Critical | High | Workspace ID enforced at query layer (SQLAlchemy default filter); API key scoped to single workspace; Redis key namespacing includes workspace ID; penetration testing in QA phase |
| R10 | Frontend memory leak from WebSocket event accumulation | Medium | Medium | Medium | Ring buffer for activity feed (max 1000 events in memory); XState actor cleanup on agent disconnect; PixiJS texture disposal for off-screen agents; memory profiling in CI |
| R11 | Celery task queue bottleneck during leaderboard recomputation | Low | Low | Low | Leaderboard recomputation is batched (one query per workspace, not per agent); result cached in Redis for 5 minutes; separate Celery queue for gamification tasks |
| R12 | OAuth state token replay attack | Low | Medium | Medium | State tokens are single-use (deleted from Redis on callback); 5-minute TTL; PKCE flow for additional security |
| R13 | Large OTLP batch payloads cause memory pressure | Medium | Medium | Medium | 16 MB max payload enforced at Nginx and application layer; streaming protobuf deserialization; worker memory limits in Docker |
| R14 | SQLAlchemy reserved word collision (metadata column) | High | Medium | Medium | Never name a model column `metadata`; use `extra_data` with `Column("metadata", ...)` alias if needed; linting rule in CI |

### 14.2 Contingency Plans

**Redis Total Failure:**
1. SDK buffers locally (10K events, ~30 seconds at peak load)
2. Backend falls back to PostgreSQL-direct writes (10x slower but functional)
3. WebSocket server serves cached state from last-known-good
4. Dashboard shows "Data may be delayed" banner
5. Alert: PagerDuty notification to ops team

**PostgreSQL Total Failure:**
1. Read operations served from Redis cache (stale but available)
2. Write operations queued in Redis Streams (persisted to disk via AOF)
3. WebSocket continues serving real-time events (no DB dependency for fanout)
4. Ingestion continues (events buffer in Redis Streams)
5. On recovery: Persist Writer drains backlog from Redis Streams

**Frontend PixiJS Crash:**
1. Error boundary catches WebGL context loss
2. Automatic retry with Canvas2D fallback renderer
3. If fallback fails: show "Dashboard Only" mode (no world canvas, full metric views)
4. Toast notification: "Virtual world temporarily unavailable. Using dashboard mode."
