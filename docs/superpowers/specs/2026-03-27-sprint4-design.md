# Sprint 4 Design: Scale & Harden (Pre-Launch)

## Executive Summary

Sprint 4 prepares OpenAgentVisualizer for real user onboarding by running a hybrid hardening strategy: load-test-driven performance fixes combined with a security/reliability audit. Target scale: 100-500 concurrent agents, 10 concurrent users, single-server deployment.

## Success Metrics

| Metric | Target |
|--------|--------|
| API p95 latency | < 200ms |
| API p99 latency | < 500ms |
| WebSocket delivery rate | > 99.5% at 500 agents |
| Event ingestion throughput | 1000 events/sec sustained |
| Canvas FPS (100 agents) | 60fps |
| Canvas FPS (500 agents) | 30fps |
| Database query max | < 100ms |
| Load test duration | 30 minutes sustained without degradation |
| Auth brute-force protection | 5 attempts/min per IP |

## Track 1: Performance

### Load Testing Infrastructure

- **Tool**: Locust (Python-based, matches backend stack)
- **Location**: `tests/load/`
- **Docker Integration**: `docker-compose.loadtest.yml` with Locust master + workers
- **Test Scenarios**:
  - Scenario 1: Ramp to 500 agents over 5 minutes, sustain 30 minutes
  - Scenario 2: 10 concurrent users performing CRUD + dashboard browsing
  - Scenario 3: WebSocket stress — 500 simultaneous connections with 10 msg/sec each
  - Scenario 4: Event ingestion burst — 1000 events/sec for 10 minutes
  - Scenario 5: Mixed workload — all scenarios combined
- **Metrics Captured**: p50/p95/p99 latency, error rate, WebSocket message delivery %, throughput (req/sec), connection pool utilization, memory usage

### Performance Fixes

**OAV-403: Database Index Audit**
- Analyze slow query log during load tests
- Add composite indexes on high-query tables:
  - `events(workspace_id, agent_id, timestamp)` — already exists, verify covering
  - `events(session_id, event_type, timestamp)` — for replay + filtering
  - `agents(workspace_id, status)` — for dashboard filtering
  - `achievements(workspace_id, agent_id)` — for leaderboard queries
  - `metrics_raw(agent_id, metric_type, timestamp)` — for analytics
- Add `EXPLAIN ANALYZE` to test suite for critical queries

**OAV-404: Connection Pool Tuning**
- SQLAlchemy async pool: `pool_size=10`, `max_overflow=20`, `pool_recycle=300`, `pool_pre_ping=True`
- Redis connection pool: `max_connections=50`, `retry_on_timeout=True`
- Add pool utilization to Prometheus metrics
- Query timeout: `statement_timeout=30000` (30s)

**OAV-405: WebSocket Backpressure**
- Message batching: buffer up to 10 messages or 50ms, whichever comes first
- Per-connection send queue with max depth (100 messages)
- Drop oldest messages when queue full (with counter metric)
- Backpressure signal to event pipeline when > 80% connections are backed up

**OAV-406: PixiJS Sprite Pool Scaling**
- Increase pool capacity from 50 to 600 (with 20% headroom over 500 target)
- Level-of-detail system: full sprites at zoom > 0.5, simplified circles at zoom 0.2-0.5, dots at zoom < 0.2
- Frustum culling: only render sprites within viewport bounds (already exists, verify efficiency)
- Text label culling: hide labels when > 100 sprites visible
- Batch render optimization: group sprites by texture atlas

**OAV-407: API Pagination Enforcement**
- All list endpoints must accept `limit` (default 50, max 200) and `offset` parameters
- Audit and enforce on: GET /api/agents, GET /api/events, GET /api/alerts, GET /api/sessions, GET /api/traces, GET /api/achievements
- Return `X-Total-Count` header for frontend pagination UI
- Cursor-based pagination for event streams (already implemented in replay, extend to other endpoints)

