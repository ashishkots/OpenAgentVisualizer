# OpenAgentVisualizer Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the FastAPI backend with PostgreSQL/TimescaleDB, Redis event bus, OTLP ingestion gateway, WebSocket real-time push, gamification engine (XP/leveling), loop detector, cost aggregation, and Celery workers.

**Architecture:** Event-driven pipeline — SDK sends OTLP spans or REST events → OTLP gateway normalises → publishes to Redis Streams → Persist Writer saves to TimescaleDB → Aggregation Engine computes metrics → WebSocket Server fans out to browser clients via Redis Pub/Sub. All API I/O is async (asyncpg, aioredis, httpx).

**Tech Stack:** Python 3.12, FastAPI 0.110.3, Uvicorn 0.29.0, SQLAlchemy 2.0.31 (async), asyncpg 0.29.0, Alembic 1.13.2, PostgreSQL 16 + TimescaleDB, Redis 7.2 (hiredis), Celery 5.4.0, python-jose 3.3.0, passlib 1.7.4, bcrypt 4.0.1, opentelemetry-proto 1.24.0, grpcio 1.64.1, pytest + pytest-asyncio

---

## File Structure

```
src/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                        # FastAPI app factory, lifespan, seed_default_user
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                  # Pydantic Settings (env vars)
│   │   ├── database.py                # async engine, session factory, get_db dep
│   │   ├── redis_client.py            # aioredis pool, get_redis dep
│   │   ├── security.py                # JWT create/verify, password hash/verify
│   │   └── dependencies.py            # get_current_user, get_workspace deps
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                    # User, Workspace, WorkspaceMember, APIKey
│   │   ├── agent.py                   # Agent, Task
│   │   ├── event.py                   # Event (TimescaleDB hypertable), Span, Session
│   │   ├── metrics.py                 # MetricsRaw, MetricsAgg (hypertables)
│   │   ├── gamification.py            # XPTransaction, Alert
│   │   └── audit.py                   # AuditLog
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py                    # LoginRequest, TokenResponse, RegisterRequest
│   │   ├── agent.py                   # AgentCreate, AgentRead, AgentStatus
│   │   ├── event.py                   # EventCreate, EventRead, OTLPSpan
│   │   ├── session.py                 # SessionCreate, SessionRead, ReplayEvent
│   │   ├── metrics.py                 # CostSummary, TokenUsage
│   │   ├── gamification.py            # XPEvent, LevelUp, AlertRead
│   │   └── workspace.py               # WorkspaceCreate, WorkspaceRead, APIKeyCreate
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                    # POST /auth/register, /auth/login, /auth/refresh
│   │   ├── agents.py                  # CRUD /agents, GET /agents/{id}/stats
│   │   ├── events.py                  # POST /events (REST ingest), GET /events
│   │   ├── sessions.py                # POST /sessions, GET /sessions/{id}/replay
│   │   ├── metrics.py                 # GET /metrics/costs, /metrics/tokens
│   │   ├── gamification.py            # GET /agents/{id}/xp, /leaderboard
│   │   ├── alerts.py                  # GET /alerts, PATCH /alerts/{id}
│   │   ├── workspace.py               # GET/POST /workspaces, /api-keys
│   │   └── websocket.py               # WS /ws/live, WS /ws/replay/{session_id}
│   └── services/
│       ├── __init__.py
│       ├── event_pipeline.py          # normalise + publish to Redis Streams
│       ├── persist_writer.py          # Redis Streams consumer → DB writer
│       ├── aggregation_engine.py      # Redis Streams consumer → MetricsAgg
│       ├── websocket_manager.py       # Redis Pub/Sub → connected WS clients
│       ├── gamification_service.py    # XP award, level-up calc, leaderboard
│       ├── loop_detector.py           # circular call detection, threshold alerts
│       ├── cost_service.py            # token → USD cost calculation + aggregation
│       └── otlp_service.py            # protobuf decode, span normalisation
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── 001_initial_schema.py
│       └── 002_timescale_hypertables.py
├── tests/
│   ├── conftest.py                    # async engine, test DB, test client fixtures
│   ├── test_auth.py
│   ├── test_agents.py
│   ├── test_events.py
│   ├── test_sessions.py
│   ├── test_metrics.py
│   ├── test_gamification.py
│   ├── test_loop_detector.py
│   ├── test_websocket.py
│   └── test_otlp_service.py
├── Dockerfile
└── requirements.txt
```

---

## Task 1: Project Scaffold & Requirements

**Files:**
- Create: `src/backend/requirements.txt`
- Create: `src/backend/Dockerfile`
- Create: `src/backend/app/__init__.py`
- Create: `src/backend/app/core/__init__.py`

- [ ] **Step 1: Create requirements.txt**

