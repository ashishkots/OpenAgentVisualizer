# OpenAgentVisualizer Sprint Backlog

## Sprint 1: Core Visualization Platform (Complete)

### Completed Features

| ID | Feature | Status |
|----|---------|--------|
| OAV-001 | Auth (register/login with JWT + bcrypt) | Done |
| OAV-002 | Workspace and membership management | Done |
| OAV-003 | Agent CRUD with gamification fields (level, XP) | Done |
| OAV-004 | Task management per agent | Done |
| OAV-005 | Event ingestion (single + batch via Redis pipeline) | Done |
| OAV-006 | TimescaleDB hypertables for events and metrics | Done |
| OAV-007 | OTLP JSON trace receiver | Done |
| OAV-008 | Span storage (OTLP-compatible) | Done |
| OAV-009 | Session management | Done |
| OAV-010 | Gamification system (XP, leaderboard, leveling) | Done |
| OAV-011 | Metrics collection (tokens, cost, latency) | Done |
| OAV-012 | Hourly metrics aggregation | Done |
| OAV-013 | Alert management | Done |
| OAV-014 | WebSocket live event streaming | Done |
| OAV-015 | Audit logging | Done |
| OAV-016 | API key management | Done |
| OAV-017 | Nginx reverse proxy | Done |
| OAV-018 | Docker Compose (TimescaleDB + Redis + Celery + nginx) | Done |
| OAV-019 | Backend test suite (13 test files) | Done |

---

## Sprint 2: 2D/3D Visualization and Frontend (Complete)

### Frontend - Canvas Rendering

| ID | Task | Priority | Status |
|----|------|----------|--------|
| OAV-201 | PixiJS 2D agent visualization canvas | High | Done |
| OAV-202 | Agent state machine visualization (XState) | High | Done |
| OAV-203 | Interactive topology graph (ReactFlow) | High | Done |
| OAV-204 | Animated agent transitions (GSAP) | Medium | Done |
| OAV-205 | Rive animations for agent states (GSAP fallback, Rive progressive) | Medium | Done |
| OAV-206 | Real-time canvas updates via WebSocket | High | Done |

### Frontend - Dashboard Pages

| ID | Task | Priority | Status |
|----|------|----------|--------|
| OAV-211 | Main dashboard (agent grid, metrics charts) | High | Done |
| OAV-212 | Agent detail page (stats, event timeline, 5 tabs) | High | Done |
| OAV-213 | Gamification leaderboard page | High | Done |
| OAV-214 | Metrics/analytics dashboard (Recharts) | Medium | Done |
| OAV-215 | Alert management page | Medium | Done |
| OAV-216 | Session viewer with replay controls | Medium | Done |
| OAV-217 | Settings page (workspace, API keys) | Low | Done |

### Backend Enhancements

| ID | Task | Priority | Status |
|----|------|----------|--------|
| OAV-221 | WebSocket room support (per-agent filtering via Redis Pub/Sub) | High | Done |
| OAV-222 | Event replay for historical visualization (cursor pagination) | Medium | Done |
| OAV-223 | Agent relationship graph computation (Celery + Redis cache) | Medium | Done |
| OAV-224 | Gamification achievement system (10 achievements, Celery eval) | Medium | Done |
| OAV-225 | Continuous aggregates for metrics (TimescaleDB hourly/daily) | Medium | Done |

### Testing Tasks

| ID | Task | Priority | Status |
|----|------|----------|--------|
| OAV-231 | PixiJS canvas rendering tests | High | Done |
| OAV-232 | XState machine transition tests | High | Done |
| OAV-233 | Frontend Vitest component tests (104+ cases, 17 files) | High | Done |
| OAV-234 | WebSocket stress testing | Medium | Done |
| OAV-235 | E2E tests with Playwright | Low | Deferred to Sprint 3 |

### DevOps Tasks

| ID | Task | Priority | Status |
|----|------|----------|--------|
| OAV-241 | GitHub Actions CI pipeline | High | Pending |
| OAV-242 | Production Dockerfile (multi-stage) | Medium | Pending |
| OAV-243 | Prometheus metrics endpoint | Medium | Pending |

