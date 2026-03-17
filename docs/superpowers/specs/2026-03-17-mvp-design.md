# OpenAgentVisualizer — MVP Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Full MVP Web App (Option A — Parallel Build)

---

## 1. Product Summary

OpenAgentVisualizer is a real-time gamified virtual workspace that renders AI agent teams as animated characters in an isometric 2D office. It replaces text-based trace viewers with a visual world where every agent has an avatar, status, XP level, and cost trail — understandable by engineers and non-engineers alike.

**Integration:** 3 lines of Python code. Works with LangChain, CrewAI, AutoGen, OpenAI Assistants, Anthropic, Ollama, HuggingFace, and custom HTTP agents.

---

## 2. MVP Scope

### 2.1 Core Features

| Feature | Description |
|---------|-------------|
| Virtual World | Isometric 2D office canvas (PixiJS v8), semantic zoom, agent positions |
| Agent Avatars | Animated characters with 5 states: idle, working, thinking, communicating, error |
| Real-Time Events | WebSocket push from backend, <500ms SDK-to-screen latency |
| XP & Leveling | Agents earn XP per task; Rookie → Pro → Expert → Master → Legend progression |
| Cost Tracking | Per-agent token usage, cost per task, daily/weekly aggregations |
| Session Replay | Rewind and replay any past session event-by-event |
| Loop Detection | Automatic circular call detection with alerting |
| Python SDK | @agent decorator, LangChain/CrewAI/AutoGen/OpenAI/Anthropic framework adapters |

### 2.2 Out of Scope (MVP)

- Node.js SDK (V1)
- Achievements & quests (V1)
- RBAC & team features (Team tier)
- SSO/SAML (Business tier)
- Unreal Engine 5 client (V2)
- LLM-as-Judge quality scoring (V2)

---

## 3. Architecture

### 3.1 System Diagram