```txt
# Core Framework
fastapi==0.110.3
uvicorn[standard]==0.29.0
pydantic==2.7.4
pydantic-settings==2.3.4
email-validator==2.2.0

# Database
sqlalchemy[asyncio]==2.0.31
asyncpg==0.29.0
alembic==1.13.2
greenlet==3.0.3

# Redis
redis[hiredis]==5.0.7

# Auth
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-multipart==0.0.9
httpx==0.27.0

# Task Queue
celery[redis]==5.4.0

# OTLP / Protobuf
opentelemetry-proto==1.24.0
protobuf==4.25.3
grpcio==1.64.1

# Utilities
orjson==3.10.5
python-dateutil==2.9.0
uuid7==0.1.0

# Testing
pytest==8.2.2
pytest-asyncio==0.23.7
pytest-cov==5.0.0
factory-boy==3.3.0
faker==25.9.1
testcontainers[postgres,redis]==4.5.1
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 3: Create empty `__init__.py` files** for `app/`, `app/core/`, `app/models/`, `app/schemas/`, `app/routers/`, `app/services/`

- [ ] **Step 4: Commit**
```bash
git add src/backend/requirements.txt src/backend/Dockerfile src/backend/app/
git commit -m "feat(backend): project scaffold and requirements"
```

---

## Task 2: Config & Database Layer

**Files:**
- Create: `src/backend/app/core/config.py`
- Create: `src/backend/app/core/database.py`
- Create: `src/backend/app/core/redis_client.py`

- [ ] **Step 1: Write failing config test**

```python
# tests/test_config.py
def test_config_loads_database_url():
    from app.core.config import settings
    assert settings.DATABASE_URL.startswith("postgresql+asyncpg://")

def test_config_loads_redis_url():
    from app.core.config import settings
    assert settings.REDIS_URL.startswith("redis://")
```

Run: `cd src/backend && pytest tests/test_config.py -v`
Expected: FAIL — ImportError

- [ ] **Step 2: Implement `app/core/config.py`**

```python
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, RedisDsn, field_validator
from typing import Any

class Settings(BaseSettings):
    # App
    APP_NAME: str = "OpenAgentVisualizer"
    SECRET_KEY: str = "changeme-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://oav:oav@localhost:5432/oav"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # OTLP
    OTLP_GRPC_PORT: int = 4317
    OTLP_HTTP_PORT: int = 4318

    # Default seed user
    SEED_EMAIL: str = "kotsai@gmail.com"
    SEED_PASSWORD: str = "kots@123"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

- [ ] **Step 3: Implement `app/core/database.py`**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 4: Implement `app/core/redis_client.py`**

```python
import redis.asyncio as aioredis
from app.core.config import settings

_redis_pool: aioredis.Redis | None = None

async def get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_pool

async def close_redis():
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None
```

- [ ] **Step 5: Run tests and verify pass**

Run: `pytest tests/test_config.py -v`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/backend/app/core/
git commit -m "feat(backend): config, database, and redis client"
```

---

## Task 3: Security — JWT & Password Hashing

**Files:**
- Create: `src/backend/app/core/security.py`
- Create: `src/backend/tests/test_security.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_security.py
from app.core.security import hash_password, verify_password, create_access_token, decode_token

def test_password_round_trip():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed)
    assert not verify_password("wrong", hashed)

def test_jwt_round_trip():
    token = create_access_token({"sub": "user-123", "workspace_id": "ws-abc"})
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["workspace_id"] == "ws-abc"

def test_expired_token_raises():
    import pytest
    from jose import JWTError
    token = create_access_token({"sub": "x"}, expires_delta_minutes=-1)
    with pytest.raises(JWTError):
        decode_token(token)