### Pipeline Artifacts

| Stage | Agent | Artifact | Path |
|-------|-------|----------|------|
| 1.1 | Product Manager | Sprint 2 PRD | docs/superpowers/specs/2026-03-27-sprint2-prd.md |
| 1.2 | UX Designer | Wireframes + Interaction Flows | docs/superpowers/specs/2026-03-27-sprint2-ux-wireframes.md |
| 1.3 | UI Designer | Visual Design System | docs/superpowers/specs/2026-03-27-sprint2-ui-design-system.md |
| 2.1 | Tech Lead | Architecture (5 ADRs) | docs/superpowers/specs/2026-03-27-sprint2-architecture.md |
| 2.2a | Frontend Expert | Canvas + FSM + Dashboard | src/frontend/src/ |
| 2.2b | Backend Expert | Rooms + Achievements + Replay | src/backend/app/ |
| 2.3 | Code Reviewer | Review Report (Conditional Pass) | docs/superpowers/specs/2026-03-27-sprint2-code-review.md |
| 2.4 | QA Engineer | QA Report (Pass) | docs/superpowers/specs/2026-03-27-sprint2-qa-report.md |
| 2.5 | Agentic AI Expert | SDK Validation | In Progress |

### Key Architecture Decisions (Sprint 2)

- **ADR-001**: Imperative PixiJS (not @pixi/react declarative) for sprite pooling + GSAP control
- **ADR-002**: XState MachineManager outside React to avoid cascading re-renders at 50+ agents
- **ADR-003**: Redis Pub/Sub channels for WebSocket room routing
- **ADR-004**: Pre-computed agent relationship graph via Celery (Redis 5-min TTL)
- **ADR-005**: TimescaleDB continuous aggregates replace manual metrics aggregation

### Code Review Findings (Fixed)

- XP threshold frontend/backend mismatch — aligned to PRD values
- CameraController event listener memory leak — stored pre-bound refs
- WorldRenderer ticker function leak — stored bound tick reference
- 4 API endpoint mismatches (LeaderboardPage, WebSocket format, AgentDetail, Topology) — all fixed by QA

---

## Sprint 3: 3D Viewer and Integrations

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| OAV-301 | Unreal Engine 3D viewer integration | High | 10d |
| OAV-302 | OpenTrace integration (visualize traces) | High | 3d |
| OAV-303 | OpenMesh integration (workflow visualization) | High | 3d |
| OAV-304 | OpenMind integration (knowledge graph viz) | Medium | 3d |
| OAV-305 | OpenShield integration (security posture viz) | Medium | 2d |
| OAV-306 | CLI plugin for Claude Code / Codex | Medium | 5d |
| OAV-235 | E2E tests with Playwright (deferred from Sprint 2) | Low | 3d |
| OAV-241 | GitHub Actions CI pipeline (deferred from Sprint 2) | High | 1d |
| OAV-242 | Production Dockerfile (deferred from Sprint 2) | Medium | 1d |
| OAV-243 | Prometheus metrics endpoint (deferred from Sprint 2) | Medium | 1d |

---

## Velocity Notes

- Sprint 1 delivered 19 features: full backend platform
- Sprint 2 delivered 25 features: full visualization + dashboard frontend, backend enhancements
  - 10 pipeline stages executed (PM → UX → UI → TL → FE + BE parallel → CR → QA → AAI)
  - 3 critical bugs caught and fixed by Code Review
  - 4 non-critical API mismatches fixed by QA
  - 166+ total test cases (104+ frontend, 62+ backend new)
  - 5 architecture decision records
  - Full gamification: 10-level XP, 10 achievements, leaderboard with time/category scoping
  - Scene graph: PixiJS canvas with sprite pooling, 60fps at 50+ agents
  - State machines: XState v5 FSM with MachineManager pattern
  - Real-time: WebSocket rooms via Redis Pub/Sub with sequence recovery
- Key visualization libraries fully integrated: PixiJS, XState, ReactFlow, GSAP (Rive deferred as progressive enhancement)