**OAV-408: Celery Task Queue Prioritization**
- 3 priority queues: `critical` (achievement eval, alert processing), `default` (metrics aggregation, graph computation), `bulk` (integration sync, cleanup)
- Worker allocation: 2 workers on critical, 2 on default, 1 on bulk (configurable)
- Task timeout: 60s for critical, 300s for default, 600s for bulk
- Task retry with exponential backoff (max 3 retries)

## Track 2: Security & Reliability

### Security

**OAV-411: Rate Limiting**
- Library: `slowapi` (Redis-backed token bucket)
- Tier definitions:
  - Auth endpoints (login, register): 5/min per IP
  - API endpoints (CRUD): 100/min per user
  - WebSocket messages: 50/sec per connection
  - Event ingestion: 1000/min per API key
  - Prometheus /metrics: 30/min per IP
- Response: HTTP 429 with `Retry-After` header and `X-RateLimit-Remaining` header
- Nginx layer: additional 1000 req/min per IP as first defense

**OAV-412: OWASP Security Scan**
- Run `bandit` (Python SAST) on all backend code
- Run `npm audit` on frontend dependencies
- Manual review of OWASP Top 10:
  1. Injection — verify all Pydantic validation, parameterized queries
  2. Broken Auth — JWT expiry, token storage, session management
  3. Sensitive Data — API keys encrypted (Fernet), no PII in logs
  4. XXE — not applicable (JSON only)
  5. Broken Access Control — workspace isolation verified per request
  6. Misconfig — production defaults, CORS, headers
  7. XSS — React escapes by default, verify dangerouslySetInnerHTML absence
  8. Deserialization — Pydantic strict parsing
  9. Components — dependency vulnerability scan
  10. Logging — structured logging with PII redaction
- Fix all HIGH/CRITICAL findings before launch

**OAV-413: JWT Hardening**
- Reduce token expiry from current value to 15 minutes
- Add refresh token endpoint: POST /api/auth/refresh
- Refresh token: httpOnly cookie, 7-day expiry, rotated on use
- Token revocation: Redis-backed blocklist for logout
- Add `jti` (JWT ID) claim for revocation tracking

**OAV-414: API Key Rotation**
- POST /api/api-keys/{id}/rotate — generates new key, returns it once, old key valid for 24h grace period
- Grace period allows migration without downtime
- Audit log entry on rotation

**OAV-415: Secrets + CORS + Input Validation Audit**
- Scan codebase for hardcoded secrets (regex: passwords, tokens, keys)
- CORS: restrict to explicit origins in production (no wildcard)
- Content-Security-Policy header
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (except UE5 embed path)
- Validate all string inputs have max length constraints in Pydantic models
- Validate all numeric inputs have range constraints

**OAV-416: Fernet Key Rotation**
- Support multiple Fernet keys (MultiFernet)
- New key added to front of key list, old keys kept for decryption
- Celery task to re-encrypt all integration configs with latest key
- Document rotation procedure in ops guide

### Reliability

**OAV-421: Structured Logging**
- Replace all `print()` and basic `logging` with `structlog`
- JSON output format for production, colored console for development
- Correlation ID middleware: generate UUID per HTTP request
- Propagate correlation ID through:
  - WebSocket messages (as header)
  - Celery tasks (as task header)
  - Log context (bound to structlog context)
- PII redaction processor: mask email addresses and API keys in logs

**OAV-422: Health Checks**
- GET /api/health/live — returns 200 if process is running (for Docker HEALTHCHECK)
- GET /api/health/ready — returns 200 only if all dependencies are reachable:
  - PostgreSQL: execute `SELECT 1`
  - Redis: execute `PING`
  - Celery: check at least 1 worker registered
- Docker HEALTHCHECK on all services (backend, websocket, otlp-gateway, celery-worker)
- Health status exposed in Prometheus metrics

