# OpenAgentVisualizer

**Gamified Virtual World for AI Agent Management**

Watch your AI agents work in real-time. Assign tasks, track performance, manage costs, and gamify productivity — all in an animated virtual workspace.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Sprints](https://img.shields.io/badge/sprints-7%2F7%20complete-blue)
![Features](https://img.shields.io/badge/features-125-orange)
![License](https://img.shields.io/badge/license-FSL--MIT-green)

---

## What is OpenAgentVisualizer?

OpenAgentVisualizer is a real-time, animated virtual workspace that visualizes AI agent teams as characters operating in 2D and 3D spatial environments. Each agent appears as a distinct entity with its own avatar, status indicators, XP level, skill tree, and activity animations.

Connect any agent framework in **3 lines of code**:

```python
from openagentvisualizer import OAVTracer

tracer = OAVTracer(api_key="oav_...")

@tracer.agent(name="ResearchBot", role="researcher")
def my_agent(task):
    return result  # Zero changes needed
```

---

## Features (125 delivered across 7 sprints)

### Visualization Engine
- **2D Virtual World** — PixiJS canvas with sprite pooling, 60fps at 500 agents (LOD system)
- **3D Viewer** — UE5 Pixel Streaming integration with fallback to 2D
- **Topology Graph** — Interactive ReactFlow network with custom nodes/edges
- **State Machines** — XState v5 FSMs visualizing agent states (idle/active/waiting/error/complete)
- **Animations** — GSAP-powered transitions, XP gain effects, level-up celebrations

### Gamification
- **10-Level XP System** — Agents earn XP from tasks, events, streaks
- **10 Achievements** — Milestone badges with XP bonuses
- **Quest Chains** — 15 quests (5 daily, 5 weekly, 5 epic) with step progression
- **Skill Trees** — 4 trees (Speed/Accuracy/Efficiency/Resilience) with 20 unlockable nodes
- **Virtual Economy** — Token currency, 20-item marketplace, cosmetics/boosts/titles
- **Tournaments** — Weekly competitions with entry fees and prize pools
- **Seasonal Leaderboards** — 30-day seasons with auto-rotation and top-10 rewards
- **Teams** — Squad formation (max 10 agents), team stats, team leaderboard
- **Cooperative Challenges** — Workspace-wide goals with shared progress

### Observability
- **Event Ingestion** — Single + batch via Redis pipeline, OTLP receiver (gRPC + HTTP)
- **Metrics** — Token usage, cost tracking, latency, hourly/daily aggregates (TimescaleDB)
- **Alerts** — Alert management with severity levels and lifecycle
- **Session Replay** — Cursor-based pagination with time range queries
- **15 Prometheus Metrics** — Request rates, pool sizes, cache ratios, DLQ depth
- **Grafana Dashboard** — 9 pre-built panels + 5 alert rules

### Cross-Product Integrations
- **OpenTrace** — Trace waterfall diagrams with span explorer
- **OpenMesh** — Mesh topology visualization with live updates
- **OpenMind** — Knowledge graph with entity search
- **OpenShield** — Compliance scores and security grades

### Platform
- **API Versioning** — /api/v1/ with backward compatibility
- **Webhook System** — HMAC-SHA256 signed delivery, 8 event types, 3x exponential retry
- **Plugin System** — Registry, install/manage lifecycle, sandboxed hook execution (5s timeout)
- **SSO** — SAML 2.0 + OIDC (Google/Okta/Azure AD) with auto-provisioning
- **Multi-Org Tenancy** — Organizations, cross-workspace analytics, agent sharing
- **CLI Plugin** — `oav` command with 10 subcommands and Rich terminal output

### User Experience
- **Onboarding Wizard** — 3-step first-run (Welcome/Connect/Verify) with guided tour
- **Notification Center** — Real-time WebSocket push, bell + dropdown + full page
- **Data Export** — Streaming CSV/JSON for agents, events, metrics
- **Collaboration** — Workspace invites, activity feed, role-based access (admin/member/viewer)
- **Mobile** — Bottom navigation, bottom sheets, pinch-to-zoom, touch interactions
- **PWA** — Manifest, service worker, offline support, add-to-home-screen

### Security & Reliability
- **Rate Limiting** — slowapi (auth 5/min, API 100/min) + nginx layer
- **JWT** — 15-min access tokens + 7-day httpOnly refresh cookies
- **Structured Logging** — structlog with JSON output, correlation IDs, PII redaction
- **Health Probes** — Liveness + readiness (checks postgres/redis)
- **Graceful Shutdown** — WebSocket drain, connection cleanup
- **OWASP Audit** — Clean bandit SAST scan
- **Fernet Encryption** — API keys and secrets encrypted at rest

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Rendering** | PixiJS 8.1 (WebGL), 3-tier LOD (full/simple/dot) |
| **3D** | Unreal Engine 5 via Pixel Streaming |
| **Animation** | GSAP 3.12, @rive-app/canvas 2.21 (progressive) |
| **State Machines** | XState 5.13 (MachineManager outside React) |
| **Frontend** | React 18, TypeScript 5.4, Vite 5.3, Tailwind CSS 3.4 |
| **Charts** | Recharts 2.12 |
| **Graphs** | ReactFlow 11.11 |
| **State** | Zustand 4.5, React Query 5.45 |
| **Backend** | FastAPI 0.110, Python 3.11+, SQLAlchemy 2.0 (async) |
| **Database** | PostgreSQL 16 + TimescaleDB (hypertables + continuous aggregates) |
| **Cache/Pubsub** | Redis 7.2 (Streams + Pub/Sub + room-based WebSocket) |
| **Task Queue** | Celery 5.4 (3 priority queues + dead letter queue) |
| **Auth** | JWT + refresh tokens + SAML 2.0 + OIDC |
| **Observability** | Prometheus + Grafana + structlog |
| **Infrastructure** | Docker Compose, Nginx, GitHub Actions CI |
| **SDK** | Python SDK with 5 framework adapters + OTLP exporter |
| **CLI** | Typer + Rich terminal output |

---

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Local Development

```bash
# Clone
git clone https://github.com/ashishkots/OpenAgentVisualizer.git
cd OpenAgentVisualizer

# Start all services
docker compose up --build -d

# Verify
curl http://localhost:8000/api/health
# {"status": "ok"}
```

**Services:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| WebSocket | ws://localhost:8001 |
| Nginx Proxy | http://localhost:8080 |
| Prometheus Metrics | http://localhost:8000/metrics |

**Default Login:**
- Email: `kotsai@gmail.com`
- Password: `kots@123`

### Production Deployment

```bash
# Copy and configure production environment
cp .env.production .env
# Edit .env — set SECRET_KEY, DATABASE_URL, REDIS_URL, FERNET_KEY

# Start production stack
docker compose -f docker-compose.prod.yml up -d

# Optional: monitoring (Prometheus + Grafana)
docker compose -f docker-compose.monitoring.yml up -d

# Optional: UE5 3D viewer (requires GPU)
docker compose -f docker-compose.ue5.yml up -d
```

### Load Testing

```bash
# Start main stack first, then:
docker compose -f docker-compose.loadtest.yml up -d
# Open Locust UI at http://localhost:8089
```

---

## Architecture

```
Agent Frameworks (LangChain, CrewAI, AutoGen, OpenAI, Anthropic)
        |
        v
   OAV SDK (Python) --- oav-cli (Terminal)
        |
   OTLP gRPC:4317 / HTTP:4318
        |
        v
+-------------------------------------------+
|          NGINX Reverse Proxy              |
|   (rate limiting, gzip, security headers) |
+--------+----------+----------+-----------+
| FastAPI | WebSocket | OTLP    | Celery   |
| REST API| Rooms    | Gateway | Workers  |
| (v1)   | (Redis)  |         | (3 queues)|
+--------+----------+----------+-----------+
|        Redis (Streams + Pub/Sub)          |
+--------+----------+-----------+-----------+
|PostgreSQL 16 + TimescaleDB               |
|(8 migrations, 50+ tables,                |
| continuous aggregates, hypertables)      |
+-------------------------------------------+
        |
        v
+-------------------------------------------+
| React 18 + PixiJS Canvas (2D)            |
| UE5 Pixel Streaming (3D, optional)       |
| XState FSMs + GSAP Animations            |
| 30+ Pages, PWA, Mobile Bottom Nav        |
+-------------------------------------------+
```

---

## Project Structure

```
OpenAgentVisualizer/
├── src/
│   ├── backend/                    # FastAPI application
│   │   ├── app/
│   │   │   ├── core/              # Config, database, auth, metrics, rate limiting, logging
│   │   │   ├── models/            # 15+ SQLAlchemy models
│   │   │   ├── routers/           # 20+ API routers
│   │   │   ├── schemas/           # Pydantic request/response models
│   │   │   ├── services/          # Business logic services
│   │   │   ├── tasks/             # Celery tasks (20+)
│   │   │   ├── middleware/        # Correlation ID, API versioning
│   │   │   └── data/             # Seed data (quests, skills, shop, plugins)
│   │   ├── alembic/versions/      # 8 migrations
│   │   ├── tests/                 # 30+ test files
│   │   ├── Dockerfile.prod        # Multi-stage production build
│   │   └── requirements.txt
│   ├── frontend/                   # React application
│   │   ├── src/
│   │   │   ├── pages/            # 30+ pages
│   │   │   ├── components/       # 80+ components
│   │   │   ├── canvas/           # PixiJS rendering engine
│   │   │   ├── machines/         # XState FSM definitions
│   │   │   ├── stores/           # 15+ Zustand stores
│   │   │   ├── hooks/            # 20+ React Query hooks
│   │   │   └── types/            # TypeScript type definitions
│   │   ├── public/               # PWA manifest, service worker, icons
│   │   ├── e2e/                  # Playwright E2E tests
│   │   ├── Dockerfile.prod       # Multi-stage production build
│   │   └── package.json
│   ├── sdk/                       # Python SDK
│   │   ├── openagentvisualizer/
│   │   │   ├── core/            # Tracer, event models
│   │   │   ├── adapters/        # LangChain, CrewAI, AutoGen, OpenAI, Anthropic
│   │   │   └── exporters/       # OTLP, REST
│   │   └── tests/
│   └── cli/                       # CLI plugin (oav command)
│       ├── oav_cli/
│       │   ├── commands/         # status, events, metrics, config, etc.
│       │   ├── client.py         # API client
│       │   └── display.py        # Rich terminal formatting
│       └── pyproject.toml
├── agents/                         # Pipeline docs + handoff YAMLs
├── docs/
│   ├── superpowers/
│   │   ├── specs/                # 14 design specifications
│   │   └── plans/                # 7 implementation plans
│   ├── api-specification.md
│   ├── database-schema.md
│   ├── sprint-backlog.md          # 7 sprints, 125 features
│   └── ...
├── deploy/
│   ├── nginx/                    # dev.conf + prod.conf
│   ├── prometheus/               # prometheus.yml + alerts.yml
│   └── grafana/                  # Pre-built dashboards
├── tests/load/                    # Locust load tests
├── docker-compose.yml             # Development stack (9 services)
├── docker-compose.prod.yml        # Production stack
├── docker-compose.monitoring.yml  # Prometheus + Grafana
├── docker-compose.ue5.yml         # UE5 Pixel Streaming
├── docker-compose.loadtest.yml    # Locust load testing
├── .github/workflows/ci.yml      # GitHub Actions (7 jobs)
├── .env.production                # Production env template
└── CLAUDE.md                      # AI developer instructions
```

---

## SDK & Framework Support

| Framework | Adapter | Status |
|-----------|---------|--------|
| LangChain | `langchain_adapter.py` | Supported |
| CrewAI | `crewai_adapter.py` | Supported |
| AutoGen | `autogen_adapter.py` | Supported |
| OpenAI | `openai_adapter.py` | Supported |
| Anthropic | `anthropic_adapter.py` | Supported |
| Custom | OTLP HTTP/gRPC | Supported |

---

## API Overview

**100+ endpoints** organized by domain:

| Domain | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 4 | Register, login, refresh, SSO |
| Agents | 8 | CRUD, stats, skills, quests |
| Events | 5 | Ingest, batch, replay, export |
| Gamification | 6 | Leaderboard, achievements, XP |
| Quests | 3 | List, agent progress, claim |
| Skills | 3 | Trees, agent skills, unlock |
| Wallet | 2 | Balance, transactions |
| Shop | 5 | Browse, buy, inventory, equip |
| Tournaments | 4 | List, enter, leaderboard |
| Seasons | 2 | Current, leaderboard |
| Teams | 6 | CRUD, members, stats |
| Challenges | 3 | List, detail, progress |
| Notifications | 4 | List, read, mark all, count |
| Export | 3 | Agents, events, metrics (CSV/JSON) |
| Webhooks | 6 | CRUD, deliveries, test |
| Plugins | 6 | Registry, install, manage |
| SSO | 7 | SAML/OIDC flows, config |
| Organizations | 9 | CRUD, members, workspaces, analytics |
| Shared Agents | 3 | Share, list, revoke |
| Integrations | 12 | OpenTrace/Mesh/Mind/Shield |
| Health | 3 | Live, ready, status |
| Metrics | 2 | Aggregates, Prometheus |
| Admin | 2 | DLQ list, retry |

Full interactive docs at `/docs` (Swagger UI).

---

## Development

### Sprint History

| Sprint | Theme | Features |
|--------|-------|----------|
| 1 | Backend Core | 19 — Auth, agents, events, OTLP, gamification, WebSocket |
| 2 | 2D Visualization | 25 — PixiJS canvas, XState FSMs, ReactFlow, 9 dashboard pages |
| 3 | 3D + Integrations | 10 — UE5 viewer, 4 cross-product integrations, CLI, CI/CD |
| 4 | Scale & Harden | 20 — Load testing, rate limiting, JWT refresh, health probes |
| 5 | User Experience | 18 — Onboarding, notifications, export, collaboration, PWA |
| 6 | Gamification | 14 — Quests, skills, economy, tournaments, teams, challenges |
| 7 | Platform | 19 — API versioning, webhooks, plugins, SSO, multi-org |
| **Total** | | **125 features** |

### Architecture Decisions

10 ADRs documented in `docs/superpowers/specs/`:
- ADR-001: Imperative PixiJS (not declarative @pixi/react)
- ADR-002: XState MachineManager outside React tree
- ADR-003: Redis Pub/Sub for WebSocket room routing
- ADR-004: Pre-computed relationship graph via Celery
- ADR-005: TimescaleDB continuous aggregates
- ADR-006: UE5 fallback-first (2D baseline, 3D progressive)
- ADR-007: Shared circuit breaker pattern for integrations
- ADR-008: Dual config (env + DB) with Fernet encryption
- ADR-009: CLI API key auth
- ADR-010: Prometheus /metrics without auth

---

## License

[Functional Source License (FSL)](https://fsl.software/) — converts to MIT after 2 years.

---

Built with the Open* Suite | [ashishkots](https://github.com/ashishkots)
