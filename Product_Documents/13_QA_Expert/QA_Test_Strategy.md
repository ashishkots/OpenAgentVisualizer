# OpenAgentVisualizer -- QA Test Strategy

**Stage:** 6.1 -- QA Expert
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** QA Expert Agent
**Depends On:** System Architecture (4.1), Frontend Implementation (5.1), Backend Implementation (5.2), PRD (1.1), Gamification System Design (1.2)
**Feeds Into:** DevOps (Convergence)

---

## Table of Contents

1. [QA Strategy Overview](#1-qa-strategy-overview)
2. [Test Pyramid](#2-test-pyramid)
3. [Unit Test Plan](#3-unit-test-plan)
4. [Integration Test Plan](#4-integration-test-plan)
5. [End-to-End Test Plan](#5-end-to-end-test-plan)
6. [Performance Test Plan](#6-performance-test-plan)
7. [Security Test Plan](#7-security-test-plan)
8. [Accessibility Test Plan](#8-accessibility-test-plan)
9. [Gamification Test Plan](#9-gamification-test-plan)
10. [CI/CD Pipeline Tests](#10-cicd-pipeline-tests)
11. [Test Data & Environment Management](#11-test-data--environment-management)

---

## 1. QA Strategy Overview

### 1.1 Testing Philosophy

- **Shift-left:** Catch defects at the earliest possible stage. Unit tests run on every save (watch mode); integration tests run pre-commit; E2E tests run in CI.
- **Risk-based:** Prioritize test coverage on high-risk areas: real-time event pipeline, XP calculation accuracy, authentication, and financial data (cost attribution).
- **Contract-driven:** API contracts from System Architecture (4.1) are the source of truth. Backend and frontend tests validate against the same schema definitions.
- **Deterministic:** All tests must be deterministic. No flaky tests allowed in the main branch. Time-dependent tests use frozen clocks. Random data uses seeded generators.

### 1.2 Quality Gates

| Gate | Trigger | Pass Criteria |
|------|---------|---------------|
| Pre-commit | `git commit` | Lint + format + type-check pass |
| PR Check | Pull request opened/updated | All unit tests pass, integration tests pass, coverage >= thresholds |
| Merge Gate | PR approved + checks green | Code reviewer approval + all PR checks pass |
| Pre-deploy | `workflow_dispatch` deploy action | Full E2E suite pass on staging, smoke tests pass, no critical/high vulnerabilities |
| Post-deploy | After production deploy | Smoke test suite (health, login, agent register, event ingest) passes within 5 min |

### 1.3 Test Environments

| Environment | Purpose | Infrastructure | Data |
|-------------|---------|---------------|------|
| Local Dev | Developer testing | `docker compose up` (PostgreSQL+TimescaleDB, Redis, backend, frontend) | Seed data via `seed_default_user()` + factory fixtures |
| CI | Automated pipeline | GitHub Actions + testcontainers (PostgreSQL, Redis) | Ephemeral per-run |
| Staging | Pre-production validation | Mirror of production infrastructure | Synthetic data + anonymized production samples |
| Production | Live monitoring | Full infrastructure | Real data, smoke tests only |

### 1.4 Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Backend Unit/Integration | pytest 8.x + pytest-asyncio | Async test runner, fixtures |
| Backend Coverage | pytest-cov | Line + branch coverage reporting |
| Backend Factories | factory-boy + faker | Model instance generation |
| Backend Containers | testcontainers 4.x | Ephemeral PostgreSQL + Redis in CI |
| Frontend Unit | Vitest 1.x | Fast Vite-native test runner |
| Frontend DOM | @testing-library/react 16.x | Component rendering + assertions |
| Frontend Mocks | MSW 2.x | API request interception |
| E2E | Playwright 1.x | Cross-browser E2E testing |
| Performance (API) | k6 | HTTP + WebSocket load testing |
| Performance (Frontend) | Lighthouse CI + Chrome DevTools Protocol | FPS, LCP, bundle analysis |
| Security | OWASP ZAP + npm audit + safety | DAST + dependency scanning |
| Accessibility | axe-core + Playwright a11y | WCAG 2.2 AA compliance |
| API Contract | Schemathesis | OpenAPI schema fuzzing |

---

## 2. Test Pyramid

### 2.1 Distribution

```
         /\
        /  \    E2E Tests (5%)
       / 30 \   ~30 test scenarios
      /------\
     /        \  Integration Tests (20%)
    /   ~200   \ ~200 test cases
   /------------\
  /              \ Unit Tests (75%)
 /    ~1,500+     \ ~1,500 test cases
/------------------\
```

### 2.2 Coverage Targets by Layer

| Layer | Line Coverage | Branch Coverage | Rationale |
|-------|-------------|----------------|-----------|
| Backend Services | >= 90% | >= 85% | Core business logic (XP calc, alerts, event processing) |
| Backend Routers | >= 85% | >= 80% | Request validation, auth checks, error handling |
| Backend Repositories | >= 80% | >= 75% | Database queries; integration tests cover most paths |
| Backend Models | >= 95% | >= 90% | Property methods, validators, computed fields |
| Frontend Stores | >= 90% | >= 85% | State management logic, selectors, actions |
| Frontend Hooks | >= 85% | >= 80% | Data fetching, WebSocket handling, side effects |
| Frontend Components | >= 80% | >= 75% | Rendering, user interactions, conditional display |
| Frontend XState Machines | >= 95% | >= 90% | All states + transitions must be tested |
| Frontend Canvas (PixiJS) | >= 60% | >= 50% | Visual rendering harder to unit test; rely on E2E |

### 2.3 Coverage Enforcement

- CI blocks merge if any module drops below its threshold
- `pytest-cov` with `--cov-fail-under` per-module configuration
- Vitest `coverage.thresholds` in vitest.config.ts
- Coverage reports uploaded to PR as comments

---

## 3. Unit Test Plan

### 3.1 Backend Unit Tests (pytest)

#### 3.1.1 Auth Service (`test_auth_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| AUTH-U01 | Register user with valid data | email, password, display_name | User created, workspace auto-created, API key generated, tokens returned |
| AUTH-U02 | Register with duplicate email | existing email | 409 Conflict |
| AUTH-U03 | Register with invalid email format | "not-an-email" | 422 Validation Error |
| AUTH-U04 | Register with short password | 5-char password | 422 Validation Error (min 8) |
| AUTH-U05 | Login with correct credentials | valid email + password | JWT access + refresh tokens returned |
| AUTH-U06 | Login with wrong password | valid email + wrong password | 401 Unauthorized |
| AUTH-U07 | Login with non-existent email | unknown@example.com | 401 Unauthorized (no user enumeration) |
| AUTH-U08 | Refresh token with valid refresh | valid refresh_token | New access + rotated refresh token |
| AUTH-U09 | Refresh token with expired refresh | expired JWT | 401 Unauthorized |
| AUTH-U10 | Refresh token with revoked token | blocklisted refresh | 401 Unauthorized |
| AUTH-U11 | Password hash uses bcrypt 4.0.1 | any password | Hash starts with `$2b$` |
| AUTH-U12 | JWT contains correct claims | login response | `sub`, `exp`, `iat`, `workspace_id` present |
| AUTH-U13 | Account lockout after 5 failed logins | 5 wrong passwords | 429 Too Many Requests, 15-min lockout |

#### 3.1.2 Agent Service (`test_agent_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| AGT-U01 | Register agent | valid agent payload | Agent created with state=idle, xp=0, level=1 |
| AGT-U02 | Register duplicate external_id in same workspace | same workspace_id + external_id | 409 Conflict |
| AGT-U03 | Register same external_id in different workspace | different workspace_id | Success (allowed) |
| AGT-U04 | List agents with filters | state=working, framework=langchain | Only matching agents returned |
| AGT-U05 | List agents pagination | page=2, page_size=10, total=25 | 10 agents, page=2, total=25 |
| AGT-U06 | Get agent with full details | valid agent_id | Agent + achievements + recent_activity |
| AGT-U07 | Update agent config | name, role, avatar_config | Updated fields returned |
| AGT-U08 | Heartbeat updates last_heartbeat | agent heartbeat payload | last_heartbeat updated to NOW |
| AGT-U09 | Heartbeat updates state | state="working" in heartbeat | current_state updated to "working" |
| AGT-U10 | Agent state transition validation | idle -> working | Valid, state updated |
| AGT-U11 | Invalid state transition | completed -> working (without idle) | 422 Invalid Transition |
| AGT-U12 | Deactivate agent | DELETE /agents/{id} | is_active=false (soft delete) |

#### 3.1.3 Task Service (`test_task_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| TSK-U01 | Create task | valid task payload | Task created, status=pending |
| TSK-U02 | Assign task to agent | task_id + agent_id | TaskAssignment created, status=assigned |
| TSK-U03 | Start assigned task | assignment start | status=in_progress, agent state=working |
| TSK-U04 | Complete task with result | result_data, tokens, cost | TaskResult created, status=completed, XP awarded |
| TSK-U05 | Fail task | error details | status=failed, error_count incremented |
| TSK-U06 | Auto-classify complexity (trivial) | 1 tool call, <100 tokens, <5s | complexity="trivial" |
| TSK-U07 | Auto-classify complexity (critical) | 10+ handoffs, 50K tokens, 5min | complexity="critical" |
| TSK-U08 | Delegate task to another agent | delegated_to agent_id | Original assignment status=delegated, new assignment created |
| TSK-U09 | Cancel pending task | cancel request | status=cancelled |
| TSK-U10 | List tasks with status filter | status=in_progress | Only in-progress tasks |

#### 3.1.4 Event Service (`test_event_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| EVT-U01 | Ingest single event | valid event payload | Event written to Redis Stream |
| EVT-U02 | Ingest bulk events | 100 events batch | All 100 written to Redis Stream |
| EVT-U03 | Reject event with missing trace_id | no trace_id | 422 Validation Error |
| EVT-U04 | Reject event with invalid event_type | unknown type | 422 Validation Error |
| EVT-U05 | Reject payload exceeding 16MB | oversized payload | 413 Payload Too Large |
| EVT-U06 | Event fan-out to pub/sub | valid event | Published to `oav:ws:{workspace_id}` channel |
| EVT-U07 | Dead letter on processing failure | malformed event_data | Written to `oav:deadletter` stream |

#### 3.1.5 XP Service (`test_xp_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| XP-U01 | Task completion XP (trivial) | base=5, quality=1.0, no mods | 5 XP |
| XP-U02 | Task completion XP (medium, good quality) | base=40, quality=0.78 (1.25x), streak 3-day (1.05x) | floor(40*1.25*1.0*1.05) = 52 XP |
| XP-U03 | Task completion XP with efficiency bonus | base=40, actual=$0.05, expected=$0.08 | efficiency_xp = 40*(1-0.05/0.08) = 15, total = 52+15 = 67 XP |
| XP-U04 | Critical task with perfect quality | base=250, quality=0.97 (2.0x), novelty (1.3x), streak 7-day (1.15x), efficiency 62 | floor(250*2.0*1.3*1.15)+62 = 809 XP |
| XP-U05 | Poor quality trivial task | base=5, quality=0.25 (0.5x) | floor(5*0.5) = 2 XP |
| XP-U06 | Diminishing returns after 20 repetitions | 25th identical task, medium, good | floor(40*1.25*0.5*1.0) = 25 XP |
| XP-U07 | Diminishing returns after 50 repetitions | 55th identical task | 0.25x difficulty modifier |
| XP-U08 | Level-up detection | xp_before=95, xp_earned=10 | Level 1 -> Level 2 (threshold 100) |
| XP-U09 | Multi-level-up detection | xp_before=90, xp_earned=500 | Level 1 -> Level 3 |
| XP-U10 | Level formula correctness | level=10 | XP_required = floor(100 * 10^1.8) = 6310 |
| XP-U11 | Level formula correctness (level 50) | level=50 | XP_required = floor(100 * 50^1.8) = 122474 |
| XP-U12 | Uptime XP accrual (0-24h) | 10 hours error-free | 10*2 = 20 XP |
| XP-U13 | Uptime XP accrual (7+ days) | 8 days error-free, 1 hour | 8 XP |
| XP-U14 | Uptime XP daily cap enforcement | 25 hours at 0-24h rate | capped at 48 XP |
| XP-U15 | Streak bonus (30+ days) | 35-day streak | 1.3x multiplier (cap) |
| XP-U16 | Streak reset on error | error event | streak_days = 0 |
| XP-U17 | XP ledger entry created | any XP award | xp_before, xp_after, breakdown JSONB recorded |
| XP-U18 | Weekly bonus pool calculation | total_weekly_xp=1000, rank_mod=1.0 | floor(1000*0.1*1.0) = 100 XP |

#### 3.1.6 Achievement Service (`test_achievement_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| ACH-U01 | First Steps unlock | agent completes 1st task | Achievement #1 unlocked, 50 XP bonus |
| ACH-U02 | Getting Warmed Up unlock | 10 tasks in one day | Achievement #2 unlocked, 100 XP |
| ACH-U03 | Century Club unlock | 100 total tasks | Achievement #3 unlocked, 500 XP |
| ACH-U04 | Clean Sweep unlock | 10 consecutive tasks quality > 0.9 | Achievement #9 unlocked, 300 XP |
| ACH-U05 | Always On unlock | 24-hour uptime streak | Achievement #16 unlocked, 200 XP |
| ACH-U06 | Duplicate unlock prevention | trigger same achievement twice | Second attempt is no-op |
| ACH-U07 | Secret achievement hidden until unlocked | query achievements list | Secret achievements show as "???" |
| ACH-U08 | Secret revealed to workspace after unlock | one agent unlocks secret | Name + criteria visible to all, marked "Secret" |
| ACH-U09 | Achievement notification broadcast | any unlock | Notification created for all workspace users |
| ACH-U10 | Pin limit enforcement | pin 4th achievement | 422 Error (max 3 pins) |

#### 3.1.7 Leaderboard Service (`test_leaderboard_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| LDB-U01 | Compute individual ranking | 5 agents with known scores | Correct rank ordering |
| LDB-U02 | Composite score weights | known productivity/quality/efficiency/reliability | Score = (P*0.3 + Q*0.3 + E*0.2 + R*0.2)*1000 |
| LDB-U03 | Trivial tasks excluded | agent with only trivial tasks | Score = 0 |
| LDB-U04 | Quality gate (< 0.5 excluded) | tasks with quality < 0.5 | Tasks excluded from leaderboard |
| LDB-U05 | Diminishing returns on repetition | 25th identical task type | 50% contribution |
| LDB-U06 | Team score normalization | team of 5 agents | Team_Score = sum / 5^0.7 * activity_factor |
| LDB-U07 | Tie-breaking rules | two agents same score | Higher quality wins; then fewer errors; then earlier registration |
| LDB-U08 | Time window filtering | weekly window | Only tasks from current week included |
| LDB-U09 | Snapshot creation | compute + save | LeaderboardSnapshot row created with rankings JSONB |
| LDB-U10 | Cache invalidation | new computation | Redis leaderboard cache updated |

#### 3.1.8 Alert Service (`test_alert_service.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| ALT-U01 | Create alert rule | loop_detection rule | Rule saved, is_enabled=true |
| ALT-U02 | Evaluate cost threshold rule | cost > threshold | Alert fired, severity from rule |
| ALT-U03 | Evaluate error rate rule | error_rate > 0.1 in 15min | Alert fired |
| ALT-U04 | Cooldown enforcement | same rule fires within cooldown | Alert suppressed |
| ALT-U05 | Alert acknowledge | user acknowledges alert | status=acknowledged, acknowledged_by set |
| ALT-U06 | Alert resolve | alert condition clears | status=resolved, resolved_at set |
| ALT-U07 | Loop detection alert | agent repeats >20 identical actions | Loop alert with agent_id and action details |
| ALT-U08 | Agent offline detection | no heartbeat for 90 seconds | Agent offline alert |
| ALT-U09 | Notification channels dispatch | webhook + slack configured | Both channels notified |
| ALT-U10 | Disabled rule skipped | is_enabled=false | No evaluation performed |

#### 3.1.9 PII Detector Service (`test_pii_detector.py`)

| Test ID | Test Case | Input | Expected |
|---------|-----------|-------|----------|
| PII-U01 | Detect email in event_data | "contact john@example.com" | Email masked to "contact j***@e***.com" |
| PII-U02 | Detect SSN | "SSN: 123-45-6789" | Masked to "SSN: ***-**-****" |
| PII-U03 | Detect credit card | "4111111111111111" | Masked to "****1111" |
| PII-U04 | No PII in clean data | "Agent completed task" | No modifications |
| PII-U05 | PII detection configurable | workspace setting PII_DETECT=off | No masking applied |

### 3.2 Frontend Unit Tests (Vitest)

#### 3.2.1 XState Agent Machine (`test_agent_machine.ts`)

| Test ID | Test Case | Event | Expected State |
|---------|-----------|-------|----------------|
| FSM-U01 | Initial state | (none) | `spawned` |
| FSM-U02 | Spawn -> Idle | `INITIALIZED` | `idle` |
| FSM-U03 | Idle -> Working | `TASK_ASSIGNED` | `working` |
| FSM-U04 | Working -> Completed | `TASK_COMPLETED` | `completed` |
| FSM-U05 | Working -> Error | `ERROR` | `error` |
| FSM-U06 | Error -> Recovering | `RECOVERY_START` | `recovering` |
| FSM-U07 | Recovering -> Idle | `RECOVERY_COMPLETE` | `idle` |
| FSM-U08 | Any -> Terminated | `TERMINATE` | `terminated` |
| FSM-U09 | Idle -> Sleeping | `SLEEP` | `sleeping` |
| FSM-U10 | Working -> Communicating | `HANDOFF_START` | `communicating` |
| FSM-U11 | Communicating -> Working | `HANDOFF_COMPLETE` | `working` |
| FSM-U12 | Invalid transition | `TASK_ASSIGNED` in `spawned` | Remains `spawned` |

#### 3.2.2 Zustand Stores

**Auth Store (`test_auth_store.ts`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| STR-A01 | Initial state is unauthenticated | user=null, tokens=null |
| STR-A02 | Login sets user + tokens | user object + tokens populated |
| STR-A03 | Logout clears state | user=null, tokens=null, localStorage cleared |
| STR-A04 | Token refresh updates access_token | New access_token, refresh_token rotated |

**Agents Store (`test_agents_store.ts`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| STR-G01 | Add agent to registry | Agent indexed by ID in map |
| STR-G02 | Update agent state from WebSocket | State reflects new current_state |
| STR-G03 | Remove agent | Agent removed from map |
| STR-G04 | Filter agents by state | Only matching agents returned |
| STR-G05 | Batch update from WebSocket | All agents updated atomically |

**Gamification Store (`test_gamification_store.ts`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| STR-G01 | Professional mode toggle | All gamification UI hidden when enabled |
| STR-G02 | Leaderboard time window switch | Data refetched for new window |
| STR-G03 | Achievement unlock notification | Toast displayed + notification list updated |

#### 3.2.3 Hooks

**useWebSocket (`test_useWebSocket.ts`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| HK-W01 | Connects on mount | WebSocket opened to /ws/{workspace_id} |
| HK-W02 | Reconnects on close | Exponential backoff: 1s, 2s, 4s, 8s, max 30s |
| HK-W03 | Parses agent state update | Dispatches to agents store |
| HK-W04 | Handles auth token in connection | Token sent in first message |
| HK-W05 | Cleanup on unmount | WebSocket closed cleanly |

**useAgents (`test_useAgents.ts`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| HK-A01 | Fetches agent list | TanStack Query caches result |
| HK-A02 | Refetch on window focus | Background refetch triggered |
| HK-A03 | Optimistic update on state change | UI updates before server confirms |
| HK-A04 | Error state on API failure | Error object returned, retry available |

#### 3.2.4 Components

**AgentSprite (`test_AgentSprite.tsx`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| CMP-S01 | Renders correct avatar for level | Level 1-5 = starter, 6-14 = standard, etc. |
| CMP-S02 | Status ring color matches state | idle=gray, working=green, error=red |
| CMP-S03 | XP bar shows correct fill | 50% XP to next level = 50% fill |
| CMP-S04 | Achievement badges displayed | Pinned achievements (max 3) visible |
| CMP-S05 | Click opens detail panel | AgentDetailPanel rendered with agent data |

**DashboardPage (`test_DashboardPage.tsx`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| CMP-D01 | Renders workspace overview cards | Total agents, active tasks, total cost, error rate displayed |
| CMP-D02 | Agent grid renders all agents | One card per agent with key metrics |
| CMP-D03 | Loading skeleton shown while fetching | Skeleton components visible |
| CMP-D04 | Error boundary on API failure | Error message with retry button |

**AlertsPage (`test_AlertsPage.tsx`)**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| CMP-AL01 | Renders alert rules list | All rules with name, type, severity, enabled toggle |
| CMP-AL02 | Create alert rule form | Form validates required fields, submits to API |
| CMP-AL03 | Acknowledge alert | Status changes to "acknowledged" |
| CMP-AL04 | Alert severity badge colors | critical=red, error=orange, warning=yellow, info=blue |

#### 3.2.5 XP Calculator Utility (`test_xp_calculator.ts`)

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| UTL-X01 | Level from XP (level 1) | 0-99 XP = level 1 |
| UTL-X02 | Level from XP (level 10) | XP=14682 = level 10 |
| UTL-X03 | Tier name from level | 1-9="Rookie", 10-19="Apprentice", 20-29="Journeyman", 30-49="Expert", 50-69="Master", 70-89="Grandmaster", 90-100="Legend" |
| UTL-X04 | Progress to next level | XP=200, level 2 threshold=348 | progress = (200-100)/(348-100) = 0.403 |
| UTL-X05 | Max level detection | XP=7030000 | level=100, progress=1.0 |

---

## 4. Integration Test Plan

### 4.1 API Endpoint Integration Tests

All tests use `httpx.AsyncClient` against a running FastAPI app with real PostgreSQL + Redis via testcontainers.

#### 4.1.1 Authentication Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-AUTH01 | /api/v1/auth/register | POST | None | 201 | User + workspace + api_key + tokens |
| API-AUTH02 | /api/v1/auth/register | POST | None | 409 | Duplicate email |
| API-AUTH03 | /api/v1/auth/register | POST | None | 422 | Invalid email format |
| API-AUTH04 | /api/v1/auth/login | POST | None | 200 | User + tokens with correct expiry |
| API-AUTH05 | /api/v1/auth/login | POST | None | 401 | Wrong credentials |
| API-AUTH06 | /api/v1/auth/refresh | POST | Refresh token | 200 | New access + rotated refresh |
| API-AUTH07 | /api/v1/auth/refresh | POST | Expired token | 401 | Token expired error |
| API-AUTH08 | /api/v1/auth/oauth/google/callback | GET | None | 302 | Redirect with tokens |
| API-AUTH09 | /api/v1/auth/oauth/github/callback | GET | None | 302 | Redirect with tokens |

#### 4.1.2 User Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-USR01 | /api/v1/users/me | GET | JWT | 200 | Current user profile |
| API-USR02 | /api/v1/users/me | PUT | JWT | 200 | Updated display_name, avatar_url |
| API-USR03 | /api/v1/users/me/preferences | PUT | JWT | 200 | Theme, gamification_mode, notifications saved |
| API-USR04 | /api/v1/users/me | GET | None | 401 | Unauthorized |

#### 4.1.3 Workspace Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-WRK01 | /api/v1/workspaces | POST | JWT | 201 | Workspace created, owner set |
| API-WRK02 | /api/v1/workspaces | GET | JWT | 200 | List of user's workspaces |
| API-WRK03 | /api/v1/workspaces/{id} | GET | JWT (member) | 200 | Workspace details + settings |
| API-WRK04 | /api/v1/workspaces/{id} | GET | JWT (non-member) | 403 | Forbidden |
| API-WRK05 | /api/v1/workspaces/{id} | PUT | JWT (admin+) | 200 | Updated name, settings |
| API-WRK06 | /api/v1/workspaces/{id} | PUT | JWT (viewer) | 403 | Forbidden |
| API-WRK07 | /api/v1/workspaces/{id}/members | POST | JWT (admin+) | 201 | Member added with role |
| API-WRK08 | /api/v1/workspaces/{id}/members | GET | JWT (member) | 200 | List of members with roles |
| API-WRK09 | /api/v1/workspaces/{id}/members/{uid} | DELETE | JWT (admin+) | 204 | Member removed |
| API-WRK10 | /api/v1/workspaces/{id}/members/{uid} | DELETE | JWT (viewer) | 403 | Forbidden |

#### 4.1.4 Agent Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-AGT01 | /api/v1/agents | POST | API Key (ingest) | 201 | Agent with state=idle, xp=0 |
| API-AGT02 | /api/v1/agents | POST | JWT (engineer) | 201 | Agent created |
| API-AGT03 | /api/v1/agents | POST | JWT (viewer) | 403 | Forbidden |
| API-AGT04 | /api/v1/agents | GET | JWT | 200 | Paginated agent list |
| API-AGT05 | /api/v1/agents?state=working | GET | JWT | 200 | Filtered by state |
| API-AGT06 | /api/v1/agents?framework=langchain | GET | JWT | 200 | Filtered by framework |
| API-AGT07 | /api/v1/agents/{id} | GET | JWT | 200 | Full agent details + achievements |
| API-AGT08 | /api/v1/agents/{id} | GET | JWT | 404 | Non-existent agent |
| API-AGT09 | /api/v1/agents/{id} | PUT | JWT (engineer+) | 200 | Updated fields |
| API-AGT10 | /api/v1/agents/{id}/heartbeat | POST | API Key | 200 | acknowledged=true |
| API-AGT11 | /api/v1/agents/{id}/heartbeat | POST | API Key | 200 | State updated from heartbeat |

#### 4.1.5 Task Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-TSK01 | /api/v1/tasks | POST | JWT/API Key | 201 | Task with status=pending |
| API-TSK02 | /api/v1/tasks | GET | JWT | 200 | Paginated tasks |
| API-TSK03 | /api/v1/tasks?status=in_progress | GET | JWT | 200 | Filtered by status |
| API-TSK04 | /api/v1/tasks/{id} | GET | JWT | 200 | Task details |
| API-TSK05 | /api/v1/tasks/{id}/assign | POST | JWT/API Key | 200 | Assignment created |
| API-TSK06 | /api/v1/tasks/{id}/result | POST | API Key | 201 | Result saved, XP awarded |
| API-TSK07 | /api/v1/tasks/{id} | PUT | JWT | 200 | Updated title, description, priority |
| API-TSK08 | /api/v1/tasks/{id}/cancel | POST | JWT (engineer+) | 200 | status=cancelled |

#### 4.1.6 Trace & Event Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-TRC01 | /api/v1/traces/events | POST | API Key (ingest) | 202 | Accepted, event queued |
| API-TRC02 | /api/v1/traces/events/bulk | POST | API Key (ingest) | 202 | Batch accepted |
| API-TRC03 | /api/v1/traces/{trace_id} | GET | JWT | 200 | Full trace with spans |
| API-TRC04 | /api/v1/traces/{trace_id}/replay | GET | JWT | 200 | Ordered event list for replay |
| API-TRC05 | /v1/traces | POST | API Key | 200 | OTLP HTTP receiver (protobuf) |
| API-TRC06 | /api/v1/traces/sessions | GET | JWT | 200 | Session list with filters |

#### 4.1.7 Metrics Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-MET01 | /api/v1/metrics | GET | JWT | 200 | Aggregated metrics by time bucket |
| API-MET02 | /api/v1/metrics?agent_id={id}&window=1h | GET | JWT | 200 | Agent-specific metrics |
| API-MET03 | /api/v1/dashboard/overview | GET | JWT | 200 | Workspace summary (agents, tasks, cost, errors) |
| API-MET04 | /api/v1/dashboard/agent/{id} | GET | JWT | 200 | Single agent dashboard data |

#### 4.1.8 Gamification Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-GAM01 | /api/v1/achievements | GET | JWT | 200 | All achievements (secrets hidden) |
| API-GAM02 | /api/v1/achievements/agent/{id} | GET | JWT | 200 | Agent's unlocked achievements |
| API-GAM03 | /api/v1/leaderboard?window=weekly | GET | JWT | 200 | Rankings array with scores |
| API-GAM04 | /api/v1/leaderboard?window=daily&type=team | GET | JWT | 200 | Team rankings |
| API-GAM05 | /api/v1/quests/active | GET | JWT | 200 | Active daily/weekly/epic quests |
| API-GAM06 | /api/v1/quests/{id}/complete | POST | JWT | 200 | Quest marked complete, XP awarded |

#### 4.1.9 Alert Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-ALT01 | /api/v1/alerts/rules | POST | JWT (engineer+) | 201 | Alert rule created |
| API-ALT02 | /api/v1/alerts/rules | GET | JWT | 200 | List of alert rules |
| API-ALT03 | /api/v1/alerts/rules/{id} | PUT | JWT (engineer+) | 200 | Rule updated |
| API-ALT04 | /api/v1/alerts/rules/{id} | DELETE | JWT (admin+) | 204 | Rule deleted |
| API-ALT05 | /api/v1/alerts | GET | JWT | 200 | Alert history with filters |
| API-ALT06 | /api/v1/alerts/{id}/acknowledge | POST | JWT (engineer+) | 200 | Alert acknowledged |
| API-ALT07 | /api/v1/alerts/{id}/resolve | POST | JWT (engineer+) | 200 | Alert resolved |

#### 4.1.10 Notification, API Key, and Health Endpoints

| Test ID | Endpoint | Method | Auth | Expected Status | Response Validation |
|---------|----------|--------|------|-----------------|---------------------|
| API-NOT01 | /api/v1/notifications | GET | JWT | 200 | Paginated notifications |
| API-NOT02 | /api/v1/notifications/{id}/read | POST | JWT | 200 | is_read=true |
| API-KEY01 | /api/v1/api-keys | POST | JWT (admin+) | 201 | Key returned (shown once) |
| API-KEY02 | /api/v1/api-keys | GET | JWT (admin+) | 200 | Keys listed (hash only, no secret) |
| API-KEY03 | /api/v1/api-keys/{id} | DELETE | JWT (admin+) | 204 | Key deactivated |
| API-HLT01 | /health | GET | None | 200 | `{"status": "healthy"}` |
| API-HLT02 | /ready | GET | None | 200 | DB + Redis connected |
| API-HLT03 | /ready | GET | None | 503 | DB or Redis down |

### 4.2 Database Integration Tests

| Test ID | Test Case | Validation |
|---------|-----------|------------|
| DB-INT01 | Alembic migrations run cleanly (001-009) | `alembic upgrade head` succeeds with no errors |
| DB-INT02 | Alembic downgrade all | `alembic downgrade base` succeeds |
| DB-INT03 | TimescaleDB hypertable creation (events) | `SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'events'` returns 1 row |
| DB-INT04 | TimescaleDB hypertable creation (spans) | Same check for spans |
| DB-INT05 | TimescaleDB hypertable creation (metrics_raw) | Same check for metrics_raw |
| DB-INT06 | Continuous aggregate (metrics_1min) | View exists and query returns data after insert |
| DB-INT07 | Continuous aggregate (metrics_1hour) | View exists |
| DB-INT08 | Continuous aggregate (metrics_1day) | View exists |
| DB-INT09 | Continuous aggregate (agent_daily_summary) | View exists and aggregates correctly |
| DB-INT10 | Compression policy on events | Chunks older than 7 days are compressed |
| DB-INT11 | Retention policy on events | Data older than 90 days is dropped |
| DB-INT12 | Seed data: 38 achievements seeded | `SELECT count(*) FROM achievements` = 38 |
| DB-INT13 | Seed data: default user seeded | Default user exists with email `kotsai@gmail.com` |
| DB-INT14 | Foreign key cascades | Delete workspace -> agents, tasks, events cascade |
| DB-INT15 | Unique constraints | Duplicate workspace slug, duplicate agent external_id per workspace raise IntegrityError |
| DB-INT16 | Index performance: events by workspace+time | EXPLAIN ANALYZE shows index scan for workspace_id + time range query |
| DB-INT17 | Index performance: agents by xp | EXPLAIN ANALYZE shows index scan for xp_total DESC ordering |

### 4.3 WebSocket Integration Tests

| Test ID | Test Case | Validation |
|---------|-----------|------------|
| WS-INT01 | Connect with valid JWT | Connection accepted, welcome message received |
| WS-INT02 | Connect without token | Connection rejected with 4001 close code |
| WS-INT03 | Connect with expired token | Connection rejected with 4001 close code |
| WS-INT04 | Subscribe to workspace events | Subscription confirmed, events received |
| WS-INT05 | Agent state change broadcasted | All connected clients receive agent state update |
| WS-INT06 | Task assignment event | Task assignment broadcast received |
| WS-INT07 | Achievement unlock event | Celebration event broadcast to workspace |
| WS-INT08 | Level-up event | Level-up notification broadcast |
| WS-INT09 | Alert fired event | Alert notification broadcast |
| WS-INT10 | Connection heartbeat (ping/pong) | Server sends ping every 30s, client responds |
| WS-INT11 | Stale connection cleanup | No pong within 60s -> connection closed |
| WS-INT12 | Reconnection after server restart | Client reconnects with exponential backoff |
| WS-INT13 | Multiple workspace subscriptions | Client receives events from all subscribed workspaces |
| WS-INT14 | Concurrent connections (100) | Server handles 100 simultaneous connections |
| WS-INT15 | Message ordering | Events arrive in chronological order per agent |

### 4.4 SSE Integration Tests

| Test ID | Test Case | Validation |
|---------|-----------|------------|
| SSE-INT01 | Connect to metrics stream | SSE connection established, `Content-Type: text/event-stream` |
| SSE-INT02 | Metric data format | Events contain `id`, `event`, `data` fields |
| SSE-INT03 | Workspace-scoped metrics | Only metrics for subscribed workspace received |
| SSE-INT04 | Connection drop recovery | Client reconnects with `Last-Event-ID` |
| SSE-INT05 | Backpressure handling | Server drops old events when client is slow |

### 4.5 Redis Integration Tests

| Test ID | Test Case | Validation |
|---------|-----------|------------|
| RDS-INT01 | Event stream write | XADD to `oav:events:{tenant_id}` succeeds |
| RDS-INT02 | Event stream read (consumer group) | XREADGROUP returns events in order |
| RDS-INT03 | Dead letter stream | Failed events written to `oav:deadletter` |
| RDS-INT04 | Pub/sub fan-out | PUBLISH to `oav:ws:{workspace_id}` received by all subscribers |
| RDS-INT05 | Cache set and get | Agent state cache write + read within TTL |
| RDS-INT06 | Cache expiry | Cached value expires after TTL |
| RDS-INT07 | Leaderboard cache | Sorted set for leaderboard rankings |
| RDS-INT08 | Rate limit counter | Sliding window counter increments correctly |
| RDS-INT09 | Rate limit expiry | Counter resets after window |
| RDS-INT10 | Session blocklist | Revoked token added to blocklist, lookup returns hit |

---

## 5. End-to-End Test Plan

### 5.1 E2E Testing Framework

- **Tool:** Playwright 1.x
- **Browsers:** Chromium (primary), Firefox, WebKit
- **Base URL:** `http://localhost:3000` (Vite dev server proxying to backend)
- **Setup:** `docker compose up -d` before test suite, `docker compose down` after
- **Authentication:** Each test suite uses a pre-seeded user (`kotsai@gmail.com` / `kots@123`)

### 5.2 Critical User Flow Tests

#### Flow 1: User Onboarding

```
Test: E2E-FLOW01 -- New User Registration and First Visualization
Steps:
  1. Navigate to /register
  2. Fill email, password, display_name
  3. Submit registration form
  4. Verify redirect to /world (virtual world page)
  5. Verify workspace auto-created
  6. Verify onboarding tour starts (tooltip sequence)
  7. Verify API key displayed in onboarding
  8. Verify empty state message: "No agents connected yet"
Assertions:
  - User visible in database
  - Workspace created with correct slug
  - JWT stored in localStorage
  - API key shown only once
```

#### Flow 2: Agent Registration via SDK

```
Test: E2E-FLOW02 -- Agent Registration and World Appearance
Steps:
  1. Login as default user
  2. Send POST /api/v1/agents with API key (via API call, simulating SDK)
  3. Verify agent appears on World canvas within 5 seconds
  4. Verify agent sprite shows idle state (gray ring)
  5. Verify agent card appears in Dashboard agent grid
  6. Verify agent appears in left sidebar agent list
Assertions:
  - Agent rendered as PixiJS sprite on canvas
  - Status ring color = idle (#6B7280)
  - Level badge shows "Lv.1"
```

#### Flow 3: Task Assignment and Completion

```
Test: E2E-FLOW03 -- Full Task Lifecycle
Steps:
  1. Login, register agent
  2. Create task via POST /api/v1/tasks
  3. Assign task to agent via POST /api/v1/tasks/{id}/assign
  4. Verify agent state changes to "working" (green ring on canvas)
  5. Submit task result via POST /api/v1/tasks/{id}/result
  6. Verify agent state returns to "idle"
  7. Verify task appears in completed list
  8. Verify XP awarded (visible on agent card and XP bar on sprite)
Assertions:
  - Agent sprite animation transitions: idle -> working -> idle
  - XP bar fills on canvas sprite
  - Task result stored with tokens, cost, quality_score
```

#### Flow 4: Dashboard Viewing

```
Test: E2E-FLOW04 -- Dashboard Data Accuracy
Steps:
  1. Login with user that has 5 agents, 100 tasks, 50 completed
  2. Navigate to /dashboard
  3. Verify overview cards: total agents=5, active tasks, total cost, error rate
  4. Click agent card -> verify agent detail view loads
  5. Switch tabs: Overview, Tasks, Traces, Cost, Achievements
  6. Verify each tab renders data
Assertions:
  - Metric values match database aggregates
  - Charts render without console errors
  - Tab navigation does not cause re-fetch storms
```

#### Flow 5: Achievement Unlock

```
Test: E2E-FLOW05 -- Achievement Unlock and Notification
Steps:
  1. Login, register agent, complete 1st task
  2. Verify "First Steps" achievement unlocked
  3. Verify toast notification appears with achievement name
  4. Verify notification in notification dropdown
  5. Navigate to agent's Achievements tab
  6. Verify "First Steps" badge is displayed (not grayed out)
  7. Verify 50 XP bonus added to agent's total
Assertions:
  - Achievement badge unlocked in UI
  - Notification created in database
  - XP ledger entry with source_type="achievement"
```

#### Flow 6: Alert Trigger

```
Test: E2E-FLOW06 -- Alert Rule Trigger and Notification
Steps:
  1. Login, create cost_threshold alert rule (threshold=$0.10)
  2. Register agent, complete task with cost=$0.15
  3. Wait for alert evaluation (Celery beat cycle or force trigger)
  4. Verify alert appears in Alerts page with status=firing
  5. Verify toast notification for alert
  6. Acknowledge alert via UI button
  7. Verify status changes to "acknowledged"
Assertions:
  - Alert created with correct severity
  - Alert data contains threshold and actual value
  - Acknowledged_by set to current user
```

#### Flow 7: Session Replay

```
Test: E2E-FLOW07 -- Session Replay Playback
Steps:
  1. Login, register agent, complete 3 tasks in one session
  2. Navigate to /replay
  3. Select the session from session list
  4. Click Play
  5. Verify timeline scrubber moves
  6. Verify agent sprite animates through states: idle -> working -> idle (3x)
  7. Verify event list scrolls in sync with playback
  8. Pause, seek to middle, resume
Assertions:
  - Events replayed in chronological order
  - Playback speed controls work (1x, 2x, 4x)
  - Pause/resume works
  - Seek positions to correct event
```

#### Flow 8: Leaderboard Viewing

```
Test: E2E-FLOW08 -- Leaderboard Ranking Display
Steps:
  1. Login with workspace containing 10 agents with varying XP
  2. Navigate to /leaderboard
  3. Verify agents ranked by composite score
  4. Switch time window: daily -> weekly -> monthly -> all-time
  5. Verify rankings update
  6. Verify "My Agents" filter highlights user's agents
  7. Hover over entry -> verify hover card with details
Assertions:
  - Rankings match leaderboard service computation
  - Position change indicators (up/down arrows) correct
  - Sparkline charts render
```

### 5.3 Test Data Management

| Strategy | Implementation |
|----------|---------------|
| Seed data | `seed_default_user()` + factory-generated agents/tasks/events |
| Isolation | Each E2E test creates its own workspace; cleanup after suite |
| Deterministic IDs | Factory-generated UUIDs from seeded faker |
| Time control | All timestamp-dependent tests use frozen time (`freezegun` for backend, `vi.useFakeTimers` for frontend) |
| Parallel safety | Each test gets unique workspace slug to avoid cross-test contamination |

---

## 6. Performance Test Plan

### 6.1 Frontend Performance

#### 6.1.1 FPS Benchmarks

| Test ID | Scenario | Target | Tool |
|---------|----------|--------|------|
| PERF-FE01 | World canvas with 10 agents, idle | >= 60 FPS | Chrome DevTools Performance panel |
| PERF-FE02 | World canvas with 50 agents, 20 active | >= 60 FPS | Chrome DevTools Performance panel |
| PERF-FE03 | World canvas with 100 agents, 50 active | >= 45 FPS (acceptable) | Chrome DevTools Performance panel |
| PERF-FE04 | World canvas with 200 agents (stress) | >= 30 FPS | Chrome DevTools Performance panel |
| PERF-FE05 | Canvas pan/zoom with 50 agents | >= 60 FPS during interaction | requestAnimationFrame callback timing |
| PERF-FE06 | Agent state transition animation | No frame drops during transition | PixiJS ticker delta monitoring |
| PERF-FE07 | Celebration effect (level-up) | >= 30 FPS during particle burst | Particle system benchmark |

#### 6.1.2 Memory Profiling

| Test ID | Scenario | Limit | Measurement |
|---------|----------|-------|-------------|
| PERF-FE08 | Initial page load (World page) | < 150MB heap | `performance.measureUserAgentSpecificMemory()` |
| PERF-FE09 | 1 hour continuous operation, 50 agents | < 300MB heap, no growth trend | Periodic heap snapshots, regression detection |
| PERF-FE10 | Navigate between all pages 50 times | No memory leak (< 5% growth) | Heap snapshot comparison |
| PERF-FE11 | WebSocket 1000 messages/minute for 10 min | No memory leak | Detached DOM node count stable |
| PERF-FE12 | Canvas with 100 agents added then removed | Memory returns to baseline (within 10%) | Heap diff |

#### 6.1.3 Bundle Size Budget

| Chunk | Max Size (gzip) | Current Estimate |
|-------|----------------|-----------------|
| vendor-react | 50KB | ~45KB |
| vendor-state (zustand + xstate + tanstack) | 60KB | ~55KB |
| vendor-pixi | 200KB | ~180KB |
| vendor-rive | 150KB | ~130KB |
| vendor-charts (recharts) | 80KB | ~70KB |
| vendor-echarts | 250KB | ~230KB |
| vendor-gsap | 40KB | ~35KB |
| vendor-reactflow | 100KB | ~90KB |
| app code (all routes) | 150KB | ~120KB |
| **Total initial load** | **< 500KB** | Critical path: React + app shell only |

Enforcement: Vite `build.chunkSizeWarningLimit = 500`. CI fails if any chunk exceeds budget by 10%.

#### 6.1.4 Core Web Vitals

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse CI |
| FID (First Input Delay) | < 100ms | Lighthouse CI |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse CI |
| TTI (Time to Interactive) | < 3.5s | Lighthouse CI |
| TTFB (Time to First Byte) | < 500ms | Lighthouse CI |

### 6.2 Backend Performance (Load Testing with k6)

#### 6.2.1 API Load Tests

| Test ID | Endpoint | VUs | Duration | Target RPS | Target P95 Latency |
|---------|----------|-----|----------|-----------|-------------------|
| PERF-BE01 | POST /api/v1/auth/login | 50 | 5 min | 500 | < 200ms |
| PERF-BE02 | GET /api/v1/agents | 100 | 5 min | 1000 | < 150ms |
| PERF-BE03 | GET /api/v1/agents/{id} | 100 | 5 min | 1000 | < 100ms |
| PERF-BE04 | POST /api/v1/agents/{id}/heartbeat | 200 | 10 min | 5000 | < 50ms |
| PERF-BE05 | POST /api/v1/traces/events | 200 | 10 min | 10000 | < 100ms |
| PERF-BE06 | POST /api/v1/traces/events/bulk (100 events) | 100 | 10 min | 1000 (=100K events/s) | < 500ms |
| PERF-BE07 | GET /api/v1/metrics?window=1h | 50 | 5 min | 500 | < 300ms |
| PERF-BE08 | GET /api/v1/leaderboard?window=weekly | 50 | 5 min | 500 | < 200ms |
| PERF-BE09 | GET /api/v1/dashboard/overview | 100 | 5 min | 1000 | < 250ms |
| PERF-BE10 | POST /v1/traces (OTLP protobuf) | 200 | 10 min | 5000 | < 100ms |

#### 6.2.2 Event Ingestion Pipeline Benchmarks

| Test ID | Scenario | Target |
|---------|----------|--------|
| PERF-EV01 | Sustained event ingestion rate | >= 100,000 events/sec |
| PERF-EV02 | Redis Stream write throughput | >= 200,000 XADD/sec |
| PERF-EV03 | Persist Writer consumer lag | < 5 seconds behind producer |
| PERF-EV04 | Aggregation Engine consumer lag | < 10 seconds behind producer |
| PERF-EV05 | Event-to-WebSocket latency | < 500ms (ingest to client render) |
| PERF-EV06 | Event-to-database latency | < 2 seconds (ingest to queryable) |

#### 6.2.3 WebSocket Load Tests

| Test ID | Scenario | Target |
|---------|----------|--------|
| PERF-WS01 | 1,000 concurrent WebSocket connections | All connected, < 1% error |
| PERF-WS02 | 10,000 concurrent WebSocket connections | All connected, < 2% error |
| PERF-WS03 | 50,000 concurrent WebSocket connections (stress) | >= 95% connected |
| PERF-WS04 | Broadcast to 1,000 clients | < 100ms P95 delivery |
| PERF-WS05 | Broadcast to 10,000 clients | < 500ms P95 delivery |
| PERF-WS06 | Connection churn (100 connect/disconnect per sec) | Server stable, no memory leak |

### 6.3 Database Performance

| Test ID | Query | Dataset | Target |
|---------|-------|---------|--------|
| PERF-DB01 | Events by workspace + time range (1 hour) | 10M events | < 100ms |
| PERF-DB02 | Events by workspace + time range (24 hours) | 10M events | < 500ms |
| PERF-DB03 | Spans by trace_id | 10M spans | < 50ms |
| PERF-DB04 | Agent leaderboard computation | 10K agents, 1M task results | < 5s (batch job) |
| PERF-DB05 | Continuous aggregate refresh (metrics_1min) | 1M metrics_raw rows | < 30s |
| PERF-DB06 | Agent daily summary query | 10K agents, 30 days | < 200ms |
| PERF-DB07 | Full-text search on event_data JSONB | 10M events | < 500ms (with GIN index) |
| PERF-DB08 | Chunk compression ratio | 10M events compressed | >= 10x compression |

---

## 7. Security Test Plan

### 7.1 Authentication Tests

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-AUTH01 | JWT token with invalid signature | 401 Unauthorized |
| SEC-AUTH02 | JWT token with altered payload | 401 Unauthorized |
| SEC-AUTH03 | Expired JWT access token | 401 Unauthorized, client should refresh |
| SEC-AUTH04 | Reuse of rotated refresh token (replay attack) | 401 + all user sessions invalidated |
| SEC-AUTH05 | API key with wrong prefix | 401 Unauthorized |
| SEC-AUTH06 | API key from deactivated key | 401 Unauthorized |
| SEC-AUTH07 | API key with insufficient scope | 403 Forbidden |
| SEC-AUTH08 | OAuth CSRF: state parameter mismatch | 400 Bad Request |
| SEC-AUTH09 | OAuth callback without code | 400 Bad Request |
| SEC-AUTH10 | Brute force login (> 5 attempts) | Account locked for 15 minutes |
| SEC-AUTH11 | Password complexity enforcement | Reject passwords < 8 characters |
| SEC-AUTH12 | No password hash in API responses | User objects never contain password_hash |

### 7.2 Authorization Tests (RBAC)

| Test ID | Role | Action | Expected |
|---------|------|--------|----------|
| SEC-RBAC01 | viewer | Create agent | 403 Forbidden |
| SEC-RBAC02 | viewer | View agents | 200 OK |
| SEC-RBAC03 | viewer | View dashboard | 200 OK |
| SEC-RBAC04 | viewer | Create alert rule | 403 Forbidden |
| SEC-RBAC05 | viewer | Acknowledge alert | 403 Forbidden |
| SEC-RBAC06 | engineer | Create agent | 201 Created |
| SEC-RBAC07 | engineer | Update agent | 200 OK |
| SEC-RBAC08 | engineer | Create alert rule | 201 Created |
| SEC-RBAC09 | engineer | Delete alert rule | 403 Forbidden |
| SEC-RBAC10 | engineer | Manage API keys | 403 Forbidden |
| SEC-RBAC11 | admin | Manage members | 200 OK |
| SEC-RBAC12 | admin | Manage API keys | 200 OK |
| SEC-RBAC13 | admin | Delete workspace | 200 OK |
| SEC-RBAC14 | admin | Delete alert rules | 204 No Content |
| SEC-RBAC15 | owner | Transfer ownership | 200 OK |
| SEC-RBAC16 | non-member | Access any workspace resource | 403 Forbidden |
| SEC-RBAC17 | Cross-workspace | Access agent in different workspace | 404 Not Found (no info leak) |

### 7.3 Input Validation & Injection Prevention

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-INJ01 | SQL injection in query params | Parameterized query prevents injection |
| SEC-INJ02 | SQL injection in JSON body | Pydantic validation + ORM prevents injection |
| SEC-INJ03 | XSS in agent name | HTML entities escaped in responses |
| SEC-INJ04 | XSS in task description | Rendered as text, not HTML |
| SEC-INJ05 | XSS in workspace name | Escaped in all output contexts |
| SEC-INJ06 | NoSQL injection in JSONB fields | JSONB treated as opaque data, not executed |
| SEC-INJ07 | Path traversal in file endpoints | No file system access from user input |
| SEC-INJ08 | Command injection via event_data | Event data stored as-is, never executed |
| SEC-INJ09 | Header injection in WebSocket | Headers validated before processing |
| SEC-INJ10 | Prototype pollution in JSON parsing | orjson parser immune to prototype pollution |

### 7.4 PII Detection Verification

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-PII01 | Email in event payload | Masked before storage |
| SEC-PII02 | Phone number in event payload | Masked before storage |
| SEC-PII03 | SSN in event payload | Masked before storage |
| SEC-PII04 | Credit card in event payload | Masked to last 4 digits |
| SEC-PII05 | PII detection disabled via workspace setting | No masking applied |
| SEC-PII06 | PII in bulk event batch | All events in batch masked |

### 7.5 Rate Limiting Verification

| Test ID | Endpoint | Limit | Test |
|---------|----------|-------|------|
| SEC-RL01 | POST /auth/register | 5/min per IP | 6th request returns 429 |
| SEC-RL02 | POST /auth/login | 10/min per IP | 11th request returns 429 |
| SEC-RL03 | POST /traces/events | 1000/min per API key | 1001st returns 429 |
| SEC-RL04 | GET /agents | 60/min per user | 61st returns 429 |
| SEC-RL05 | WebSocket messages | 200/min per connection | 201st message dropped |
| SEC-RL06 | Rate limit headers | All responses | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` present |

### 7.6 OWASP Top 10 Checklist

| # | Risk | Mitigation | Test |
|---|------|------------|------|
| A01 | Broken Access Control | RBAC on every endpoint, workspace scoping | SEC-RBAC01-17, SEC-INJ07 |
| A02 | Cryptographic Failures | bcrypt 4.0.1 for passwords, HS256 JWT, HTTPS enforced | SEC-AUTH01-12 |
| A03 | Injection | Pydantic validation, SQLAlchemy ORM, parameterized queries | SEC-INJ01-10 |
| A04 | Insecure Design | Threat model reviewed, rate limiting, input size limits | Architecture review |
| A05 | Security Misconfiguration | CORS whitelist, no debug in production, security headers | SEC-MISC01-05 (below) |
| A06 | Vulnerable Components | `safety check` + `npm audit` in CI | Dependency scan |
| A07 | Auth Failures | Account lockout, token rotation, JWT expiry | SEC-AUTH10-12 |
| A08 | Data Integrity Failures | Audit log for all mutations, event sourcing immutability | Audit log tests |
| A09 | Logging Failures | Structured JSON logging, no secrets in logs | Log audit |
| A10 | SSRF | No user-controlled URLs in server-side requests (except webhooks; validated against allowlist) | SEC-SSRF01 |

**Misconfiguration Tests:**

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-MISC01 | CORS rejects non-whitelisted origin | 403 or no `Access-Control-Allow-Origin` header |
| SEC-MISC02 | No server version in headers | `Server` header absent or generic |
| SEC-MISC03 | HTTPS redirect in production | HTTP -> 301 -> HTTPS |
| SEC-MISC04 | Content-Security-Policy header | CSP header present with restrictive policy |
| SEC-MISC05 | X-Content-Type-Options: nosniff | Header present |

---

## 8. Accessibility Test Plan

### 8.1 WCAG 2.2 AA Compliance Checklist

| Criterion | ID | Test Method |
|-----------|-----|-------------|
| Text alternatives for images | 1.1.1 | axe-core scan + manual review |
| Captions for multimedia | 1.2.2 | Manual (if video content exists) |
| Info and relationships (semantic HTML) | 1.3.1 | axe-core + manual landmark check |
| Meaningful sequence | 1.3.2 | Tab order matches visual order |
| Sensory characteristics | 1.3.3 | Color is not sole indicator (icons + text labels) |
| Use of color | 1.4.1 | Agent states use color + icon + label |
| Contrast minimum (4.5:1 text, 3:1 large) | 1.4.3 | axe-core color contrast check |
| Resize text (200%) | 1.4.4 | Browser zoom to 200%, no content loss |
| Keyboard accessible | 2.1.1 | All interactive elements reachable via Tab |
| No keyboard trap | 2.1.2 | Escape closes modals/overlays |
| Timing adjustable | 2.2.1 | Session timeout can be extended |
| Pause, stop, hide | 2.2.2 | Canvas animations pausable |
| Three flashes | 2.3.1 | No content flashes > 3 times/sec |
| Skip navigation | 2.4.1 | "Skip to main content" link present |
| Page titles | 2.4.2 | Each route has descriptive `<title>` |
| Focus order | 2.4.3 | Logical tab order through page |
| Link purpose | 2.4.4 | All links have descriptive text |
| Multiple ways | 2.4.5 | Navigation + Command Palette (Cmd+K) |
| Headings and labels | 2.4.6 | Headings describe section content |
| Focus visible | 2.4.7 | Focus ring visible on all focusable elements |
| Language of page | 3.1.1 | `<html lang="en">` set |
| On focus | 3.2.1 | No context change on focus |
| On input | 3.2.2 | No unexpected context change on input |
| Error identification | 3.3.1 | Form errors identified by field |
| Labels or instructions | 3.3.2 | All form inputs have labels |
| Error suggestion | 3.3.3 | Corrective suggestions for invalid input |
| Name, role, value | 4.1.2 | ARIA roles correct for custom components |

### 8.2 Keyboard Navigation Tests

| Test ID | Flow | Steps | Expected |
|---------|------|-------|----------|
| A11Y-KB01 | Login form | Tab through email -> password -> submit | Focus moves in order, Enter submits |
| A11Y-KB02 | Main navigation | Tab to sidebar links, Enter to navigate | All nav items reachable |
| A11Y-KB03 | Agent detail panel | Tab into panel, navigate tabs | All tabs accessible via Arrow keys |
| A11Y-KB04 | Alert create form | Tab through all fields | All fields reachable, validation announced |
| A11Y-KB05 | Command palette | Cmd+K opens, type to search, Arrow to select, Enter to act | Full keyboard operation |
| A11Y-KB06 | Modal dialogs | Escape closes, focus trapped inside | Focus returns to trigger element |
| A11Y-KB07 | Leaderboard table | Tab to rows, Enter for detail | Row detail accessible |
| A11Y-KB08 | World canvas | Tab to canvas, Arrow keys to pan, +/- to zoom | Canvas navigable without mouse |
| A11Y-KB09 | Replay controls | Tab to Play/Pause, speed, scrubber | All controls keyboard-accessible |

### 8.3 Screen Reader Compatibility

| Test ID | Component | Validation |
|---------|-----------|------------|
| A11Y-SR01 | Agent status on canvas | `aria-label="Agent {name}, status: {state}, level {level}"` |
| A11Y-SR02 | Dashboard metric cards | `aria-label="Total agents: {n}"` |
| A11Y-SR03 | Achievement unlock toast | `role="alert"` with achievement name |
| A11Y-SR04 | Alert notification | `role="alert"` with severity and title |
| A11Y-SR05 | Leaderboard rankings | Table with `scope="col"` headers, `aria-sort` on sorted column |
| A11Y-SR06 | Form validation errors | `aria-invalid="true"` + `aria-describedby` pointing to error |
| A11Y-SR07 | Loading states | `aria-busy="true"` on loading containers |
| A11Y-SR08 | Chart data | `aria-label` with textual summary of chart data |

### 8.4 Color Contrast Verification

| Element | Foreground | Background | Ratio | Pass (AA) |
|---------|-----------|------------|-------|-----------|
| Primary text | #F1F5F9 | #0F1117 | 15.3:1 | Yes |
| Secondary text | #94A3B8 | #0F1117 | 7.1:1 | Yes |
| Tertiary text | #64748B | #0F1117 | 4.5:1 | Yes (minimum) |
| Error state | #EF4444 | #0F1117 | 4.6:1 | Yes |
| Success state | #22C55E | #0F1117 | 6.3:1 | Yes |
| Warning state | #FBBF24 | #0F1117 | 10.1:1 | Yes |
| XP gold | #FFD700 | #0F1117 | 11.4:1 | Yes |
| Link text | #818CF8 | #0F1117 | 5.2:1 | Yes |

### 8.5 Reduced Motion Tests

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| A11Y-RM01 | `prefers-reduced-motion: reduce` set | CSS animations disabled |
| A11Y-RM02 | Reduced motion + canvas | PixiJS animations switch to instant transitions |
| A11Y-RM03 | Reduced motion + celebration effects | Particle effects disabled, static badge shown |
| A11Y-RM04 | Reduced motion + Rive avatars | Static pose, no animation loops |
| A11Y-RM05 | Reduced motion + GSAP transitions | Instant state changes, no easing |

---

## 9. Gamification Test Plan

### 9.1 XP Calculation Accuracy Tests

All tests use deterministic inputs and verify exact XP output against the master formula:
`Task_XP = floor(Base_XP * Quality_Multiplier * Difficulty_Modifier * Streak_Bonus) + Efficiency_XP`

| Test ID | Base | Quality (mult) | Difficulty | Streak | Efficiency | Expected Total |
|---------|------|----------------|-----------|--------|------------|----------------|
| GAM-XP01 | 5 (trivial) | 0.6 (1.0x) | 1.0 | 1.0 | 0 | 5 |
| GAM-XP02 | 15 (low) | 0.8 (1.25x) | 1.0 | 1.0 | 0 | 18 |
| GAM-XP03 | 40 (medium) | 0.78 (1.25x) | 1.0 | 1.05 (3-day) | 15 | 67 |
| GAM-XP04 | 100 (high) | 0.97 (2.0x) | 1.3 (novelty) | 1.15 (7-day) | 62 | 361 |
| GAM-XP05 | 250 (critical) | 0.97 (2.0x) | 1.3 (novelty) | 1.15 (7-day) | 62 | 809 |
| GAM-XP06 | 5 (trivial) | 0.25 (0.5x) | 1.0 | 1.0 | 0 | 2 |
| GAM-XP07 | 40 (medium) | 0.72 (1.25x) | 0.5 (diminishing) | 1.0 | 0 | 25 |
| GAM-XP08 | 40 (medium) | 0.72 (1.25x) | 0.25 (50+ reps) | 1.0 | 0 | 12 |
| GAM-XP09 | 100 (high) | 0.5 (1.0x) | 1.25 (failed handoff) | 1.2 (14-day) | 30 | 180 |
| GAM-XP10 | 40 (medium) | 1.0 (2.0x) | 1.0 | 1.3 (30+ day) | 40 | 144 |

#### Efficiency XP Edge Cases

| Test ID | Base | Actual Cost | Expected Cost | Efficiency XP |
|---------|------|-------------|---------------|---------------|
| GAM-EF01 | 40 | $0.05 | $0.08 | 40 * (1 - 0.625) = 15 |
| GAM-EF02 | 40 | $0.08 | $0.08 | 40 * (1 - 1.0) = 0 |
| GAM-EF03 | 40 | $0.10 | $0.08 | max(0, ...) = 0 (over budget, no penalty) |
| GAM-EF04 | 250 | $0.45 | $0.60 | 250 * 0.25 = 62 |
| GAM-EF05 | 250 | $0.01 | $0.60 | 250 * 0.983 = 245 |

### 9.2 Achievement Trigger Tests (All 38 Achievements)

#### Productivity Achievements (#1-8)

| Test ID | Achievement | Trigger Condition | Verification |
|---------|-------------|-------------------|--------------|
| GAM-ACH01 | First Steps (#1) | Complete 1st task | Unlocked, 50 XP |
| GAM-ACH02 | Getting Warmed Up (#2) | 10 tasks in 1 day | Unlocked, 100 XP |
| GAM-ACH03 | Century Club (#3) | 100 total tasks | Unlocked, 500 XP |
| GAM-ACH04 | Thousand Strong (#4) | 1000 total tasks | Unlocked, 2000 XP |
| GAM-ACH05 | Ten Thousand Tasks (#5) | 10000 total tasks | Unlocked, 10000 XP |
| GAM-ACH06 | Sprint Champion (#6) | 50 tasks in 1 day | Unlocked, 1500 XP |
| GAM-ACH07 | Marathon Runner (#7) | >20 tasks/day avg for 30 consecutive days | Unlocked, 5000 XP |
| GAM-ACH08 | Assembly Line (#8) | 100 same-type tasks, zero failures | Unlocked, 3000 XP |

#### Quality Achievements (#9-15)

| Test ID | Achievement | Trigger Condition | Verification |
|---------|-------------|-------------------|--------------|
| GAM-ACH09 | Clean Sweep (#9) | 10 consecutive tasks quality > 0.9 | Unlocked, 300 XP |
| GAM-ACH10 | Perfectionist (#10) | Quality 1.0 on High/Critical task | Unlocked, 1000 XP |
| GAM-ACH11 | Quality Streak (#11) | Quality > 0.85 for 100 consecutive tasks | Unlocked, 5000 XP |
| GAM-ACH12 | Zero Defects (#12) | 500 tasks with zero errors | Unlocked, 8000 XP |
| GAM-ACH13 | Judge's Favorite (#13) | LLM-as-Judge > 0.95 on 50 tasks | Unlocked, 3000 XP |
| GAM-ACH14 | Consistent Excellence (#14) | Stdev quality < 0.05 over 200+ tasks | Unlocked, 4000 XP |
| GAM-ACH15 | Quality Over Quantity (#15) | Top 5% quality, below median task count | Unlocked, 2000 XP |

#### Reliability Achievements (#16-21)

| Test ID | Achievement | Trigger Condition | Verification |
|---------|-------------|-------------------|--------------|
| GAM-ACH16 | Always On (#16) | 24-hour uptime | Unlocked, 200 XP |
| GAM-ACH17 | Iron Will (#17) | 7-day error-free | Unlocked, 1000 XP |
| GAM-ACH18 | Titanium Core (#18) | 30-day error-free | Unlocked, 5000 XP |
| GAM-ACH19 | Unbreakable (#19) | 90-day error-free | Unlocked, 15000 XP |
| GAM-ACH20 | Phoenix Rising (#20) | Recover from error + 10 tasks without failure | Unlocked, 800 XP |
| GAM-ACH21 | Graceful Under Pressure (#21) | 5 tasks during degraded performance | Unlocked, 2000 XP |

#### Collaboration Achievements (#22-26)

| Test ID | Achievement | Trigger Condition | Verification |
|---------|-------------|-------------------|--------------|
| GAM-ACH22 | Team Player (#22) | 10 agent-to-agent handoffs | Unlocked, 300 XP |
| GAM-ACH23 | Bridge Builder (#23) | Facilitate 5 agent types in 1 pipeline | Unlocked, 1500 XP |
| GAM-ACH24 | Rescue Squad (#24) | Complete task failed by 2 others | Unlocked, 2000 XP |
| GAM-ACH25 | Guild Champion (#25) | Team ranks #1 on weekly leaderboard | Unlocked, 3000 XP |
| GAM-ACH26 | Mentorship Badge (#26) | Config cloned to 3+ agents that reach Level 10 | Unlocked, 5000 XP |

#### Milestone Achievements (#27-32)

| Test ID | Achievement | Trigger Condition | Verification |
|---------|-------------|-------------------|--------------|
| GAM-ACH27 | First Rank Up (#27) | Reach Level 5 | Unlocked, 100 XP |
| GAM-ACH28 | Double Digits (#28) | Reach Level 10 | Unlocked, 500 XP |
| GAM-ACH29 | Quarter Century (#29) | Reach Level 25 | Unlocked, 2500 XP |
| GAM-ACH30 | Half Century (#30) | Reach Level 50 | Unlocked, 10000 XP |
| GAM-ACH31 | The Legend (#31) | Reach Level 100 | Unlocked, 50000 XP |
| GAM-ACH32 | Cost Saver (#32) | Save $100 cumulative | Unlocked, 2000 XP |

#### Secret Achievements (#33-38)

| Test ID | Achievement | Trigger Condition | Verification |
|---------|-------------|-------------------|--------------|
| GAM-ACH33 | Night Owl (#33) | 100 tasks between midnight-5am | Unlocked, 1500 XP, hidden until unlock |
| GAM-ACH34 | Speed Demon (#34) | High task in <10% expected time, quality > 0.9 | Unlocked, 3000 XP |
| GAM-ACH35 | The Frugal Agent (#35) | Critical task at <25% expected budget | Unlocked, 5000 XP |
| GAM-ACH36 | Comeback King (#36) | Top 3 weekly after bottom 25% prev week | Unlocked, 4000 XP |
| GAM-ACH37 | Easter Egg Hunter (#37) | First to trigger new achievement type in workspace | Unlocked, 1000 XP |
| GAM-ACH38 | The Singularity (#38) | Level 100 on first prestige | Unlocked, 100000 XP |

### 9.3 Leaderboard Ranking Correctness

| Test ID | Scenario | Validation |
|---------|----------|------------|
| GAM-LB01 | 5 agents with known scores | Rank order matches manual calculation |
| GAM-LB02 | Trivial-only agent | Score = 0, not ranked |
| GAM-LB03 | Low-quality agent (all quality < 0.5) | Excluded from rankings |
| GAM-LB04 | Agent with 25 identical tasks | 50% contribution on tasks 21-25 |
| GAM-LB05 | Agent with 55 identical tasks | 25% contribution on tasks 51-55 |
| GAM-LB06 | Team score: 5 agents | Score = sum / 5^0.7 * activity_factor |
| GAM-LB07 | Team with 2/5 idle agents | activity_factor = 0.6 |
| GAM-LB08 | Tie: same composite score | Higher quality wins |
| GAM-LB09 | Tie: same quality | Fewer errors wins |
| GAM-LB10 | Tie: same errors | Earlier registration wins |
| GAM-LB11 | Recency weighting (weekly) | Monday weight=0.85, Sunday weight=1.0 |
| GAM-LB12 | Anomaly detection | Score 3+ stdev above mean -> flagged |

### 9.4 Quest Generation and Completion

| Test ID | Quest Type | Scenario | Validation |
|---------|-----------|----------|------------|
| GAM-QU01 | Daily quest | Generated at 00:00 UTC | Quest created with 24h expiry |
| GAM-QU02 | Weekly quest | Generated Monday 00:00 UTC | Quest created with 7d expiry |
| GAM-QU03 | Daily completion | Fulfill criteria within 24h | XP awarded, status=completed |
| GAM-QU04 | Expired quest | 24h passes without completion | status=expired, no XP |
| GAM-QU05 | Quest progress tracking | Partial progress | progress_pct reflects reality |
| GAM-QU06 | Epic quest | Multi-week objective | Tracks across daily resets |

### 9.5 Economy Balance Tests

| Test ID | Scenario | Validation |
|---------|----------|------------|
| GAM-EC01 | No infinite XP exploit via task spam | Diminishing returns cap XP gain from repetitive tasks |
| GAM-EC02 | Achievement XP does not compound | Achievement XP is one-time, cannot re-trigger |
| GAM-EC03 | Weekly bonus pool bounded | Bonus = 10% of weekly XP, capped by rank modifier (max 1.5x) |
| GAM-EC04 | Level 100 is reachable | 7,030,000 cumulative XP is achievable within 36 months |
| GAM-EC05 | Uptime XP daily cap enforced | Cannot earn > 288 XP/day from uptime alone |
| GAM-EC06 | Streak bonus capped at 1.3x | 365-day streak still 1.3x, not higher |

### 9.6 Professional Mode Toggle Tests

| Test ID | Toggle State | Expected UI Changes |
|---------|-------------|---------------------|
| GAM-PM01 | Professional mode ON | XP bars hidden on agent sprites |
| GAM-PM02 | Professional mode ON | Leaderboard replaced with "Performance Comparison" table |
| GAM-PM03 | Professional mode ON | Achievement badges replaced with geometric status icons |
| GAM-PM04 | Professional mode ON | Level/tier labels hidden |
| GAM-PM05 | Professional mode ON | Celebration animations disabled |
| GAM-PM06 | Professional mode ON | Quest panel hidden |
| GAM-PM07 | Professional mode OFF -> ON -> OFF | State restores correctly, no data loss |
| GAM-PM08 | Professional mode per-workspace | Changing in workspace A does not affect workspace B |

---

## 10. CI/CD Pipeline Tests

### 10.1 Pre-commit Hooks

| Hook | Tool | Files | Failure Behavior |
|------|------|-------|-----------------|
| Python lint | ruff check | `*.py` | Block commit |
| Python format | ruff format --check | `*.py` | Block commit |
| Python type check | mypy | `app/` | Block commit |
| TypeScript lint | eslint | `*.ts`, `*.tsx` | Block commit |
| TypeScript format | prettier --check | `*.ts`, `*.tsx`, `*.css` | Block commit |
| TypeScript type check | tsc --noEmit | `src/` | Block commit |
| Secret detection | detect-secrets | All files | Block commit |
| Commit message | commitlint | Commit message | Enforce conventional commits |

### 10.2 PR Checks (GitHub Actions)

| Job | Steps | Pass Criteria |
|-----|-------|---------------|
| Backend Tests | `pytest --cov --cov-fail-under=85` with testcontainers | All tests pass, coverage >= 85% overall |
| Frontend Tests | `vitest run --coverage` | All tests pass, coverage >= 80% overall |
| Backend Lint | `ruff check . && ruff format --check . && mypy app/` | Zero errors |
| Frontend Lint | `eslint . && prettier --check .` | Zero errors |
| Type Check (FE) | `tsc --noEmit` | Zero errors |
| Security Scan | `safety check && npm audit` | No high/critical vulnerabilities |
| API Schema | `schemathesis run --validate-schema` | OpenAPI spec valid, no crashes |
| Docker Build | `docker compose build` | All services build successfully |

### 10.3 Docker Build Verification

| Test ID | Verification | Expected |
|---------|-------------|----------|
| CI-DK01 | Backend Dockerfile builds | Image created, < 500MB |
| CI-DK02 | Frontend Dockerfile builds | Image created, < 200MB |
| CI-DK03 | `docker compose up -d` starts all services | All 7 containers healthy (nginx, backend, ws, frontend, postgres, redis, celery) |
| CI-DK04 | Backend container healthcheck | `/health` returns 200 within 30s |
| CI-DK05 | Frontend container serves SPA | `curl localhost:3000` returns HTML |
| CI-DK06 | Database migrations run on startup | All migrations applied, tables created |
| CI-DK07 | Seed data loaded | Default user queryable |

### 10.4 Health Check Verification

| Test ID | Endpoint | Expected |
|---------|----------|----------|
| CI-HC01 | GET /health | 200, `{"status": "healthy", "version": "0.1.0"}` |
| CI-HC02 | GET /ready (all deps up) | 200, `{"status": "ready", "database": "connected", "redis": "connected"}` |
| CI-HC03 | GET /ready (DB down) | 503, `{"status": "not_ready", "database": "disconnected"}` |
| CI-HC04 | GET /ready (Redis down) | 503, `{"status": "not_ready", "redis": "disconnected"}` |

### 10.5 Smoke Test Suite (Post-Deploy)

Run within 5 minutes of production deploy:

| Test ID | Test | Expected |
|---------|------|----------|
| SMOKE01 | GET /health | 200 |
| SMOKE02 | GET /ready | 200 |
| SMOKE03 | POST /api/v1/auth/login (default user) | 200, valid JWT |
| SMOKE04 | GET /api/v1/agents (authenticated) | 200, valid JSON |
| SMOKE05 | POST /api/v1/agents (register test agent) | 201 |
| SMOKE06 | POST /api/v1/traces/events (ingest test event) | 202 |
| SMOKE07 | WebSocket connection | Connected, welcome message |
| SMOKE08 | GET /api/v1/leaderboard | 200, valid JSON |
| SMOKE09 | GET /api/v1/achievements | 200, 38 achievements |
| SMOKE10 | Cleanup: delete test agent | 200 |

---

## 11. Test Data & Environment Management

### 11.1 Test Fixtures and Factories

#### Backend Factories (factory-boy)

```python
# tests/factories.py
class UserFactory(factory.Factory):
    class Meta:
        model = User
    email = factory.LazyFunction(lambda: f"test_{uuid4().hex[:8]}@example.com")
    display_name = factory.Faker("name")
    password_hash = "$2b$12$..."  # Pre-computed bcrypt hash for "testpass123"
    is_active = True
    is_verified = True

class WorkspaceFactory(factory.Factory):
    class Meta:
        model = Workspace
    name = factory.Faker("company")
    slug = factory.LazyFunction(lambda: f"ws-{uuid4().hex[:8]}")
    tier = "pro"
    gamification_enabled = True

class AgentFactory(factory.Factory):
    class Meta:
        model = Agent
    agent_external_id = factory.LazyFunction(lambda: f"agent-{uuid4().hex[:8]}")
    name = factory.Faker("first_name")
    role = factory.Faker("random_element", elements=["researcher", "writer", "reviewer", "coder"])
    framework = factory.Faker("random_element", elements=["langchain", "crewai", "openai", "anthropic"])
    model = "gpt-4o"
    current_state = "idle"
    xp_total = 0
    level = 1
    tier_name = "Rookie"

class TaskFactory(factory.Factory):
    class Meta:
        model = Task
    title = factory.Faker("sentence")
    task_type = factory.Faker("random_element", elements=["research", "code_generation", "data_extraction"])
    priority = "medium"
    complexity = "medium"
    status = "pending"

class TaskResultFactory(factory.Factory):
    class Meta:
        model = TaskResult
    tokens_used = factory.Faker("random_int", min=100, max=50000)
    cost_usd = factory.Faker("pydecimal", left_digits=1, right_digits=4, positive=True)
    duration_ms = factory.Faker("random_int", min=1000, max=300000)
    quality_score = factory.Faker("pydecimal", left_digits=0, right_digits=2, min_value=0, max_value=1)

class EventFactory(factory.Factory):
    class Meta:
        model = Event
    trace_id = factory.LazyFunction(lambda: uuid4().hex)
    span_id = factory.LazyFunction(lambda: uuid4().hex[:16])
    event_type = "agent.task"
    event_action = "started"
    severity = "info"
    event_data = {}
```

#### Frontend Fixtures (MSW + Vitest)

```typescript
// tests/fixtures/agents.ts
export const mockAgent = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  agent_external_id: "test-agent-001",
  name: "ResearchBot",
  role: "researcher",
  framework: "langchain",
  model: "gpt-4o",
  current_state: "idle",
  xp_total: 4200,
  level: 12,
  tier_name: "Apprentice",
  streak_days: 5,
  total_tasks: 147,
  total_cost_usd: 8.42,
  total_tokens: 580000,
  total_errors: 3,
  achievements: [],
  created_at: "2026-01-15T10:00:00Z",
  last_heartbeat: "2026-03-16T14:30:00Z",
};

// MSW handlers
export const agentHandlers = [
  http.get("/api/v1/agents", () => HttpResponse.json({
    agents: [mockAgent],
    total: 1,
    page: 1,
    page_size: 50,
  })),
  http.get("/api/v1/agents/:id", ({ params }) =>
    HttpResponse.json(mockAgent)),
];
```

### 11.2 Seed Data for Demo/Sample Mode

| Data Set | Contents | Purpose |
|----------|----------|---------|
| Default user | kotsai@gmail.com / kots@123 | Default login for all environments |
| Sample workspace | "Demo Workspace" with 10 agents | Onboarding and demo |
| Sample agents | Mix of frameworks (langchain, crewai, openai, anthropic), levels 1-30 | Showcase gamification |
| Sample tasks | 200 tasks in various states (pending, in_progress, completed, failed) | Dashboard populated |
| Sample events | 10K events spanning 7 days | Replay and trace views |
| Sample achievements | 5 agents with 3-10 achievements each | Achievement showcase |
| Sample leaderboard | Pre-computed weekly snapshot | Leaderboard view |

Seed script: `python -m app.scripts.seed_demo_data` (idempotent, checks before insert).

### 11.3 Environment Parity Strategy

| Aspect | Dev (Local) | CI | Staging | Production |
|--------|-------------|-----|---------|-----------|
| Database | PostgreSQL 16 + TimescaleDB (Docker) | testcontainers (same versions) | Same as production | PostgreSQL 16 + TimescaleDB |
| Redis | Redis 7.2 (Docker) | testcontainers (same version) | Same as production | Redis 7.2 |
| Migrations | Auto on startup | Per-test-session | Alembic upgrade head | Alembic upgrade head (manual) |
| Seed data | Default user + demo data | Factory-generated per test | Demo data | Default user only |
| Config | `.env` file | Environment variables in workflow | Environment variables | Environment variables (secrets manager) |
| HTTPS | No (HTTP) | No | Yes (self-signed or Let's Encrypt) | Yes (managed cert) |
| CORS | `localhost:3000,5173` | Disabled | Staging domain | Production domain |

### 11.4 Database Cleanup Between Test Runs

**Strategy: Transaction rollback per test (preferred)**

```python
# conftest.py
@pytest.fixture(autouse=True)
async def db_session(engine):
    async with engine.connect() as conn:
        trans = await conn.begin()
        session = AsyncSession(bind=conn)
        yield session
        await trans.rollback()
```

**Fallback: Truncate tables between test modules**

```python
@pytest.fixture(scope="module", autouse=True)
async def clean_tables(engine):
    yield
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f"TRUNCATE TABLE {table.name} CASCADE"))
```

**Rules:**
- Unit tests: transaction rollback (fastest)
- Integration tests: transaction rollback where possible; truncate for tests that require committed data
- E2E tests: full database reset between suites, seed fresh data
- Never share test data across parallel workers (use unique workspace slugs)

---

*End of QA Test Strategy Document*
