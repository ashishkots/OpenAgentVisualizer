# OpenAgentVisualizer — Permissions Matrix

## Per-Role Tool Access

All agents operate within the `OpenAgentVisualizer/` product directory. No agent may modify files outside this boundary (hard constraint from base schema).

| Agent | read | write | git | bash | ci_cd | pr_review | web_search |
|-------|------|-------|-----|------|-------|-----------|------------|
| **Product Manager** | all | `product/`, `docs/` | yes | no | no | no | yes |
| **UX Designer** | all | `design/`, `docs/ux/` | yes | no | no | no | yes |
| **UI Designer** | all | `design/`, `docs/ui/`, `src/frontend/src/styles/` | yes | no | no | no | yes |
| **Tech Lead** | all | `src/`, `docs/technical/`, `configs/` | yes | yes | yes | yes | yes |
| **Frontend Expert** | all | `src/frontend/`, `tests/frontend/` | yes | yes | yes (trigger only) | no | yes |
| **Backend Expert** | all | `src/backend/`, `src/sdk/`, `tests/`, `db/` | yes | yes | yes (trigger only) | no | yes |
| **Code Reviewer** | all | no (comments only) | yes (read) | no | no | yes | no |
| **QA Engineer** | all | `tests/`, `qa/`, `docs/test-plans/` | yes | yes (test commands only) | yes (trigger only) | no | yes |
| **Agentic AI Expert** | all | `src/sdk/`, `docs/sdk/`, `configs/adapters/` | yes | yes | no | yes | yes |
| **DevOps Platform** | all | `deploy/`, `.github/`, `docker-compose.yml`, `configs/deploy/` | yes | yes | yes | no | yes |
| **Project Manager** | all | `docs/project/`, `plans/` | yes (read) | no | no | no | no |

## Write Scope Details

| Agent | Write Directories | Rationale |
|-------|------------------|-----------|
| **Product Manager** | `product/` — PRD, requirements, gamification specs; `docs/` — product documentation | Owns requirements and product-level documentation |
| **UX Designer** | `design/` — wireframes, user journeys, interaction flows; `docs/ux/` — UX documentation | Owns UX deliverables for virtual world canvas |
| **UI Designer** | `design/` — visual specs, theme tokens, avatar specs; `docs/ui/` — UI documentation; `src/frontend/src/styles/` — design tokens in code | Owns visual design and animation specs |
| **Tech Lead** | `src/` — architecture decisions in code; `docs/technical/` — ADRs, architecture docs; `configs/` — application configuration | Owns technical direction and architecture |
| **Frontend Expert** | `src/frontend/` — PixiJS canvas, XState machines, React components, Zustand stores; `tests/frontend/` — frontend tests | Owns frontend implementation including rendering pipeline |
| **Backend Expert** | `src/backend/` — OTLP receiver, Redis pipeline, gamification engine, WebSocket server; `src/sdk/` — Python SDK; `tests/` — backend + SDK tests; `db/` — migrations | Owns backend implementation and SDK |
| **Code Reviewer** | No file writes — adds comments to PRs only | Review-only role; never modifies code directly |
| **QA Engineer** | `tests/` — test files; `qa/` — test plans, bug reports; `docs/test-plans/` | Owns test artifacts including rendering benchmarks |
| **Agentic AI Expert** | `src/sdk/` — SDK adapter implementations; `docs/sdk/` — SDK documentation; `configs/adapters/` — adapter configs | Owns SDK adapter correctness and OTLP conformance |
| **DevOps Platform** | `deploy/` — deployment configs; `.github/` — GitHub Actions; `docker-compose.yml` — local dev stack | Owns infrastructure and deployment |
| **Project Manager** | `docs/project/` — project plans, status reports; `plans/` — sprint plans | Owns project planning artifacts |

## Denied Tools with Rationale

| Agent | Denied Tool | Rationale |
|-------|------------|-----------|
| Product Manager | bash | Non-technical role; no shell access needed |
| Product Manager | ci_cd | Does not own build/deploy pipeline |
| Product Manager | pr_review | Does not perform code review |
| UX Designer | bash | Design role; no shell access needed |
| UX Designer | ci_cd | Does not own build/deploy pipeline |
| UI Designer | bash | Design role; no shell access needed |
| UI Designer | ci_cd | Does not own build/deploy pipeline |
| Code Reviewer | write | Must not modify code — review-only role |
| Code Reviewer | bash | Review does not require command execution |
| Project Manager | bash | Non-technical coordination role |
| Project Manager | ci_cd | Does not own build/deploy pipeline |
| Project Manager | pr_review | Does not perform code review |
| Agentic AI Expert | ci_cd | Does not own build pipeline; uses bash for SDK validation only |

## Escalation for Permission Issues

If an agent requires access to a tool or directory outside its permissions:
1. Emit a structured blocker to the Tech Lead (for engineering tools) or PM (for product scope).
2. The blocker must include: what tool/path is needed, why, and what is blocked without it.
3. The Tech Lead or PM may grant a one-time exception with written rationale logged in the handoff trail.
4. Permanent permission changes require human approval.
