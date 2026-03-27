# OpenAgentVisualizer — Pipeline Configuration

## Pipeline Overview

3-track parallel pipeline with sync gates. Tracks execute concurrently where dependencies allow. Circuit breakers enforce time limits at every level.

```
Track 1 (Product)      ──→ PM [1.1] ──→ UX [1.2] ──→ UI [1.3] ─────────────────────────┐
                              │              │                                             │
                         [Gate A]       [Gate B]                                          │
                              │              │                                             ▼
Track 2 (Engineering)  ──→ TL [2.1] ──→ BE [2.2b] + FE [2.2a] (parallel) ──→ CR [2.3] ──→ QA [2.4] ──→ AAI [2.5] ──→ [Convergence]
                                                                                                                        ▲
Track 3 (DevOps)       ─────────────────────────────────────────────────────────────────── DevOps [Convergence] ────────┘
```

---

## Track 1: Product

| Stage | Agent | Input | Output | Timeout |
|-------|-------|-------|--------|---------|
| 1.1 | **Product Manager** | PRD, user stories, gamification requirements | Requirements specification, acceptance criteria, virtual world feature scope, gamification mechanics definition | 60 min |
| 1.2 | **UX Designer** | Requirements spec (via Gate A) | User journeys, wireframes for virtual world canvas, agent avatar interaction flows, dashboard information architecture, replay UX | 60 min |
| 1.3 | **UI Designer** | UX wireframes | Visual design system, PixiJS canvas theme tokens, agent avatar visual specs, animation timing specs, Rive asset requirements, color palette for agent states | 60 min |

---

## Track 2: Engineering

| Stage | Agent | Input | Output | Timeout |
|-------|-------|-------|--------|---------|
| 2.1 | **Tech Lead** | Requirements spec (via Gate A), PRD | Architecture design, PixiJS scene graph design, XState FSM architecture, real-time pipeline design (Redis Streams + WebSocket), OTLP ingestion architecture, task breakdown | 60 min |
| 2.2a | **Frontend Expert** | Architecture design (from TL), UX wireframes (via Gate B) | PixiJS virtual world canvas, XState agent state machines, GSAP/Rive animations, ReactFlow topology graph, dashboard pages, WebSocket client, Zustand stores | 60 min |
| 2.2b | **Backend Expert** | Architecture design (from TL) | OTLP gRPC/HTTP receiver, Redis Streams event pipeline, Celery background tasks, gamification engine, cost tracking, metrics aggregation, alert management, session replay API, WebSocket server | 60 min |
| 2.3 | **Code Reviewer** | FE + BE implementations | Review findings, approval/rejection, quality report | 60 min |
| 2.4 | **QA Engineer** | Reviewed code, acceptance criteria | Test results, canvas rendering tests, WebSocket reliability tests, OTLP ingestion tests, gamification logic tests, coverage report | 60 min |
| 2.5 | **Agentic AI Expert** | All implementations, architecture design | SDK adapter validation (LangChain, CrewAI, AutoGen, OpenAI, Anthropic), OTLP conformance review, agent lifecycle correctness, loop detection validation | 60 min |

**Notes:**
- Stages 2.2a and 2.2b execute in parallel.
- Frontend Expert (2.2a) waits for Gate B (UX wireframes). Backend Expert (2.2b) does NOT wait for Gate B — starts after Gate A.

---

## Track 3: DevOps

| Stage | Agent | Input | Output | Timeout |
|-------|-------|-------|--------|---------|
| Convergence | **DevOps Platform** | All track outputs | CI/CD pipeline, Docker Compose validation, TimescaleDB + Redis infrastructure verification, deployment artifacts, environment config | 60 min |

---

## Sync Gates

### Gate A: Requirements Approved
- **Trigger:** PM completes requirements specification (Stage 1.1)
- **Unlocks:** Track 2 (Tech Lead begins architecture design); UX Designer begins wireframes
- **Criteria:** Requirements document exists, acceptance criteria defined, virtual world feature scope decided, gamification mechanics specified, no CRITICAL ambiguities
- **Gate owner:** Product Manager

### Gate B: UX Wireframes Approved
- **Trigger:** UX Designer completes wireframes (Stage 1.2)
- **Unlocks:** Frontend Expert (Stage 2.2a) begins canvas and UI implementation
- **Criteria:** Virtual world canvas wireframes complete, agent avatar interaction flows defined, dashboard layout approved, replay UX specified
- **Gate owner:** UX Designer
- **Note:** Backend Expert (2.2b) does NOT wait for Gate B — starts after Gate A