```

Run: `pytest tests/test_security.py -v`
Expected: FAIL — ImportError

- [ ] **Step 2: Implement `app/core/security.py`**

```python
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta_minutes: int | None = None) -> str:
    minutes = expires_delta_minutes if expires_delta_minutes is not None else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({**data, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

- [ ] **Step 3: Run tests**

Run: `pytest tests/test_security.py -v`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**
```bash
git add src/backend/app/core/security.py src/backend/tests/test_security.py
git commit -m "feat(backend): JWT auth and password hashing"
```

---

## Task 4: Database Models

**Files:**
- Create: `src/backend/app/models/user.py`
- Create: `src/backend/app/models/agent.py`
- Create: `src/backend/app/models/event.py`
- Create: `src/backend/app/models/metrics.py`
- Create: `src/backend/app/models/gamification.py`
- Create: `src/backend/app/models/audit.py`
- Modify: `src/backend/app/models/__init__.py`

- [ ] **Step 1: Write model structure test**

```python
# tests/test_models.py
def test_all_models_importable():
    from app.models.user import User, Workspace, WorkspaceMember, APIKey
    from app.models.agent import Agent, Task
    from app.models.event import Event, Span, Session
    from app.models.metrics import MetricsRaw, MetricsAgg
    from app.models.gamification import XPTransaction, Alert
    from app.models.audit import AuditLog
    # All importable without error
    assert User.__tablename__ == "users"
    assert Agent.__tablename__ == "agents"
```

Run: `pytest tests/test_models.py -v`
Expected: FAIL — ImportError

- [ ] **Step 2: Implement `app/models/user.py`**

```python
from sqlalchemy import String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Workspace(Base):
    __tablename__ = "workspaces"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    members: Mapped[list["WorkspaceMember"]] = relationship(back_populates="workspace")
    agents: Mapped[list["Agent"]] = relationship(back_populates="workspace")  # type: ignore[name-defined]

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    memberships: Mapped[list["WorkspaceMember"]] = relationship(back_populates="user")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(20), default="member")
    workspace: Mapped["Workspace"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="memberships")

class APIKey(Base):
    __tablename__ = "api_keys"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    key_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
```

- [ ] **Step 3: Implement `app/models/agent.py`**

```python
from sqlalchemy import String, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from app.core.database import Base
from app.models.user import utcnow

class Agent(Base):
    __tablename__ = "agents"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(100), default="agent")
    framework: Mapped[str] = mapped_column(String(50), default="custom")
    avatar_id: Mapped[str] = mapped_column(String(50), default="default")
    status: Mapped[str] = mapped_column(String(20), default="idle")
    # Gamification
    level: Mapped[int] = mapped_column(Integer, default=1)
    xp_total: Mapped[int] = mapped_column(Integer, default=0)
    # Cost tracking
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
    workspace: Mapped["Workspace"] = relationship(back_populates="agents")  # type: ignore[name-defined]
    tasks: Mapped[list["Task"]] = relationship(back_populates="agent")

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    result: Mapped[str | None] = mapped_column(Text, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    agent: Mapped["Agent"] = relationship(back_populates="tasks")
```

- [ ] **Step 4: Implement `app/models/event.py`**

```python
from sqlalchemy import String, Integer, Float, BigInteger, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
import uuid
from app.core.database import Base
from app.models.user import utcnow

class Event(Base):
    """TimescaleDB hypertable — partition key is timestamp."""
    __tablename__ = "events"
    __table_args__ = (Index("ix_events_workspace_ts", "workspace_id", "timestamp"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. agent.task.started
    timestamp: Mapped[datetime] = mapped_column(default=utcnow)
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

class Span(Base):
    """OTLP spans — TimescaleDB hypertable."""
    __tablename__ = "spans"
    __table_args__ = (Index("ix_spans_workspace_ts", "workspace_id", "start_time"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    trace_id: Mapped[str] = mapped_column(String(64), nullable=False)
    span_id: Mapped[str] = mapped_column(String(32), nullable=False)
    parent_span_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_time: Mapped[datetime] = mapped_column(nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ok")
    attributes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

class Session(Base):
    """Replay sessions."""
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    agent_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    event_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(default=utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)
```

- [ ] **Step 5: Implement `app/models/metrics.py`**

```python
from sqlalchemy import String, Integer, Float, Index
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid
from app.core.database import Base
from app.models.user import utcnow

class MetricsRaw(Base):
    """Raw token/cost data point — TimescaleDB hypertable."""
    __tablename__ = "metrics_raw"
    __table_args__ = (Index("ix_metrics_raw_agent_ts", "agent_id", "timestamp"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    task_id: Mapped[str | None] = mapped_column(String, nullable=True)
    model: Mapped[str] = mapped_column(String(100), default="unknown")
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[datetime] = mapped_column(default=utcnow)

class MetricsAgg(Base):
    """Hourly aggregated metrics."""
    __tablename__ = "metrics_agg"
    __table_args__ = (Index("ix_metrics_agg_agent_bucket", "agent_id", "bucket"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    bucket: Mapped[datetime] = mapped_column(nullable=False)   # truncated to 1hr
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    task_count: Mapped[int] = mapped_column(Integer, default=0)
```

- [ ] **Step 6: Implement `app/models/gamification.py`**

```python
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from app.core.database import Base
from app.models.user import utcnow

class XPTransaction(Base):
    __tablename__ = "xp_transactions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str] = mapped_column(String, nullable=False)
    task_id: Mapped[str | None] = mapped_column(String, nullable=True)
    xp_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)  # loop_detected, threshold
    severity: Mapped[str] = mapped_column(String(20), default="warning")
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
```

- [ ] **Step 7: Implement `app/models/audit.py`**

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from app.core.database import Base
from app.models.user import utcnow

class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
```

- [ ] **Step 8: Update `app/models/__init__.py`**

```python
from app.models.user import User, Workspace, WorkspaceMember, APIKey
from app.models.agent import Agent, Task
from app.models.event import Event, Span, Session
from app.models.metrics import MetricsRaw, MetricsAgg
from app.models.gamification import XPTransaction, Alert
from app.models.audit import AuditLog

__all__ = [
    "User", "Workspace", "WorkspaceMember", "APIKey",
    "Agent", "Task",
    "Event", "Span", "Session",
    "MetricsRaw", "MetricsAgg",
    "XPTransaction", "Alert",
    "AuditLog",
]
```

- [ ] **Step 9: Run model tests**

Run: `pytest tests/test_models.py -v`
Expected: PASS

- [ ] **Step 10: Commit**
```bash
git add src/backend/app/models/
git commit -m "feat(backend): all SQLAlchemy models with TimescaleDB hypertable support"
```

---

## Task 5: Alembic Migrations

**Files:**
- Create: `src/backend/alembic/env.py`
- Create: `src/backend/alembic/versions/001_initial_schema.py`
- Create: `src/backend/alembic/versions/002_timescale_hypertables.py`
- Create: `src/backend/alembic.ini`

- [ ] **Step 1: Create `alembic.ini`** (standard Alembic init, point `sqlalchemy.url` to env var)

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+asyncpg://oav:oav@localhost:5432/oav
```

- [ ] **Step 2: Create `alembic/env.py`** using async engine pattern

```python
import asyncio
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import Base
import app.models  # noqa: ensure all models are registered

config = context.config
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(url=settings.DATABASE_URL, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(lambda c: context.configure(connection=c, target_metadata=target_metadata))
        await conn.run_sync(lambda _: context.run_migrations())
    await engine.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

- [ ] **Step 3: Create `alembic/versions/001_initial_schema.py`** — `op.create_table` for all 12 tables

- [ ] **Step 4: Create `alembic/versions/002_timescale_hypertables.py`** — convert `events`, `spans`, `metrics_raw`, `metrics_agg` to hypertables

```python
def upgrade():
    op.execute("SELECT create_hypertable('events', 'timestamp', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('spans', 'start_time', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('metrics_raw', 'timestamp', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('metrics_agg', 'bucket', if_not_exists => TRUE)")
```

- [ ] **Step 5: Commit**
```bash
git add src/backend/alembic/
git commit -m "feat(backend): Alembic migrations with TimescaleDB hypertable conversion"
```

---

## Task 6: Auth Router & User Seeding

**Files:**
- Create: `src/backend/app/schemas/auth.py`
- Create: `src/backend/app/routers/auth.py`
- Create: `src/backend/app/core/dependencies.py`
- Create: `src/backend/tests/test_auth.py`
- Modify: `src/backend/app/main.py`

- [ ] **Step 1: Write failing auth tests**

```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # Register
    r = await client.post("/api/auth/register", json={
        "email": "test@example.com", "password": "secret123", "workspace_name": "Test WS"
    })
    assert r.status_code == 201

    # Login
    r = await client.post("/api/auth/login", json={"email": "test@example.com", "password": "secret123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data

@pytest.mark.asyncio
async def test_invalid_credentials_rejected(client: AsyncClient):
    r = await client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "x"})
    assert r.status_code == 401

@pytest.mark.asyncio
async def test_invalid_api_key_rejected(client: AsyncClient):
    r = await client.get("/api/agents", headers={"X-API-Key": "oav_fake"})
    assert r.status_code == 401
```

Run: `pytest tests/test_auth.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `app/schemas/auth.py`**

```python
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    workspace_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    workspace_id: str
```

- [ ] **Step 3: Implement `app/routers/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, Workspace, WorkspaceMember
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
import uuid, re

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

@router.post("/register", status_code=201, response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == req.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=req.email, hashed_password=hash_password(req.password))
    slug = _slug(req.workspace_name)
    ws = Workspace(name=req.workspace_name, slug=f"{slug}-{uuid.uuid4().hex[:6]}")
    member = WorkspaceMember(workspace=ws, user=user, role="owner")
    db.add_all([user, ws, member])
    await db.commit()
    token = create_access_token({"sub": user.id, "workspace_id": ws.id})
    return TokenResponse(access_token=token, workspace_id=ws.id)

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == req.email))
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    member = await db.scalar(select(WorkspaceMember).where(WorkspaceMember.user_id == user.id))
    if not member:
        raise HTTPException(status_code=400, detail="No workspace found")
    token = create_access_token({"sub": user.id, "workspace_id": member.workspace_id})
    return TokenResponse(access_token=token, workspace_id=member.workspace_id)
```

- [ ] **Step 4: Implement `app/core/dependencies.py`**

```python
from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token, hash_password
from app.models.user import User, APIKey
from jose import JWTError

async def get_current_user(authorization: str = Header(...), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_workspace_id_from_api_key(
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> str:
    if x_api_key:
        key_hash = hash_password.__module__  # use passlib verify
        from passlib.context import CryptContext
        ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        keys = (await db.execute(select(APIKey).where(APIKey.is_active == True))).scalars().all()
        for key in keys:
            if ctx.verify(x_api_key, key.key_hash):
                return key.workspace_id
        raise HTTPException(status_code=401, detail="Invalid API key")
    raise HTTPException(status_code=401, detail="Authentication required")
```

- [ ] **Step 5: Implement `app/main.py`** with lifespan and seed user

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.redis_client import close_redis
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User, Workspace, WorkspaceMember
from app.routers import auth
import uuid, re

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_default_user()
    yield
    await close_redis()

async def seed_default_user():
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.email == settings.SEED_EMAIL))
        if existing:
            return
        user = User(email=settings.SEED_EMAIL, hashed_password=hash_password(settings.SEED_PASSWORD))
        ws = Workspace(name="Default Workspace", slug=f"default-{uuid.uuid4().hex[:6]}")
        member = WorkspaceMember(workspace=ws, user=user, role="owner")
        db.add_all([user, ws, member])
        await db.commit()

