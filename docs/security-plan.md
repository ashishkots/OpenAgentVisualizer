# OpenAgentVisualizer Security Plan

## 1. Authentication

### JWT Token Authentication
- **Library:** python-jose with HS256
- **Payload:** `sub` (user_id), `workspace_id`, `email`, `exp`
- **Secret:** `SECRET_KEY` environment variable

### Password Hashing
- **Library:** passlib + bcrypt==4.0.1
- **Storage:** Only hashed passwords in `users.hashed_password`

### API Key Authentication
- API keys stored as hashes in `api_keys` table
- Key prefix shown for identification
- Used for programmatic event ingestion and OTLP trace submission

### Default Credentials (Development)
- Email: kotsai@gmail.com / Password: kots@123
- Auto-seeded via SEED_EMAIL/SEED_PASSWORD environment variables

---

## 2. Authorization

### Multi-Tenant Isolation
- All queries filtered by `workspace_id`
- Foreign key constraints enforce data boundaries
- WebSocket connections scoped to workspace

### Workspace Roles
- `workspace_members` table with roles: owner, admin, member
- Role-based visibility and management permissions

---

## 3. Real-Time Security

### WebSocket Security
- JWT validation on WebSocket connection establishment
- Per-workspace event filtering
- Connection timeout and heartbeat

### Event Ingestion
- Batch ingestion via Redis pipeline for high throughput
- Input validation on all event data
- Rate limiting on event ingestion endpoints

### OTLP Receiver
- JSON-only OTLP receiver (no gRPC)
- Input validation and size limits
- Workspace scoping on all ingested traces

---

## 4. OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|------------|
| A01 Broken Access Control | workspace_id isolation, JWT validation, workspace roles |
| A02 Cryptographic Failures | bcrypt passwords, API key hashing |
| A03 Injection | SQLAlchemy ORM, Pydantic validation |
| A04 Insecure Design | Layered architecture, input validation |
| A05 Security Misconfiguration | Environment configs, health checks |
| A06 Vulnerable Components | Pinned dependencies (bcrypt==4.0.1) |
| A07 Auth Failures | JWT expiry, API key management |
| A08 Data Integrity | Audit log, TimescaleDB immutable hypertables |
| A09 Logging Failures | Audit log for all operations |
| A10 SSRF | No server-side URL fetching |

---

## 5. Infrastructure Security

### Docker Compose Services
- TimescaleDB (PG 16) on isolated network
- Redis 7.2 with AOF persistence
- Dedicated WebSocket service (port 8001)
- Dedicated OTLP gateway service (port 4318)
- Celery worker and beat as separate containers
- Nginx reverse proxy (port 8080)

### Nginx Security
- Reverse proxy for all services
- Single entry point on port 8080
- Path-based routing to backend/frontend/WebSocket
- Request size limits

### Production Recommendations
- TLS termination at nginx/ALB
- PostgreSQL SSL connections
- Redis AUTH with password
- Rotate SECRET_KEY periodically
- Network policies restricting inter-service traffic
- Disable DEBUG mode
- Configure CORS origins for production domains
- Remove default seed credentials