---

## Circuit Breakers

| Level | Timeout | Action on Breach |
|-------|---------|-----------------|
| **Stage** | 60 minutes | Agent must checkpoint, emit INCOMPLETE status, and hand off to next stage with partial artifacts |
| **Track** | 4 hours | Track halted, Project Manager notified, all agents in track must checkpoint |
| **Pipeline** | 8 hours | Full pipeline halt, all agents checkpoint, human escalation triggered |

**Rules:**
- Circuit breakers are non-negotiable. No agent may extend its own timeout.
- On stage timeout, the agent emits a handoff with `status: INCOMPLETE` listing completed and remaining work.
- The Project Manager monitors all circuit breaker events and adjusts scheduling accordingly.

---

## Convergence Gate

**Trigger:** All active tracks complete (Track 1 + Track 2 + Track 3).

**Required sign-offs:**
1. **DevOps Platform** — Confirms CI/CD pipeline passes, Docker Compose stack healthy (PostgreSQL + TimescaleDB + Redis + Celery + backend + frontend), deployment artifacts valid
2. **Project Manager** — Confirms all deliverables received, no unresolved blockers, timeline met
3. **QA Engineer** — Confirms test coverage >= 80%, all acceptance criteria verified, no CRITICAL bugs

**Convergence criteria:**
- All track stages have `status: COMPLETE` or `status: APPROVED`
- No CRITICAL findings from Code Reviewer or QA Engineer
- PixiJS virtual world canvas renders 50+ agent avatars at 60fps
- XState agent FSMs correctly transition through all defined states (idle, active, waiting, error, complete)
- OTLP gRPC (port 4317) and HTTP (port 4318) receivers accept and process spans
- WebSocket real-time push delivers events to frontend within 2 seconds
- Redis Streams event pipeline processes events without data loss
- Gamification engine correctly calculates XP, levels, and achievements
- SDK adapters (LangChain, CrewAI, AutoGen, OpenAI, Anthropic) successfully emit events
- Loop detection fires alerts on detected agent loops
- Cost tracking per agent produces accurate reports
- Session replay API serves historical event data correctly
- All cross-product integration points (OpenTrace, OpenHandoff, OpenMind) documented

**On convergence failure:**
- Project Manager identifies failing criteria
- Relevant agents are re-invoked to address gaps
- Pipeline does not exceed 8-hour total circuit breaker

---

## Parallel Execution Rules

1. Stages 2.2a (Frontend Expert) and 2.2b (Backend Expert) execute in parallel.
2. Track 1 stages execute sequentially: PM -> UX -> UI.
3. Track 2 begins after Gate A unlocks it (TL starts).
4. Frontend Expert (2.2a) additionally waits for Gate B (UX wireframes).
5. Backend Expert (2.2b) starts immediately after TL completes — does not wait for Gate B.
6. No other stages within a track may execute in parallel unless explicitly marked.

---

## OpenAgentVisualizer-Specific Pipeline Notes

### Rendering Pipeline Validation
The PixiJS rendering pipeline requires specific validation at each stage:
- **TL (2.1):** Scene graph architecture must support dynamic agent avatar addition/removal at runtime
- **FE (2.2a):** Canvas must maintain 60fps with 50+ animated agent sprites; XState machines must not leak memory on agent disconnect
- **QA (2.4):** Rendering performance benchmarks must accompany all canvas code changes
- **AAI (2.5):** SDK adapters must correctly map framework-specific agent states to the XState FSM model

### Real-Time Event Pipeline Validation
- **BE (2.2b):** Redis Streams consumer must handle backpressure; WebSocket manager must handle 100+ concurrent connections
- **QA (2.4):** Event ordering tests must verify causal ordering is preserved from OTLP ingestion through WebSocket delivery
- **DevOps:** Redis and Celery health checks must be configured in Docker Compose

### Gamification System Validation
- **PM (1.1):** Gamification mechanics must be balanced — XP curves, level thresholds, and achievement conditions defined with specific numbers
- **BE (2.2b):** Gamification service must be idempotent — duplicate events must not award duplicate XP
- **QA (2.4):** Edge cases tested: agent disconnect mid-workflow, rapid state transitions, concurrent XP awards