app = FastAPI(title="OpenAgentVisualizer API", lifespan=lifespan)
app.include_router(auth.router)
```

- [ ] **Step 6: Create `tests/conftest.py`** with async test client fixture

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.core.database import Base, get_db

TEST_DB_URL = "postgresql+asyncpg://oav:oav@localhost:5432/oav_test"

@pytest_asyncio.fixture(scope="function")
async def client():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async def override_db():
        async with SessionLocal() as session:
            yield session
    app.dependency_overrides[get_db] = override_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
```

- [ ] **Step 7: Run auth tests**

Run: `pytest tests/test_auth.py -v`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**
```bash
git add src/backend/app/routers/auth.py src/backend/app/core/dependencies.py src/backend/app/main.py src/backend/tests/
git commit -m "feat(backend): auth router, JWT dependencies, seed user"
```

---

## Task 7: Agent & Task CRUD Routers

**Files:**
- Create: `src/backend/app/schemas/agent.py`
- Create: `src/backend/app/routers/agents.py`
- Create: `src/backend/tests/test_agents.py`

- [ ] **Step 1: Write failing agent tests**

```python
# tests/test_agents.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_and_list_agents(authed_client: AsyncClient):
    r = await authed_client.post("/api/agents", json={
        "name": "ResearchBot", "role": "researcher", "framework": "langchain"
    })
    assert r.status_code == 201
    agent_id = r.json()["id"]

    r = await authed_client.get("/api/agents")
    assert r.status_code == 200
    assert any(a["id"] == agent_id for a in r.json())

@pytest.mark.asyncio
async def test_get_agent_stats(authed_client: AsyncClient):
    r = await authed_client.post("/api/agents", json={"name": "Bot", "role": "worker", "framework": "custom"})
    agent_id = r.json()["id"]
    r = await authed_client.get(f"/api/agents/{agent_id}/stats")
    assert r.status_code == 200
    assert "total_tokens" in r.json()
    assert "level" in r.json()
```

