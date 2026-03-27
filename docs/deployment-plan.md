# OpenAgentVisualizer Deployment Plan

## Architecture

```
                          +----------+
                          |  Client  |
                          +----+-----+
                               |
                        +------+------+
                        |   Nginx     |
                        |  port 8080  |
                        +------+------+
                               |
              +----------------+----------------+
              |                |                |
     +--------+------+  +-----+------+  +------+------+
     |   Frontend    |  |  Backend   |  | WebSocket   |
     |   React/TS    |  |  FastAPI   |  |  FastAPI    |
     |   port 3000   |  | port 8000  |  | port 8001   |
     +---------------+  +-----+------+  +------+------+
                              |                |
              +---------------+----------------+
              |                                |
     +--------+-------+              +--------+------+
     | TimescaleDB/PG |              |    Redis      |
     |   port 5432    |              |  port 6379    |
     +----------------+              +-------+-------+
                                             |
                                 +-----------+-----------+
                                 |                       |
                          +------+------+         +------+------+
                          | Celery      |         | Celery      |
                          | Worker      |         | Beat        |
                          +-------------+         +-------------+

     +-----------------+
     | OTLP Gateway    |
     | port 4318       |
     +-----------------+
```

---

## Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | timescale/timescaledb:latest-pg16 | 5432 | Primary DB with TimescaleDB |
| redis | redis:7.2-alpine | 6379 | Caching, event pipeline, pub/sub |
| backend | Custom (Dockerfile) | 8000 | Main FastAPI application |
| websocket | Custom (Dockerfile) | 8001 | WebSocket server for live events |
| otlp-gateway | Custom (Dockerfile) | 4318 | OTLP trace receiver |
| celery-worker | Custom (Dockerfile) | - | Background task processing |
| celery-beat | Custom (Dockerfile) | - | Periodic task scheduler |
| frontend | Custom (Dockerfile) | 3000 | React app (Vite dev server) |
| nginx | nginx:1.25-alpine | 8080 | Reverse proxy |

---

## Local Development

### Startup

```bash
cd OpenAgentVisualizer

# Start all services
docker compose up --build

# Access
# Application:   http://localhost:8080 (via nginx)
# Backend API:   http://localhost:8000
# WebSocket:     ws://localhost:8001/ws/live
# OTLP Gateway:  http://localhost:4318/otlp/v1/traces
# Frontend:      http://localhost:3000
# API docs:      http://localhost:8000/docs
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| SECRET_KEY | changeme-dev | JWT signing key |
| DATABASE_URL | postgresql+asyncpg://oav:oav@postgres:5432/oav | DB connection |
| REDIS_URL | redis://redis:6379/0 | Redis connection |
| SEED_EMAIL | kotsai@gmail.com | Default user email |
| SEED_PASSWORD | kots@123 | Default user password |
| VITE_API_URL | http://localhost/api | Frontend API URL |
| VITE_WS_URL | ws://localhost/ws | Frontend WebSocket URL |

---

## Service Details

### Backend (port 8000)
- Main API server with REST endpoints
- Handles agent management, events, metrics, gamification

### WebSocket Server (port 8001)
- Dedicated WebSocket service for real-time event streaming
- Subscribes to Redis pub/sub for event distribution
- 1 worker (single-threaded for WebSocket compatibility)

### OTLP Gateway (port 4318)
- Receives OpenTelemetry trace data (JSON format)
- Standard OTLP port (4318 for HTTP)
- 1 worker for trace processing

### Celery Worker
- Background task processing (concurrency: 4)
- Tasks: metrics aggregation, event processing, cleanup

### Celery Beat
- Periodic task scheduling
- Tasks: hourly metrics aggregation, data retention cleanup

### Nginx Reverse Proxy
- Routes `/api/*` to backend (port 8000)
- Routes `/ws/*` to WebSocket server (port 8001)
- Routes `/otlp/*` to OTLP gateway (port 4318)
- Routes everything else to frontend (port 3000)
- Config at `deploy/nginx/dev.conf`

---

## Database Migrations

```bash
# Apply migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Rollback
docker compose exec backend alembic downgrade -1
```

---

## CI/CD Pipeline

### GitHub Actions (workflow_dispatch only)

```yaml
on:
  workflow_dispatch:

jobs:
  test:
    - Setup Python 3.11
    - Install dependencies
    - pytest --cov=app --cov-fail-under=80

  build:
    - Build Docker images (backend, frontend, nginx)
    - Push to registry

  deploy:
    - Run migrations
    - Rolling restart (backend, websocket, otlp-gateway, workers)
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set strong SECRET_KEY
- [ ] Change SEED_EMAIL and SEED_PASSWORD or disable seed
- [ ] Configure PostgreSQL SSL
- [ ] Configure Redis AUTH
- [ ] Set up TLS termination at nginx
- [ ] Configure CORS/VITE_API_URL for production domains
- [ ] Set Celery worker concurrency based on load
- [ ] Configure TimescaleDB retention policies
- [ ] Set up continuous aggregates for metrics

### Rollback Strategy

1. **Database:** `alembic downgrade -1`
2. **Application:** Redeploy previous container tags
3. **Nginx:** Revert config to previous version
4. **Redis:** Flush cache (events rebuilt from DB)
5. **Blue-green:** Maintain previous containers, switch at nginx

### Health Checks

- Backend: `GET /health` (HTTP)
- PostgreSQL: `pg_isready -U oav`
- Redis: `redis-cli ping`

---

## Monitoring

### Key Metrics
- Event ingestion rate (events/sec)
- WebSocket active connections
- OTLP trace ingestion throughput
- PixiJS canvas render FPS (frontend)
- Agent XP distribution
- TimescaleDB chunk compression ratio
- Celery queue depth
- Redis memory usage
