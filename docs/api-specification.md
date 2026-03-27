# OpenAgentVisualizer API Specification

## Base URL

```
http://localhost:8000/api
```

## Authentication

All endpoints (except `/api/auth/*`) require a JWT Bearer token.

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user and workspace |
| POST | `/api/auth/login` | Authenticate, return JWT |

---

## Agent Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agents` | Register a new agent |
| GET | `/api/agents` | List agents for workspace |
| GET | `/api/agents/{id}` | Get agent detail |
| PUT | `/api/agents/{id}` | Update agent |
| DELETE | `/api/agents/{id}` | Delete agent |
| GET | `/api/agents/{id}/stats` | Get agent statistics (tokens, cost, level, XP) |

Agents include gamification fields: level, xp_total, total_tokens, total_cost_usd.

---

## Event Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/events` | Ingest a single event |
| POST | `/api/events/batch` | Ingest batch of events (Redis pipeline for performance) |
| GET | `/api/events` | Query events with filters |

Events are stored in a TimescaleDB hypertable for time-series performance. Batch ingestion uses Redis pipeline for high throughput.

---

## Session Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions` | Create agent session |
| GET | `/api/sessions` | List sessions |
| GET | `/api/sessions/{id}` | Get session detail |
| PUT | `/api/sessions/{id}` | Update session |
| DELETE | `/api/sessions/{id}` | End session |

---

## Span Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/spans` | List spans |
| GET | `/api/spans/{id}` | Get span detail |

Spans are OTLP-compatible with trace_id, span_id, parent_span_id.

---

## Gamification Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/gamification/leaderboard` | Get agent leaderboard by XP |
| POST | `/api/gamification/xp` | Award XP to an agent |
| GET | `/api/gamification/xp/{agent_id}` | Get XP transaction history |

### POST /api/gamification/xp

**Request Body:**
```json
{
  "agent_id": "string",
  "amount": 100,
  "reason": "task_completed",
  "metadata": {}
}
```

---

## Metrics Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/metrics/costs` | Cost summary per agent |
| GET | `/api/metrics/tokens` | Token usage per agent |
| GET | `/api/metrics/aggregated` | Hourly aggregated metrics |

Metrics use TimescaleDB hypertables (MetricsRaw) and continuous aggregates (MetricsAgg).

---

## Alert Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/alerts` | Create alert |
| GET | `/api/alerts` | List alerts |
| GET | `/api/alerts/{id}` | Get alert detail |
| PUT | `/api/alerts/{id}` | Update alert |
| DELETE | `/api/alerts/{id}` | Delete alert |

---

## WebSocket Endpoint

| Path | Description |
|------|-------------|
| `/ws/live` | Real-time event streaming via WebSocket |

Streams agent events in real-time for live visualization updates. Supports per-workspace filtering.

---

## OTLP Receiver Endpoint

| Method | Path | Description |
|--------|------|-------------|
| POST | `/otlp/v1/traces` | OTLP JSON trace receiver |

Accepts OpenTelemetry trace data in JSON format. Extracts spans and stores them for visualization.

---

## Error Responses

All errors follow this format:
```json
{
  "detail": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 404 | Resource not found |
| 422 | Unprocessable entity |
| 500 | Internal server error |