Run: `pytest tests/test_agents.py -v`
Expected: FAIL

- [ ] **Step 2: Implement schemas and router** (AgentCreate, AgentRead Pydantic models + CRUD endpoints with workspace scoping)

- [ ] **Step 3: Run agent tests**

Run: `pytest tests/test_agents.py -v`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(backend): agent and task CRUD routers"
```

---

## Task 8: Event Ingestion Pipeline

**Files:**
- Create: `src/backend/app/services/event_pipeline.py`
- Create: `src/backend/app/routers/events.py`
- Create: `src/backend/tests/test_events.py`

- [ ] **Step 1: Write failing pipeline tests**

```python
# tests/test_events.py
import pytest
from app.services.event_pipeline import normalise_event, EventPipeline

def test_normalise_event_sets_defaults():
    raw = {"event_type": "agent.task.started", "agent_id": "a1"}
    event = normalise_event(raw, workspace_id="ws1")
    assert event["workspace_id"] == "ws1"
    assert "timestamp" in event
    assert event["event_type"] == "agent.task.started"

@pytest.mark.asyncio
async def test_event_publish_to_redis(redis_client):
    pipeline = EventPipeline(redis_client)
    await pipeline.publish({"workspace_id": "ws1", "event_type": "test", "timestamp": "2026-01-01T00:00:00Z"})
    # Verify event appears on Redis stream
    entries = await redis_client.xrange("events:ws1", "-", "+")
    assert len(entries) >= 1
```

Run: `pytest tests/test_events.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `app/services/event_pipeline.py`**

```python
from datetime import datetime, timezone
import json
import redis.asyncio as aioredis

def normalise_event(raw: dict, workspace_id: str) -> dict:
    return {
        "workspace_id": workspace_id,
        "event_type": raw.get("event_type", "unknown"),
        "agent_id": raw.get("agent_id"),
        "session_id": raw.get("session_id"),
        "timestamp": raw.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "extra_data": {k: v for k, v in raw.items() if k not in ("event_type", "agent_id", "session_id", "timestamp")},
    }

class EventPipeline:
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis

    async def publish(self, event: dict) -> None:
        stream_key = f"events:{event['workspace_id']}"
        await self.redis.xadd(stream_key, {"payload": json.dumps(event)}, maxlen=100_000)
        # Also fan out to WS subscribers via Pub/Sub
        await self.redis.publish(f"ws:{event['workspace_id']}", json.dumps(event))
```