**OAV-423: Graceful Shutdown**
- SIGTERM handler on backend: stop accepting new connections, drain in-flight requests (30s timeout)
- WebSocket: send close frame to all connections, wait for acknowledgment (5s timeout)
- Celery worker: `CELERY_WORKER_HIJACK_ROOT_LOGGER=False`, warm shutdown with task completion
- Database: dispose connection pool cleanly
- Redis: flush pipeline buffers before disconnect
- Connection retry: exponential backoff (1s, 2s, 4s, 8s, max 30s) with jitter for all external connections

**OAV-424: Dead Letter Queue**
- Failed Celery tasks (after 3 retries) moved to `dead_letter` queue
- DLQ endpoint: GET /api/admin/dlq — list failed tasks
- POST /api/admin/dlq/{task_id}/retry — manual retry
- Celery beat task: alert if DLQ depth > 10

## Track 3: Infrastructure & Observability

**OAV-431: Grafana Dashboard**
- Pre-built dashboard JSON in `deploy/grafana/dashboards/`
- Panels: request rate, latency percentiles, error rate, WebSocket connections, event ingestion rate, Celery queue depth, connection pool utilization, cache hit ratio
- Alert rules in `deploy/prometheus/alerts.yml`:
  - Error rate > 5% for 5 minutes
  - p99 latency > 1s for 5 minutes
  - WebSocket connections drop > 10% in 1 minute
  - Disk usage > 80%
  - DLQ depth > 10

**OAV-432: Extended Prometheus Metrics**
- Add to existing 7 metrics:
  - `oav_db_pool_size` (Gauge) — current pool utilization
  - `oav_db_pool_overflow` (Gauge) — overflow connections
  - `oav_redis_pool_active` (Gauge) — active Redis connections
  - `oav_cache_hits_total` (Counter) — Redis cache hits
  - `oav_cache_misses_total` (Counter) — Redis cache misses
  - `oav_ws_messages_dropped_total` (Counter) — backpressure drops
  - `oav_rate_limit_hits_total` (Counter) — rate limit 429s
  - `oav_celery_dlq_depth` (Gauge) — dead letter queue size

**OAV-433: Production Environment**
- `.env.production` template with all required variables documented
- Docker HEALTHCHECK directives on all 9 services
- Restart policies: `unless-stopped` for all services
- Log driver: `json-file` with `max-size: 10m`, `max-file: 3`
- Volume mounts for persistent data (postgres, redis AOF)

**OAV-434: Nginx Hardening**
- Rate limiting: `limit_req_zone` at 1000 req/min per IP
- Gzip: enable for `application/json`, `text/html`, `text/css`, `application/javascript`
- Static cache: `Cache-Control: public, max-age=31536000` for hashed assets
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Request body size limit: 10MB
- Proxy buffer tuning for WebSocket upgrade

## Feature Priority Matrix

| Priority | IDs | Count |
|----------|-----|-------|
| Must-have | OAV-401, 402, 403, 404, 405, 406, 411, 412, 413, 415, 421, 422, 423, 433, 434 | 15 |
| Should-have | OAV-407, 408, 414, 416, 424, 431, 432 | 7 |

## Dependency Map

```
OAV-401 (Locust infra) → OAV-402 (load test scenarios) → OAV-403 (index audit)
                                                         → OAV-404 (pool tuning)
                                                         → OAV-405 (WS backpressure)
                                                         → OAV-406 (sprite scaling)

OAV-421 (structlog) → OAV-422 (health checks) → OAV-433 (production env)
                                                → OAV-434 (nginx hardening)

OAV-411 (rate limiting) — independent
OAV-412 (OWASP scan) — independent
OAV-413 (JWT hardening) — independent
OAV-415 (audit) — independent

OAV-431 (Grafana) depends on OAV-432 (extended metrics)
OAV-424 (DLQ) depends on OAV-408 (Celery queues)
```

Performance track runs load tests first, then fixes what breaks.
Security track runs independently in parallel.
Infrastructure track depends on reliability being in place.

## Non-Goals (Sprint 4)

- Kubernetes deployment (Sprint 4C: Enterprise scale)
- Multi-region replication
- Horizontal auto-scaling
- User-facing rate limit UI
- Performance profiling beyond load testing
