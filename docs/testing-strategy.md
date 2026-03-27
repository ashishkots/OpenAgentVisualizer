# OpenAgentVisualizer Testing Strategy

## Overview

- **Backend framework:** pytest (pytest-asyncio)
- **Frontend framework:** Vitest + @testing-library/react
- **Coverage target:** 80%
- **Test database:** SQLite in-memory

---

## Test Inventory

### Backend Tests (13 files)

| File | Module Under Test | Focus |
|------|-------------------|-------|
| `test_agents.py` | Agent CRUD | Create, list, update, delete, stats |
| `test_events.py` | Event ingestion | Single and batch event ingestion |
| `test_sessions.py` | Session management | Lifecycle, status transitions |
| `test_gamification.py` | Gamification | XP transactions, leaderboard, leveling |
| `test_websocket.py` | WebSocket | Connection, event streaming |
| `test_otlp.py` | OTLP receiver | Trace parsing, span extraction |
| `test_metrics.py` | Metrics | Cost/token aggregation |
| `test_spans.py` | Span queries | List, filter, detail |
| `test_alerts.py` | Alert management | CRUD, severity levels |
| `test_auth.py` | Authentication | Register, login, JWT validation |
| `test_api_keys.py` | API keys | Create, revoke |
| `test_audit.py` | Audit log | Action recording |
| `test_tasks.py` | Task management | Agent task tracking |

### Test Location
```
src/backend/tests/
```

---

## Testing Patterns

### Async Database Tests
- SQLite in-memory with async session
- Transaction rollback per test
- `conftest.py` provides shared fixtures

### WebSocket Tests
- FastAPI TestClient WebSocket support
- Mock Redis for pub/sub testing
- Event delivery verification

### Performance Tests
- Batch event ingestion throughput
- Redis pipeline performance validation

---

## Coverage Areas

### Unit Tests
- Agent leveling calculations (XP to level)
- Event data validation
- OTLP JSON parsing
- Metrics aggregation logic
- Gamification scoring

### Integration Tests
- Full event ingestion pipeline (HTTP -> Redis -> DB)
- OTLP trace ingestion and span storage
- WebSocket connection and event streaming
- Gamification flow (event -> XP award -> leaderboard update)
- Agent lifecycle with stats tracking

### Frontend Tests
- PixiJS canvas rendering (snapshot tests)
- React component rendering
- State machine transitions (XState)
- Dashboard chart rendering (Recharts)
- WebSocket connection handling

---

## Running Tests

```bash
# Backend
cd src/backend
pip install -r requirements.txt
pytest -v --tb=short

# With coverage
pytest --cov=app --cov-report=term-missing

# Specific module
pytest tests/test_gamification.py -v

# Frontend
cd src/frontend
npm install
npm run test

# Frontend with coverage
npx vitest run --coverage
```

---

## CI/CD Integration

- GitHub Actions workflow_dispatch
- Backend: `pytest --cov=app --cov-fail-under=80`
- Frontend: `npx vitest run --coverage`
- Linting: ruff (backend), ESLint (frontend)
- Type checking: mypy (backend), tsc --noEmit (frontend)

---

## Gaps and Planned Improvements

| Gap | Priority | Plan |
|-----|----------|------|
| PixiJS rendering tests | High | Vitest with canvas mocking |
| XState state machine tests | High | Test machine transitions |
| WebSocket stress test | Medium | Test concurrent connections |
| TimescaleDB query perf tests | Medium | Benchmark with real PG |
| OTLP throughput benchmarks | Medium | k6 for trace ingestion |
| E2E visualization tests | Low | Playwright with visual regression |
| Celery task tests | Low | Mock broker for worker testing |