- [ ] **Step 3: Implement REST event ingestion router and persist writer**

- [ ] **Step 4: Run tests**

Run: `pytest tests/test_events.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git commit -m "feat(backend): event ingestion pipeline with Redis Streams fanout"
```

---

## Task 9: Gamification Engine

**Files:**
- Create: `src/backend/app/services/gamification_service.py`
- Create: `src/backend/tests/test_gamification.py`

- [ ] **Step 1: Write failing gamification tests**

```python
# tests/test_gamification.py
from app.services.gamification_service import GamificationService, XP_THRESHOLDS

def test_xp_award_increases_total():
    svc = GamificationService()
    result = svc.compute_xp_award(task_completed=True, tokens_used=500, duration_seconds=30)
    assert result > 0

def test_level_calculation():
    svc = GamificationService()
    assert svc.level_from_xp(0) == 1
    assert svc.level_from_xp(XP_THRESHOLDS[1]) == 2   # Pro
    assert svc.level_from_xp(XP_THRESHOLDS[4]) == 5   # Legend

def test_level_up_event_emitted():
    svc = GamificationService()
    event = svc.process_xp_gain(current_xp=990, xp_delta=20, agent_id="a1")
    assert event is not None
    assert event["type"] == "level_up"
```

Run: `pytest tests/test_gamification.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `app/services/gamification_service.py`**

```python
from dataclasses import dataclass
from typing import Optional

# XP thresholds per level: index = level - 1
XP_THRESHOLDS = [0, 1000, 3000, 7500, 15000]  # Rookie, Pro, Expert, Master, Legend
LEVEL_NAMES = ["Rookie", "Pro", "Expert", "Master", "Legend"]

class GamificationService:
    def compute_xp_award(self, task_completed: bool, tokens_used: int, duration_seconds: int) -> int:
        xp = 0
        if task_completed:
            xp += 100
        # Efficiency bonus: fewer tokens for same result
        if tokens_used < 500:
            xp += 50
        elif tokens_used < 2000:
            xp += 25
        # Speed bonus
        if duration_seconds < 10:
            xp += 30
        return max(xp, 10)  # minimum 10 XP per task

    def level_from_xp(self, total_xp: int) -> int:
        level = 1
        for i, threshold in enumerate(XP_THRESHOLDS):
            if total_xp >= threshold:
                level = i + 1
        return level

    def process_xp_gain(self, current_xp: int, xp_delta: int, agent_id: str) -> Optional[dict]:
        old_level = self.level_from_xp(current_xp)
        new_level = self.level_from_xp(current_xp + xp_delta)
        if new_level > old_level:
            return {
                "type": "level_up",
                "agent_id": agent_id,
                "old_level": old_level,
                "new_level": new_level,
                "level_name": LEVEL_NAMES[new_level - 1],
            }
        return None
```

- [ ] **Step 3: Run tests**

Run: `pytest tests/test_gamification.py -v`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(backend): gamification engine - XP awards, leveling, level-up events"
```

---

## Task 10: Loop Detector

**Files:**
- Create: `src/backend/app/services/loop_detector.py`
- Create: `src/backend/tests/test_loop_detector.py`

- [ ] **Step 1: Write failing loop detector tests**

```python
# tests/test_loop_detector.py
from app.services.loop_detector import LoopDetector

def test_no_loop_detected_for_unique_calls():
    detector = LoopDetector(threshold=5)
    for i in range(4):
        result = detector.check(agent_id="a1", call_signature=f"unique_{i}")
        assert result is None

def test_loop_detected_at_threshold():
    detector = LoopDetector(threshold=5)
    for _ in range(4):
        detector.check(agent_id="a1", call_signature="same_call")
    result = detector.check(agent_id="a1", call_signature="same_call")
    assert result is not None
    assert result["type"] == "loop_detected"
    assert result["agent_id"] == "a1"
    assert result["repeat_count"] == 5

def test_loop_resets_after_different_call():
    detector = LoopDetector(threshold=5)
    for _ in range(3):
        detector.check(agent_id="a1", call_signature="call_a")
    detector.check(agent_id="a1", call_signature="call_b")
    result = detector.check(agent_id="a1", call_signature="call_a")
    assert result is None  # count reset
```

Run: `pytest tests/test_loop_detector.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `app/services/loop_detector.py`**

```python
from collections import defaultdict
from typing import Optional

class LoopDetector:
    def __init__(self, threshold: int = 5):
        self.threshold = threshold
        # {agent_id: (last_signature, count)}
        self._state: dict[str, tuple[str, int]] = {}

    def check(self, agent_id: str, call_signature: str) -> Optional[dict]:
        last_sig, count = self._state.get(agent_id, ("", 0))
        if call_signature == last_sig:
            count += 1
        else:
            count = 1
        self._state[agent_id] = (call_signature, count)
        if count >= self.threshold:
            return {
                "type": "loop_detected",
                "agent_id": agent_id,
                "call_signature": call_signature,
                "repeat_count": count,
            }
        return None

    def reset(self, agent_id: str) -> None:
        self._state.pop(agent_id, None)