```
Agent Frameworks (LangChain, CrewAI, AutoGen, OpenAI, Anthropic, Custom)
        │
        ▼
   OAV Python SDK  ←── 3 lines of code
        │
   OTLP gRPC:4317 / HTTP:4318
        │
        ▼
┌───────────────────────────────────────┐
│          NGINX Reverse Proxy          │
│  /api/* → FastAPI                     │
│  /ws/*  → WebSocket Server            │
│  /otlp/* → OTLP Gateway               │
├──────────┬────────────┬───────────────┤
│ FastAPI  │ WebSocket  │ OTLP Gateway  │
│ :8000    │ :8001      │ :4317/:4318   │
└──────────┴─────┬──────┴───────────────┘
                 │
         Redis 7.2 (Event Bus)
         Streams → ingestion
         Pub/Sub → WS fanout
                 │
    ┌────────────┼──────────────────┐
    │            │                  │
Persist    Aggregation   Celery Worker + Celery Beat
Writer     Engine        (tasks)       (scheduler)
    │            │                  │
    └────────────┼──────────────────┘
                 │
   PostgreSQL 16 + TimescaleDB
   (agents, tasks, events, XP, costs)
                 │
   WebSocket / HTTPS
                 │
        ▼
┌───────────────────────────────────────┐
│   React 18 + PixiJS v8 Browser App    │
│   Rive avatars · XState FSM · Zustand │
│   Recharts dashboards · React Flow    │
└───────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI 0.110.3 + Uvicorn 0.29.0 |
| Language | Python 3.12 |
| ORM | SQLAlchemy 2.0.31 (async) + asyncpg 0.29.0 |
| Migrations | Alembic 1.13.2 |
| Database | PostgreSQL 16 + TimescaleDB extension |
| Cache / Pub-Sub | Redis 7.2 (hiredis) |
| Task queue | Celery 5.4.0 + Redis broker |
| Auth | JWT (python-jose 3.3.0) + passlib 1.7.4 / bcrypt 4.0.1 |
| OTLP | opentelemetry-proto 1.24.0 + grpcio 1.64.1 |
| Frontend framework | React 18 + TypeScript + Vite |
| Canvas / rendering | PixiJS v8 (WebGL + WebGPU) |
| Animation | Rive `@rive-app/canvas` (canvas-renderer; shares WebGL context with PixiJS) |
| State machine | XState v5 (agent FSM) |
| UI state | Zustand |
| Charts | Recharts (simple) + React Flow (topology) |
| Data fetching | TanStack Query v5 (server-state, cache invalidation) |
| Transitions | GSAP 3 |
| Styling | Tailwind CSS + design tokens |
| SDK | Python package (openagentvisualizer) |
| Infrastructure | Docker Compose + Nginx |
| CI/CD | GitHub Actions (workflow_dispatch only) |

### 3.3 Database Schema (Key Tables)

- `users` — auth, workspace membership
- `workspaces` — tenant isolation
- `api_keys` — SDK authentication
- `agents` — agent registry (name, role, avatar, level, xp)
- `tasks` — task assignments and results
- `events` (TimescaleDB hypertable) — raw event stream
- `spans` (TimescaleDB hypertable) — OTLP spans
- `metrics_raw` / `metrics_agg` — token/cost timeseries
- `xp_transactions` — XP earn/spend ledger
- `sessions` — replay session records (start/end time, agent list, event count)
- `alerts` — loop detection and threshold alerts
- `audit_log` — all mutations

### 3.4 Key Performance Targets

| Metric | Target |
|--------|--------|
| Canvas FPS | 60fps minimum floor with 50 agents (not p50 — must hold continuously) |
| Event ingestion | 100K events/sec |
| WebSocket latency | <500ms SDK-to-screen (p99) |
| SDK overhead | <1ms per event |

---

## 4. Development Approach

### 4.1 Parallel Build — 3 Subagents

Three subagents run simultaneously, each with its own scoped implementation plan:

| Subagent | Scope | Source Doc |
|----------|-------|-----------|
| Backend Expert | FastAPI + DB + Redis + OTLP + gamification engine | `11_Backend_Expert/Backend_Implementation.md` |
| Frontend Expert | React + PixiJS + Rive + XState + WebSocket + dashboards | `10_Frontend_Expert/Frontend_Implementation.md` |
| Fullstack/SDK Expert | Python SDK + Docker Compose + Nginx + CI/CD | `12_Fullstack_Expert/Integration_Plan.md` |

### 4.2 Gate Stages (Sequential After Parallel)

1. **Code Reviewer (Stage 2.3)** — superpowers:code-reviewer reviews all three outputs. Must PASS before QA.
2. **QA Engineer (Stage 2.4)** — `docker compose up --build`, smoke tests, API contract tests, WebSocket integration, SDK e2e tests.
3. **DevOps Convergence** — Final wiring, CI workflow validation, local run verification.

### 4.3 Folder Structure

```
OpenAgentVisualizer/
├── src/
│   ├── backend/          # FastAPI application
│   │   ├── app/
│   │   │   ├── core/     # config, security, dependencies
│   │   │   ├── models/   # SQLAlchemy models
│   │   │   ├── schemas/  # Pydantic schemas
│   │   │   ├── routers/  # API endpoints
│   │   │   └── services/ # business logic
│   │   ├── alembic/      # DB migrations
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── frontend/         # React + PixiJS app
│   │   ├── index.html        # Vite entry point (at project root, not src/)
│   │   ├── public/           # static assets served as-is
│   │   ├── src/
│   │   │   ├── canvas/   # PixiJS world, agents, particles
│   │   │   ├── machines/ # XState FSMs
│   │   │   ├── stores/   # Zustand stores
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── lib/      # shared utilities (@lib alias)
│   │   │   └── services/ # API + WebSocket clients
│   │   ├── Dockerfile
│   │   └── package.json
│   └── sdk/              # Python SDK package
│       ├── openagentvisualizer/
│       │   ├── core/
│       │   ├── adapters/ # LangChain, CrewAI, AutoGen, etc.
│       │   └── exporters/
│       ├── tests/
│       └── pyproject.toml    # PEP 517 build (not setup.py)
├── deploy/
│   └── nginx/
│       └── dev.conf          # mounted as nginx config in Docker
├── docker-compose.yml
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml        # workflow_dispatch only
└── Product_Documents/    # Planning docs (all complete)
```

---

## 5. Default Credentials

- **Email:** `kotsai@gmail.com`
- **Password:** `kots@123`
- Auto-seeded via `seed_default_user()` in `main.py`

---

## 6. Known Implementation Rules

- Pin `bcrypt==4.0.1` (passlib 1.7.4 incompatible with bcrypt ≥5.0.0)
- Add `email-validator==2.2.0` to requirements.txt
- Never name SQLAlchemy column `metadata` — use `extra_data` with column alias
- Frontend Dockerfile: use `npm install` not `npm ci` — `package-lock.json` is gitignored; it is generated at build time inside the container, not committed to the repo
- Docker Compose frontend: add `target: deps` to build section
- CI/CD: all workflows use `workflow_dispatch` only — never auto-trigger

---

## 7. Acceptance Criteria

- [ ] `docker compose up --build` starts all 9 services without errors (postgres, redis, backend, websocket, otlp-gateway, celery-worker, celery-beat, frontend, nginx)
- [ ] Default user seeds on first boot (`kotsai@gmail.com` / `kots@123`)
- [ ] SDK decorator captures agent events and delivers to backend in <500ms
- [ ] Virtual world canvas renders at 60fps with 50 simulated agents
- [ ] Agent avatar transitions between 5 states (idle, working, thinking, communicating, error)
- [ ] XP increments after task completion, agent level advances at correct thresholds
- [ ] Cost dashboard shows per-agent token usage with daily aggregation
- [ ] Loop detection triggers alert when configured threshold of identical consecutive calls is exceeded (threshold is configurable per workspace, default 5)
- [ ] Session replay reproduces a recorded session event-by-event in correct order
- [ ] SDK sends an OTLP span to `grpc://localhost:4317`; span appears in the `spans` table within 2 seconds
- [ ] API request with invalid key returns HTTP 401; valid key grants access to protected endpoints
- [ ] All backend API tests pass (`pytest`)
- [ ] All frontend component tests pass (`vitest`)