```

- [ ] **Step 3: Run tests**

Run: `pytest tests/test_loop_detector.py -v`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(backend): loop detector with configurable threshold"
```

---

## Task 11: OTLP Ingestion Service

**Files:**
- Create: `src/backend/app/services/otlp_service.py`
- Create: `src/backend/app/routers/otlp_receiver.py`
- Create: `src/backend/tests/test_otlp_service.py`

- [ ] **Step 1: Write failing OTLP tests**

```python
# tests/test_otlp_service.py
from app.services.otlp_service import decode_otlp_http_json, OTLPSpanNormaliser

def test_otlp_json_span_decoded():
    payload = {
        "resourceSpans": [{
            "resource": {"attributes": [{"key": "workspace.id", "value": {"stringValue": "ws1"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": "abc123",
                    "spanId": "def456",
                    "name": "agent.task",
                    "startTimeUnixNano": "1700000000000000000",
                    "endTimeUnixNano": "1700000001000000000",
                    "status": {"code": 1},
                    "attributes": [],
                }]
            }]
        }]
    }
    spans = decode_otlp_http_json(payload)
    assert len(spans) == 1
    assert spans[0]["trace_id"] == "abc123"
    assert spans[0]["name"] == "agent.task"
    assert spans[0]["workspace_id"] == "ws1"
```

Run: `pytest tests/test_otlp_service.py -v`
Expected: FAIL

- [ ] **Step 2: Implement `app/services/otlp_service.py`**

```python
from datetime import datetime, timezone
from typing import Any

def decode_otlp_http_json(payload: dict) -> list[dict]:
    spans = []
    for rs in payload.get("resourceSpans", []):
        workspace_id = _extract_attr(rs.get("resource", {}).get("attributes", []), "workspace.id") or "unknown"
        for ss in rs.get("scopeSpans", []):
            for span in ss.get("spans", []):
                start_ns = int(span.get("startTimeUnixNano", 0))
                end_ns = int(span.get("endTimeUnixNano", 0))
                spans.append({
                    "workspace_id": workspace_id,
                    "trace_id": span.get("traceId", ""),
                    "span_id": span.get("spanId", ""),
                    "parent_span_id": span.get("parentSpanId"),
                    "name": span.get("name", ""),
                    "start_time": datetime.fromtimestamp(start_ns / 1e9, tz=timezone.utc) if start_ns else None,
                    "end_time": datetime.fromtimestamp(end_ns / 1e9, tz=timezone.utc) if end_ns else None,
                    "status": _status_code(span.get("status", {}).get("code", 0)),
                    "attributes": {a["key"]: _attr_val(a["value"]) for a in span.get("attributes", [])},
                })
    return spans

def _extract_attr(attrs: list, key: str) -> str | None:
    for a in attrs:
        if a["key"] == key:
            return _attr_val(a["value"])
    return None

def _attr_val(v: dict) -> Any:
    for k, val in v.items():
        return val
    return None

def _status_code(code: int) -> str:
    return {0: "unset", 1: "ok", 2: "error"}.get(code, "unset")
```

- [ ] **Step 3: Create OTLP receiver router** — POST `/otlp/v1/traces` accepting JSON OTLP, decode → persist spans

- [ ] **Step 4: Run tests**

Run: `pytest tests/test_otlp_service.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git commit -m "feat(backend): OTLP HTTP JSON ingestion service and receiver router"
```

---

## Task 12: WebSocket Server

**Files:**
- Create: `src/backend/app/services/websocket_manager.py`
- Create: `src/backend/app/routers/websocket.py`
- Create: `src/backend/tests/test_websocket.py`

- [ ] **Step 1: Write failing WebSocket tests**

```python
# tests/test_websocket.py
import pytest
from httpx_ws import aconnect_ws

@pytest.mark.asyncio
async def test_websocket_connects_and_receives_events(client, redis_client):
    async with aconnect_ws("ws://test/ws/live?workspace_id=ws1", client) as ws:
        # Publish event via Redis Pub/Sub
        import json
        await redis_client.publish("ws:ws1", json.dumps({"event_type": "test", "agent_id": "a1"}))
        msg = await ws.receive_text()
        data = json.loads(msg)
        assert data["event_type"] == "test"
```

- [ ] **Step 2: Implement `app/services/websocket_manager.py`**

```python
import asyncio
import json
from fastapi import WebSocket
from collections import defaultdict
import redis.asyncio as aioredis

class WebSocketManager:
    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, ws: WebSocket, workspace_id: str):
        await ws.accept()
        self._connections[workspace_id].add(ws)

    def disconnect(self, ws: WebSocket, workspace_id: str):
        self._connections[workspace_id].discard(ws)

    async def broadcast(self, workspace_id: str, message: str):
        dead = set()
        for ws in self._connections.get(workspace_id, set()):
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[workspace_id].discard(ws)

    async def start_redis_listener(self, redis: aioredis.Redis):
        pubsub = redis.pubsub()
        await pubsub.psubscribe("ws:*")
        async for msg in pubsub.listen():
            if msg["type"] == "pmessage":
                channel = msg["channel"]   # "ws:{workspace_id}"
                workspace_id = channel.split(":", 1)[1]
                await self.broadcast(workspace_id, msg["data"])

manager = WebSocketManager()
```

- [ ] **Step 3: Implement WebSocket router** — GET `/ws/live` upgrades to WS, joins workspace room

- [ ] **Step 4: Commit**
```bash
git commit -m "feat(backend): WebSocket manager with Redis Pub/Sub fanout"
```

---

## Task 13: Session Replay Router

**Files:**
- Create: `src/backend/app/routers/sessions.py`
- Create: `src/backend/tests/test_sessions.py`

- [ ] **Step 1: Write failing replay tests**

```python
# tests/test_sessions.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_session_and_replay(authed_client: AsyncClient):
    # Create session
    r = await authed_client.post("/api/sessions", json={"name": "Test Run", "agent_ids": ["a1"]})
    assert r.status_code == 201
    session_id = r.json()["id"]

    # End session
    r = await authed_client.patch(f"/api/sessions/{session_id}/end")
    assert r.status_code == 200

    # Get replay events
    r = await authed_client.get(f"/api/sessions/{session_id}/replay")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
```

- [ ] **Step 2: Implement sessions router** with create, end, and replay endpoints

- [ ] **Step 3: Run tests, verify PASS, commit**
```bash
git commit -m "feat(backend): session management and replay router"
```

---

## Task 14: Cost & Metrics Router

**Files:**
- Create: `src/backend/app/routers/metrics.py`
- Create: `src/backend/app/services/cost_service.py`
- Create: `src/backend/tests/test_metrics.py`

- [ ] **Step 1: Write failing cost tests**

```python
# tests/test_metrics.py
from app.services.cost_service import CostService

def test_gpt4_cost_calculation():
    svc = CostService()
    cost = svc.calculate_cost(model="gpt-4o", prompt_tokens=1000, completion_tokens=500)
    assert cost > 0

def test_unknown_model_returns_zero():
    svc = CostService()
    cost = svc.calculate_cost(model="unknown-model", prompt_tokens=1000, completion_tokens=500)
    assert cost == 0.0
```

- [ ] **Step 2: Implement `app/services/cost_service.py`**

```python
# Per-million-token pricing (USD) as of early 2026 (approximate)
COST_TABLE = {
    "gpt-4o":            {"prompt": 2.50, "completion": 10.00},
    "gpt-4-turbo":       {"prompt": 10.00, "completion": 30.00},
    "gpt-3.5-turbo":     {"prompt": 0.50, "completion": 1.50},
    "claude-opus-4":     {"prompt": 15.00, "completion": 75.00},
    "claude-sonnet-4":   {"prompt": 3.00, "completion": 15.00},
    "claude-haiku-4":    {"prompt": 0.80, "completion": 4.00},
    "gemini-1.5-pro":    {"prompt": 3.50, "completion": 10.50},
}

class CostService:
    def calculate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        rates = COST_TABLE.get(model)
        if not rates:
            return 0.0
        return (prompt_tokens / 1_000_000 * rates["prompt"]) + (completion_tokens / 1_000_000 * rates["completion"])
```

- [ ] **Step 3: Implement metrics router** — GET `/metrics/costs` and `/metrics/tokens` with date range filters

- [ ] **Step 4: Run tests, commit**
```bash
git commit -m "feat(backend): cost service and metrics router"
```

---

## Task 15: Alerts Router & Full Integration

**Files:**
- Create: `src/backend/app/routers/alerts.py`
- Modify: `src/backend/app/main.py` (include all routers)

- [ ] **Step 1: Implement alerts router** — GET `/alerts`, PATCH `/alerts/{id}` (resolve), loop-alert endpoint

- [ ] **Step 2: Register all routers in `main.py`**

```python
from app.routers import auth, agents, events, sessions, metrics, gamification, alerts, websocket, otlp_receiver
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(events.router)
app.include_router(sessions.router)
app.include_router(metrics.router)
app.include_router(gamification.router)
app.include_router(alerts.router)
app.include_router(websocket.router)
app.include_router(otlp_receiver.router)
```

- [ ] **Step 3: Run full test suite**

Run: `pytest --cov=app tests/ -v`
Expected: All tests PASS, coverage > 70%

- [ ] **Step 4: Verify app starts**

```bash
cd src/backend
DATABASE_URL=postgresql+asyncpg://oav:oav@localhost:5432/oav \
REDIS_URL=redis://localhost:6379/0 \
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Expected: "Application startup complete" in logs

- [ ] **Step 5: Final commit**
```bash
git add src/backend/
git commit -m "feat(backend): complete MVP backend — all routers, services, and tests"
```
