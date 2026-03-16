# OpenAgentVisualizer -- Backend Implementation Plan

**Stage:** 5.2 -- Backend Expert
**Date:** March 16, 2026
**Version:** 1.0
**Status:** Complete
**Author:** Backend Expert Agent
**Depends On:** System Architecture (Stage 4.1), Agent Integration Architecture (Stage 1.3), Gamification System Design (Stage 1.2), PRD (Stage 1.1)
**Feeds Into:** Code Reviewer (Stage 5.3), QA Engineer (Stage 5.4), DevOps (Convergence)

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [Database Layer](#3-database-layer)
4. [API Implementation](#4-api-implementation)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Event Ingestion Pipeline](#6-event-ingestion-pipeline)
7. [Real-Time Services](#7-real-time-services)
8. [Gamification Engine](#8-gamification-engine)
9. [Background Tasks](#9-background-tasks)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. Project Setup

### 1.1 Python 3.12 and FastAPI Foundation

The backend runs on Python 3.12 with FastAPI 0.110+ as the async ASGI framework. All I/O-bound operations use `async/await` natively via asyncpg, aioredis, and httpx.

### 1.2 requirements.txt

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

# Authentication
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
httpx==0.27.0
factory-boy==3.3.0
faker==25.9.1
testcontainers[postgres,redis]==4.5.1

# Dev Tools
ruff==0.4.9
mypy==1.10.1
pre-commit==3.7.1
```

### 1.3 Environment Configuration

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field, computed_field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "OpenAgentVisualizer"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production
    LOG_LEVEL: str = "INFO"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_USER: str = "oav"
    DATABASE_PASSWORD: str = "oav_dev_password"
    DATABASE_NAME: str = "openagentvisualizer"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_ECHO: bool = False

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    @computed_field
    @property
    def DATABASE_URL_SYNC(self) -> str:
        return (
            f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    @computed_field
    @property
    def REDIS_URL(self) -> str:
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # JWT Authentication
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_use_openssl_rand_hex_64"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth2
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    OAUTH_REDIRECT_BASE: str = "http://localhost:8000/api/v1/auth/oauth"

    # API Keys
    API_KEY_PREFIX_LIVE: str = "oav_live_"
    API_KEY_PREFIX_TEST: str = "oav_test_"

    # Rate Limiting
    RATE_LIMIT_DEFAULT: int = 60  # requests per minute
    RATE_LIMIT_AUTH: int = 10
    RATE_LIMIT_INGEST: int = 1000
    RATE_LIMIT_WEBSOCKET: int = 200

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # OTLP
    OTLP_HTTP_PORT: int = 4318
    OTLP_MAX_PAYLOAD_SIZE: int = 16 * 1024 * 1024  # 16 MB

    # Default User (auto-seeded)
    DEFAULT_USER_EMAIL: str = "kotsai@gmail.com"
    DEFAULT_USER_PASSWORD: str = "kots@123"
    DEFAULT_USER_DISPLAY_NAME: str = "Admin"

    # Data Retention (days)
    RETENTION_EVENTS_DAYS: int = 90
    RETENTION_SPANS_DAYS: int = 90
    RETENTION_METRICS_RAW_DAYS: int = 7
    RETENTION_AUDIT_LOG_DAYS: int = 365

    model_config = {"env_prefix": "OAV_", "env_file": ".env", "case_sensitive": True}


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### 1.4 .env.example

```env
# OpenAgentVisualizer Backend Configuration

# Application
OAV_DEBUG=true
OAV_ENVIRONMENT=development
OAV_LOG_LEVEL=DEBUG
OAV_ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Database (PostgreSQL 16 + TimescaleDB)
OAV_DATABASE_HOST=localhost
OAV_DATABASE_PORT=5432
OAV_DATABASE_USER=oav
OAV_DATABASE_PASSWORD=oav_dev_password
OAV_DATABASE_NAME=openagentvisualizer
OAV_DATABASE_POOL_SIZE=20

# Redis
OAV_REDIS_HOST=localhost
OAV_REDIS_PORT=6379
OAV_REDIS_PASSWORD=
OAV_REDIS_DB=0

# JWT
OAV_JWT_SECRET_KEY=replace_with_openssl_rand_hex_64_output
OAV_JWT_ALGORITHM=HS256
OAV_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
OAV_JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth2 (optional for dev)
OAV_GOOGLE_CLIENT_ID=
OAV_GOOGLE_CLIENT_SECRET=
OAV_GITHUB_CLIENT_ID=
OAV_GITHUB_CLIENT_SECRET=

# Celery
OAV_CELERY_BROKER_URL=redis://localhost:6379/1
OAV_CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Default User
OAV_DEFAULT_USER_EMAIL=kotsai@gmail.com
OAV_DEFAULT_USER_PASSWORD=kots@123
```

---

## 2. Folder Structure

```
src/backend/
├── Dockerfile
├── requirements.txt
├── .env.example
├── alembic.ini
├── alembic/
│   ├── env.py                          # Alembic async migration environment
│   ├── script.py.mako                  # Migration template
│   └── versions/
│       ├── 001_initial_schema.py       # Core tables: users, workspaces, workspace_members
│       ├── 002_agent_tables.py         # agents, agent_sessions, agent_states
│       ├── 003_task_tables.py          # tasks, task_assignments, task_results
│       ├── 004_event_hypertables.py    # events, spans (TimescaleDB hypertables)
│       ├── 005_metrics_hypertables.py  # metrics_raw, continuous aggregates
│       ├── 006_gamification_tables.py  # achievements, user_achievements, xp_ledger, leaderboard_snapshots
│       ├── 007_alert_tables.py         # alert_rules, alerts, notifications
│       ├── 008_api_key_audit.py        # api_keys, audit_log
│       └── 009_seed_achievements.py    # Seed 38 achievement definitions
│
├── app/
│   ├── __init__.py
│   ├── main.py                         # FastAPI app factory, lifespan, middleware registration
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                   # Pydantic Settings (see Section 1.3)
│   │   ├── database.py                 # AsyncEngine, AsyncSessionLocal, get_db dependency
│   │   ├── redis.py                    # Redis connection pool, get_redis dependency
│   │   ├── security.py                 # JWT encode/decode, password hashing, API key validation
│   │   ├── exceptions.py              # Custom exception classes and error handlers
│   │   ├── middleware.py               # CORS, rate limiting, request logging, timing
│   │   └── logging.py                 # Structured JSON logging configuration
│   │
│   ├── models/
│   │   ├── __init__.py                 # Base model, import all models for Alembic
│   │   ├── base.py                     # DeclarativeBase, UUIDMixin, TimestampMixin
│   │   ├── user.py                     # User model
│   │   ├── workspace.py               # Workspace, WorkspaceMember models
│   │   ├── agent.py                    # Agent, AgentSession, AgentState models
│   │   ├── task.py                     # Task, TaskAssignment, TaskResult models
│   │   ├── event.py                    # Event model (hypertable)
│   │   ├── span.py                     # Span model (hypertable)
│   │   ├── metric.py                   # MetricsRaw model (hypertable)
│   │   ├── achievement.py             # Achievement, UserAchievement models
│   │   ├── xp.py                       # XPLedger model
│   │   ├── leaderboard.py             # LeaderboardSnapshot model
│   │   ├── alert.py                    # AlertRule, Alert models
│   │   ├── notification.py            # Notification model
│   │   ├── api_key.py                  # APIKey model
│   │   └── audit_log.py               # AuditLog model
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py                     # LoginRequest, RegisterRequest, TokenResponse, OAuthCallback
│   │   ├── user.py                     # UserRead, UserUpdate, UserPreferences
│   │   ├── workspace.py               # WorkspaceCreate, WorkspaceRead, WorkspaceMemberRead
│   │   ├── agent.py                    # AgentCreate, AgentRead, AgentUpdate, AgentHeartbeat, AgentStateChange
│   │   ├── task.py                     # TaskCreate, TaskRead, TaskUpdate, TaskResultCreate, TaskResultRead
│   │   ├── event.py                    # EventIngest, EventRead, SpanIngest, SpanRead, BulkIngestRequest
│   │   ├── metric.py                   # MetricQuery, MetricRead, AggregatedMetricRead
│   │   ├── achievement.py             # AchievementRead, UserAchievementRead
│   │   ├── gamification.py            # XPAwardResponse, LevelUpEvent, LeaderboardEntry, QuestRead
│   │   ├── alert.py                    # AlertRuleCreate, AlertRuleRead, AlertRead, AlertAcknowledge
│   │   ├── notification.py            # NotificationRead, NotificationMarkRead
│   │   ├── api_key.py                  # APIKeyCreate, APIKeyRead, APIKeyCreatedResponse
│   │   ├── websocket.py               # WSMessage, WSSubscription, WSAgentUpdate
│   │   └── common.py                  # PaginatedResponse, ErrorResponse, HealthResponse
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                     # /api/v1/auth/* — register, login, refresh, oauth
│   │   ├── users.py                    # /api/v1/users/* — profile, preferences
│   │   ├── workspaces.py              # /api/v1/workspaces/* — CRUD, members, settings
│   │   ├── agents.py                   # /api/v1/agents/* — CRUD, heartbeat, state changes
│   │   ├── tasks.py                    # /api/v1/tasks/* — CRUD, assignment, results
│   │   ├── traces.py                   # /api/v1/traces/* — ingest, query, session replay
│   │   ├── metrics.py                  # /api/v1/metrics/* — query aggregated metrics
│   │   ├── achievements.py            # /api/v1/achievements/* — list, agent achievements
│   │   ├── leaderboard.py             # /api/v1/leaderboard/* — rankings by time window
│   │   ├── quests.py                   # /api/v1/quests/* — daily/weekly/epic quests
│   │   ├── alerts.py                   # /api/v1/alerts/* — rules CRUD, alert history
│   │   ├── notifications.py           # /api/v1/notifications/* — list, mark read
│   │   ├── api_keys.py                # /api/v1/api-keys/* — CRUD for SDK keys
│   │   ├── dashboard.py               # /api/v1/dashboard/* — workspace overview aggregates
│   │   ├── otlp_receiver.py           # /v1/traces (OTLP HTTP receiver)
│   │   ├── websocket.py               # /ws/* — WebSocket connection handler
│   │   └── health.py                  # /health, /ready — health checks
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py            # Registration, login, token management, OAuth flow
│   │   ├── user_service.py            # User CRUD, preferences
│   │   ├── workspace_service.py       # Workspace CRUD, member management
│   │   ├── agent_service.py           # Agent registration, state management, heartbeat
│   │   ├── task_service.py            # Task lifecycle, assignment, result processing
│   │   ├── event_service.py           # Event ingestion, validation, Redis Streams producer
│   │   ├── trace_service.py           # Trace query, session reconstruction
│   │   ├── metric_service.py          # Metric aggregation queries, dashboard data
│   │   ├── xp_service.py              # XP calculation, level-up detection, ledger writes
│   │   ├── achievement_service.py     # Achievement evaluation, unlock logic
│   │   ├── leaderboard_service.py     # Leaderboard computation, caching, snapshot
│   │   ├── quest_service.py           # Quest generation, tracking, completion
│   │   ├── alert_service.py           # Alert rule evaluation, alert creation, notifications
│   │   ├── notification_service.py    # Notification creation, delivery, mark read
│   │   ├── websocket_manager.py       # WebSocket connection registry, message routing
│   │   ├── redis_pubsub.py            # Redis pub/sub wrapper for event fan-out
│   │   ├── otlp_service.py            # OTLP protobuf parsing, span extraction
│   │   ├── pii_detector.py            # PII detection and masking in event payloads
│   │   ├── audit_service.py           # Audit log writing
│   │   └── api_key_service.py         # API key generation, validation, scoping
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py                     # BaseRepository with common CRUD operations
│   │   ├── user_repo.py               # UserRepository
│   │   ├── workspace_repo.py          # WorkspaceRepository
│   │   ├── agent_repo.py              # AgentRepository
│   │   ├── task_repo.py               # TaskRepository
│   │   ├── event_repo.py              # EventRepository (optimized for hypertable queries)
│   │   ├── span_repo.py               # SpanRepository
│   │   ├── metric_repo.py             # MetricRepository (reads from continuous aggregates)
│   │   ├── achievement_repo.py        # AchievementRepository
│   │   ├── xp_repo.py                 # XPLedgerRepository
│   │   ├── leaderboard_repo.py        # LeaderboardRepository
│   │   ├── alert_repo.py              # AlertRepository
│   │   ├── notification_repo.py       # NotificationRepository
│   │   ├── api_key_repo.py            # APIKeyRepository
│   │   └── audit_repo.py              # AuditLogRepository
│   │
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── celery_app.py              # Celery application configuration
│   │   ├── persist_writer.py          # Redis Streams consumer: writes events/spans to TimescaleDB
│   │   ├── aggregation_engine.py      # Redis Streams consumer: computes real-time metrics
│   │   ├── tasks/
│   │   │   ├── __init__.py
│   │   │   ├── gamification.py        # quest_generate, leaderboard_calc, achievement_eval, weekly_bonus
│   │   │   ├── alerting.py            # alert_evaluate, alert_notify
│   │   │   ├── metrics.py             # metric_aggregate, agent_summary_refresh
│   │   │   ├── cleanup.py             # data_retention, compress_old_chunks
│   │   │   └── reports.py             # replay_export, workspace_report_generate
│   │   └── beat_schedule.py           # Celery Beat periodic task schedule
│   │
│   └── deps/
│       ├── __init__.py
│       ├── auth.py                     # get_current_user, get_current_active_user, require_role
│       ├── workspace.py               # get_current_workspace, require_workspace_role
│       ├── api_key.py                 # validate_api_key, require_scope
│       ├── pagination.py             # PaginationParams dependency
│       └── rate_limit.py             # RateLimiter dependency (Redis-backed sliding window)
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                     # Fixtures: test DB, test client, auth tokens, factories
│   ├── factories.py                    # Factory Boy factories for all models
│   ├── test_auth.py                   # Auth endpoint tests
│   ├── test_agents.py                 # Agent CRUD and state tests
│   ├── test_tasks.py                  # Task lifecycle tests
│   ├── test_traces.py                 # Event ingestion and query tests
│   ├── test_gamification.py           # XP, achievements, leaderboard tests
│   ├── test_websocket.py             # WebSocket connection and message tests
│   ├── test_otlp.py                   # OTLP receiver tests
│   ├── test_alerts.py                # Alert rule evaluation tests
│   └── test_integration.py           # End-to-end integration tests
│
└── docker-compose.yml                 # PostgreSQL+TimescaleDB, Redis, backend, celery worker, celery beat
```

---

## 3. Database Layer

### 3.1 Base Model and Mixins

```python
# app/models/base.py
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class UUIDMixin:
    """Provides a UUID primary key column."""
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )


class TimestampMixin:
    """Provides created_at and updated_at columns."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
```

### 3.2 SQLAlchemy 2.0 Models

#### User Model

```python
# app/models/user.py
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.workspace import Workspace, WorkspaceMember


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    oauth_provider: Mapped[str | None] = mapped_column(String(20), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    preferences: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}", nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owned_workspaces: Mapped[list[Workspace]] = relationship(
        "Workspace", back_populates="owner", cascade="all, delete-orphan"
    )
    memberships: Mapped[list[WorkspaceMember]] = relationship(
        "WorkspaceMember", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("oauth_provider", "oauth_id", name="uq_oauth"),
    )
```

#### Workspace Models

```python
# app/models/workspace.py
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.agent import Agent


class Workspace(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    tier: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}", nullable=False)
    gamification_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    professional_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    monthly_budget_usd: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Relationships
    owner: Mapped[User] = relationship("User", back_populates="owned_workspaces")
    members: Mapped[list[WorkspaceMember]] = relationship(
        "WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan"
    )
    agents: Mapped[list[Agent]] = relationship(
        "Agent", back_populates="workspace", cascade="all, delete-orphan"
    )


class WorkspaceMember(Base, UUIDMixin):
    __tablename__ = "workspace_members"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), default="viewer", nullable=False)
    invited_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    # Relationships
    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="members")
    user: Mapped[User] = relationship("User", back_populates="memberships", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_member"),
    )
```

#### Agent Models

```python
# app/models/agent.py
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger, Boolean, Date, DateTime, ForeignKey, Integer,
    Numeric, String, UniqueConstraint, ARRAY, Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.workspace import Workspace


class Agent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "agents"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    agent_external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    framework: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_config: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}", nullable=False)
    capabilities: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    tags: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}", nullable=False)

    # Gamification state (denormalized)
    xp_total: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    tier_name: Mapped[str] = mapped_column(String(20), default="Rookie", nullable=False)
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    streak_start: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Operational state
    current_state: Mapped[str] = mapped_column(String(20), default="idle", nullable=False)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_tasks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_cost_usd: Mapped[float] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    total_tokens: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_errors: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="agents")
    sessions: Mapped[list[AgentSession]] = relationship("AgentSession", back_populates="agent", cascade="all, delete-orphan")
    state_history: Mapped[list[AgentState]] = relationship("AgentState", back_populates="agent", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("workspace_id", "agent_external_id", name="uq_agent_external"),
    )


class AgentSession(Base, UUIDMixin):
    __tablename__ = "agent_sessions"

    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    trace_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_cost_usd: Mapped[float] = mapped_column(Numeric(10, 4), default=0, nullable=False)
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tasks_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)

    # Relationships
    agent: Mapped[Agent] = relationship("Agent", back_populates="sessions")


class AgentState(Base, UUIDMixin):
    __tablename__ = "agent_states"

    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agent_sessions.id"), nullable=True
    )
    previous_state: Mapped[str] = mapped_column(String(20), nullable=False)
    new_state: Mapped[str] = mapped_column(String(20), nullable=False)
    trigger_event: Mapped[str] = mapped_column(String(50), nullable=False)
    event_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)

    # Relationships
    agent: Mapped[Agent] = relationship("Agent", back_populates="state_history")
```

#### Task Models

```python
# app/models/task.py
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime, ForeignKey, Integer, Numeric, String, Text, CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Task(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tasks"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    external_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[str] = mapped_column(String(10), default="medium", nullable=False)
    complexity: Mapped[str | None] = mapped_column(String(10), nullable=True)
    complexity_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_by_user: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_by_agent: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True
    )
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    assignments: Mapped[list[TaskAssignment]] = relationship(
        "TaskAssignment", back_populates="task", cascade="all, delete-orphan"
    )
    results: Mapped[list[TaskResult]] = relationship(
        "TaskResult", back_populates="task", cascade="all, delete-orphan"
    )


class TaskAssignment(Base, UUIDMixin):
    __tablename__ = "task_assignments"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agent_sessions.id"), nullable=True
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="assigned", nullable=False)
    progress_pct: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    delegated_to: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True
    )

    # Relationships
    task: Mapped[Task] = relationship("Task", back_populates="assignments")

    __table_args__ = (
        CheckConstraint("progress_pct BETWEEN 0 AND 100", name="ck_progress_pct_range"),
    )


class TaskResult(Base, UUIDMixin):
    __tablename__ = "task_results"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("task_assignments.id", ondelete="CASCADE"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    result_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost_usd: Mapped[float] = mapped_column(Numeric(10, 4), default=0, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quality_score: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    error_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # XP calculation inputs
    base_xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quality_multiplier: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0, nullable=False)
    difficulty_modifier: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0, nullable=False)
    streak_bonus: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0, nullable=False)
    efficiency_xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)

    # Relationships
    task: Mapped[Task] = relationship("Task", back_populates="results")

    __table_args__ = (
        CheckConstraint("quality_score BETWEEN 0 AND 1", name="ck_quality_score_range"),
    )
```

#### Event and Span Models (Hypertables)

```python
# app/models/event.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    trace_id: Mapped[str] = mapped_column(String(64), nullable=False)
    span_id: Mapped[str] = mapped_column(String(32), nullable=False)
    parent_span_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_action: Mapped[str | None] = mapped_column(String(50), nullable=True)
    severity: Mapped[str] = mapped_column(String(10), default="info", nullable=True)
    event_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    resource_attrs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    span_attrs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), primary_key=True, server_default="now()", nullable=False
    )

    # Note: composite PK (id, created_at) required for TimescaleDB hypertable
```

```python
# app/models/span.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Span(Base):
    __tablename__ = "spans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    trace_id: Mapped[str] = mapped_column(String(64), nullable=False)
    span_id: Mapped[str] = mapped_column(String(32), nullable=False)
    parent_span_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    operation_name: Mapped[str] = mapped_column(String(255), nullable=False)
    span_kind: Mapped[str] = mapped_column(String(20), nullable=False)
    status_code: Mapped[str] = mapped_column(String(10), default="ok", nullable=False)
    status_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timing
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True, nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # GenAI attributes (denormalized)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    temperature: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)

    # Full attribute maps
    attributes: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}", nullable=False)
    events_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    links: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
```

#### Metrics Model (Hypertable)

```python
# app/models/metric.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MetricsRaw(Base):
    __tablename__ = "metrics_raw"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(20), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    labels: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}", nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), primary_key=True, server_default="now()", nullable=False
    )
```

#### Gamification Models

```python
# app/models/achievement.py
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class Achievement(Base, UUIDMixin):
    __tablename__ = "achievements"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    criteria: Mapped[dict] = mapped_column(JSONB, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False)
    rarity_tier: Mapped[str] = mapped_column(String(15), nullable=False)
    icon_name: Mapped[str] = mapped_column(String(50), nullable=False)
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)


class UserAchievement(Base, UUIDMixin):
    __tablename__ = "user_achievements"

    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    achievement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
    progress_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        {"unique_constraint": ("agent_id", "achievement_id")},
    )
```

```python
# app/models/xp.py
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class XPLedger(Base, UUIDMixin):
    __tablename__ = "xp_ledger"

    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    xp_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    xp_before: Mapped[int] = mapped_column(BigInteger, nullable=False)
    xp_after: Mapped[int] = mapped_column(BigInteger, nullable=False)
    level_before: Mapped[int] = mapped_column(Integer, nullable=False)
    level_after: Mapped[int] = mapped_column(Integer, nullable=False)
    breakdown: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
```

```python
# app/models/leaderboard.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class LeaderboardSnapshot(Base, UUIDMixin):
    __tablename__ = "leaderboard_snapshots"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    time_window: Mapped[str] = mapped_column(String(10), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rankings: Mapped[dict] = mapped_column(JSONB, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
```

#### Alert, Notification, API Key, Audit Log Models

```python
# app/models/alert.py
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class AlertRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "alert_rules"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rule_type: Mapped[str] = mapped_column(String(30), nullable=False)
    conditions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    severity: Mapped[str] = mapped_column(String(10), default="warning", nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    cooldown_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    notification_channels: Mapped[dict] = mapped_column(JSONB, default=list, server_default="[]", nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )


class Alert(Base, UUIDMixin):
    __tablename__ = "alerts"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    rule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True
    )
    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    alert_type: Mapped[str] = mapped_column(String(30), nullable=False)
    severity: Mapped[str] = mapped_column(String(10), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    alert_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="firing", nullable=False)
    acknowledged_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
```

```python
# app/models/notification.py
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class Notification(Base, UUIDMixin):
    __tablename__ = "notifications"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    notification_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
```

```python
# app/models/api_key.py
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class APIKey(Base, UUIDMixin):
    __tablename__ = "api_keys"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    scopes: Mapped[list[str]] = mapped_column(ARRAY(Text), default=["ingest", "read"], nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)
```

```python
# app/models/audit_log.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    actor_type: Mapped[str] = mapped_column(String(10), nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    before_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), primary_key=True, server_default="now()", nullable=False
    )
```

### 3.3 Model Registry

```python
# app/models/__init__.py
from app.models.base import Base
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.agent import Agent, AgentSession, AgentState
from app.models.task import Task, TaskAssignment, TaskResult
from app.models.event import Event
from app.models.span import Span
from app.models.metric import MetricsRaw
from app.models.achievement import Achievement, UserAchievement
from app.models.xp import XPLedger
from app.models.leaderboard import LeaderboardSnapshot
from app.models.alert import AlertRule, Alert
from app.models.notification import Notification
from app.models.api_key import APIKey
from app.models.audit_log import AuditLog

__all__ = [
    "Base",
    "User",
    "Workspace", "WorkspaceMember",
    "Agent", "AgentSession", "AgentState",
    "Task", "TaskAssignment", "TaskResult",
    "Event", "Span", "MetricsRaw",
    "Achievement", "UserAchievement",
    "XPLedger", "LeaderboardSnapshot",
    "AlertRule", "Alert",
    "Notification",
    "APIKey", "AuditLog",
]
```

### 3.4 Alembic Migration Setup

```python
# alembic/env.py
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings
from app.models import Base

config = context.config
settings = get_settings()

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### 3.5 TimescaleDB Hypertable Configuration

Hypertables are created in dedicated Alembic migrations using raw SQL via `op.execute()`:

```python
# alembic/versions/004_event_hypertables.py
"""Create events and spans hypertables."""

from alembic import op

revision = "004"
down_revision = "003"


def upgrade() -> None:
    # Enable TimescaleDB extension
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")

    # Create events table (already created by SQLAlchemy auto-generate)
    # Convert to hypertable
    op.execute("""
        SELECT create_hypertable('events', 'created_at',
            chunk_time_interval => INTERVAL '1 day',
            if_not_exists => true
        );
    """)

    # Events indexes
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_workspace_time ON events (workspace_id, created_at DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_agent_time ON events (agent_id, created_at DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_trace ON events (trace_id, created_at);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type, created_at DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON events (session_id, created_at) WHERE session_id IS NOT NULL;")

    # Convert spans to hypertable
    op.execute("""
        SELECT create_hypertable('spans', 'start_time',
            chunk_time_interval => INTERVAL '1 day',
            if_not_exists => true
        );
    """)

    # Spans indexes
    op.execute("CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans (trace_id, start_time);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_spans_agent ON spans (agent_id, start_time DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_spans_workspace ON spans (workspace_id, start_time DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_spans_operation ON spans (operation_name, start_time DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_spans_model ON spans (model, start_time DESC) WHERE model IS NOT NULL;")

    # Compression policies
    op.execute("""
        ALTER TABLE events SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'workspace_id, agent_id',
            timescaledb.compress_orderby = 'created_at DESC'
        );
    """)
    op.execute("SELECT add_compression_policy('events', INTERVAL '7 days');")

    op.execute("""
        ALTER TABLE spans SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'workspace_id, agent_id',
            timescaledb.compress_orderby = 'start_time DESC'
        );
    """)
    op.execute("SELECT add_compression_policy('spans', INTERVAL '7 days');")

    # Retention policies
    op.execute("SELECT add_retention_policy('events', INTERVAL '90 days');")
    op.execute("SELECT add_retention_policy('spans', INTERVAL '90 days');")


def downgrade() -> None:
    op.execute("SELECT remove_retention_policy('spans', if_exists => true);")
    op.execute("SELECT remove_retention_policy('events', if_exists => true);")
    op.execute("SELECT remove_compression_policy('spans', if_exists => true);")
    op.execute("SELECT remove_compression_policy('events', if_exists => true);")
```

### 3.6 Connection Pooling (asyncpg)

```python
# app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_recycle=3600,
    pool_pre_ping=True,
    echo=settings.DATABASE_ECHO,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### 3.7 Repository Pattern

```python
# app/repositories/base.py
from typing import Generic, TypeVar, Type
from uuid import UUID

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository providing common CRUD operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: UUID) -> ModelType | None:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        offset: int = 0,
        limit: int = 50,
        order_by=None,
    ) -> list[ModelType]:
        stmt = select(self.model)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        stmt = stmt.offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self, *filters) -> int:
        stmt = select(func.count()).select_from(self.model)
        for f in filters:
            stmt = stmt.where(f)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, obj: ModelType) -> ModelType:
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> None:
        await self.session.delete(obj)
        await self.session.flush()

    async def delete_by_id(self, id: UUID) -> bool:
        result = await self.session.execute(
            delete(self.model).where(self.model.id == id)
        )
        return result.rowcount > 0
```

```python
# app/repositories/agent_repo.py
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentSession
from app.repositories.base import BaseRepository


class AgentRepository(BaseRepository[Agent]):
    def __init__(self, session: AsyncSession):
        super().__init__(Agent, session)

    async def get_by_external_id(
        self, workspace_id: UUID, agent_external_id: str
    ) -> Agent | None:
        result = await self.session.execute(
            select(Agent).where(
                and_(
                    Agent.workspace_id == workspace_id,
                    Agent.agent_external_id == agent_external_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_by_workspace(
        self,
        workspace_id: UUID,
        state: str | None = None,
        framework: str | None = None,
        sort: str = "xp_total",
        order: str = "desc",
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Agent], int]:
        stmt = select(Agent).where(Agent.workspace_id == workspace_id)
        count_stmt = select(func.count()).select_from(Agent).where(Agent.workspace_id == workspace_id)

        if state:
            stmt = stmt.where(Agent.current_state == state)
            count_stmt = count_stmt.where(Agent.current_state == state)
        if framework:
            stmt = stmt.where(Agent.framework == framework)
            count_stmt = count_stmt.where(Agent.framework == framework)

        sort_col = getattr(Agent, sort, Agent.xp_total)
        if order == "asc":
            stmt = stmt.order_by(sort_col.asc())
        else:
            stmt = stmt.order_by(sort_col.desc())

        stmt = stmt.offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        agents = list(result.scalars().all())

        from sqlalchemy import func
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        return agents, total

    async def get_leaderboard_agents(
        self, workspace_id: UUID, limit: int = 50
    ) -> list[Agent]:
        result = await self.session.execute(
            select(Agent)
            .where(
                and_(Agent.workspace_id == workspace_id, Agent.is_active == True)
            )
            .order_by(Agent.xp_total.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
```

---

## 4. API Implementation

### 4.1 Application Factory and Lifespan

```python
# app/main.py
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine
from app.core.redis import redis_pool, init_redis, close_redis
from app.core.middleware import RequestTimingMiddleware, RateLimitMiddleware
from app.routers import (
    auth, users, workspaces, agents, tasks, traces,
    metrics, achievements, leaderboard, quests, alerts,
    notifications, api_keys, dashboard, otlp_receiver,
    websocket, health,
)
from app.services.auth_service import seed_default_user

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup
    logger.info("Starting OpenAgentVisualizer backend...")
    await init_redis()
    await seed_default_user()
    logger.info("Backend ready.")
    yield
    # Shutdown
    logger.info("Shutting down...")
    await close_redis()
    await engine.dispose()
    logger.info("Shutdown complete.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Gamified virtual world for AI agent management and observability",
        lifespan=lifespan,
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom middleware
    app.add_middleware(RequestTimingMiddleware)

    # Routers
    app.include_router(health.router, tags=["Health"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
    app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["Workspaces"])
    app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
    app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
    app.include_router(traces.router, prefix="/api/v1/traces", tags=["Traces"])
    app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["Metrics"])
    app.include_router(achievements.router, prefix="/api/v1/achievements", tags=["Achievements"])
    app.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["Leaderboard"])
    app.include_router(quests.router, prefix="/api/v1/quests", tags=["Quests"])
    app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
    app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
    app.include_router(api_keys.router, prefix="/api/v1/api-keys", tags=["API Keys"])
    app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
    app.include_router(otlp_receiver.router, tags=["OTLP"])
    app.include_router(websocket.router, tags=["WebSocket"])

    return app


app = create_app()
```

### 4.2 Pydantic Schemas

```python
# app/schemas/common.py
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        return (self.total + self.page_size - 1) // self.page_size


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None
    field_errors: dict[str, list[str]] | None = None


class HealthResponse(BaseModel):
    status: str  # "healthy", "degraded", "unhealthy"
    version: str
    database: str
    redis: str
    uptime_seconds: float
```

```python
# app/schemas/auth.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterResponse(BaseModel):
    user: "UserBrief"
    workspace: "WorkspaceBrief"
    api_key: "APIKeyBrief"
    tokens: TokenResponse


class UserBrief(BaseModel):
    id: UUID
    email: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceBrief(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class APIKeyBrief(BaseModel):
    key: str
    name: str
```

```python
# app/schemas/agent.py
from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    agent_external_id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=100)
    role: str | None = Field(None, max_length=100)
    framework: str = Field(..., pattern="^(langchain|crewai|autogen|openai|anthropic|ollama|huggingface|custom)$")
    model: str | None = Field(None, max_length=100)
    capabilities: list[str] | None = None
    tags: dict | None = None


class AgentRead(BaseModel):
    id: UUID
    agent_external_id: str
    name: str
    role: str | None
    framework: str
    model: str | None
    avatar_config: dict
    capabilities: list[str] | None
    tags: dict
    xp_total: int
    level: int
    tier_name: str
    streak_days: int
    streak_start: date | None
    current_state: str
    last_heartbeat: datetime | None
    total_tasks: int
    total_cost_usd: float
    total_tokens: int
    total_errors: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    role: str | None = Field(None, max_length=100)
    avatar_config: dict | None = None
    tags: dict | None = None


class AgentHeartbeat(BaseModel):
    state: str = Field(..., pattern="^(spawned|idle|working|completed|error|terminated)$")
    session_id: UUID | None = None
    metrics: dict | None = None


class AgentStateChange(BaseModel):
    new_state: str = Field(..., pattern="^(spawned|idle|working|completed|error|terminated)$")
    trigger: str
    session_id: UUID | None = None
    event_data: dict | None = None


class AgentStateChangeResponse(BaseModel):
    previous_state: str
    new_state: str
    transition_recorded: bool
```

```python
# app/schemas/event.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EventIngest(BaseModel):
    event_type: str
    agent_id: str
    session_id: str | None = None
    trace_id: str
    span_id: str
    parent_span_id: str | None = None
    event_data: dict
    timestamp: datetime | None = None


class SpanIngest(BaseModel):
    trace_id: str
    span_id: str
    parent_span_id: str | None = None
    operation_name: str
    span_kind: str = "internal"
    start_time: datetime
    end_time: datetime | None = None
    status_code: str = "ok"
    attributes: dict = {}


class BulkIngestRequest(BaseModel):
    events: list[EventIngest] = Field(default_factory=list)
    spans: list[SpanIngest] = Field(default_factory=list)


class BulkIngestResponse(BaseModel):
    accepted: bool
    events_count: int
    spans_count: int
    processing_id: UUID
```

### 4.3 Dependency Injection Patterns

```python
# app/deps/auth.py
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.core.security import decode_jwt_token
from app.models.user import User
from app.repositories.user_repo import UserRepository

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    db=Depends(get_db),
) -> User:
    """Extract and validate JWT token, return the current user."""
    token = credentials.credentials
    payload = decode_jwt_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )
    repo = UserRepository(db)
    user = await repo.get_by_id(UUID(user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )
    return user


def require_role(*roles: str):
    """Factory that returns a dependency requiring the user to have one of the specified workspace roles."""
    async def _check_role(
        user: Annotated[User, Depends(get_current_user)],
        workspace_id: UUID,
        db=Depends(get_db),
    ):
        from app.repositories.workspace_repo import WorkspaceRepository
        repo = WorkspaceRepository(db)
        member = await repo.get_member(workspace_id, user.id)
        if member is None or member.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(roles)}",
            )
        return user
    return _check_role
```

```python
# app/deps/api_key.py
from typing import Annotated

from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.api_key_service import APIKeyService


async def validate_api_key(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Validate API key from Authorization header. Returns key metadata."""
    if not authorization.startswith("Bearer oav_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format. Expected: Bearer oav_live_* or oav_test_*",
        )
    raw_key = authorization.replace("Bearer ", "")
    service = APIKeyService(db)
    key_info = await service.validate_key(raw_key)
    if key_info is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired API key",
        )
    return key_info


def require_scope(*scopes: str):
    """Require the API key to have at least one of the specified scopes."""
    async def _check(key_info: Annotated[dict, Depends(validate_api_key)]):
        if not any(s in key_info["scopes"] for s in scopes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key missing required scope: {', '.join(scopes)}",
            )
        return key_info
    return _check
```

```python
# app/deps/rate_limit.py
import time
from fastapi import Depends, HTTPException, Request, status

from app.core.redis import get_redis


class RateLimiter:
    """Redis-backed sliding window rate limiter."""

    def __init__(self, requests_per_minute: int = 60, key_prefix: str = "rl"):
        self.rpm = requests_per_minute
        self.key_prefix = key_prefix
        self.window = 60  # seconds

    async def __call__(self, request: Request):
        redis = await get_redis()
        # Key based on client IP and endpoint
        client_ip = request.client.host if request.client else "unknown"
        key = f"{self.key_prefix}:{client_ip}:{request.url.path}"

        now = time.time()
        window_start = now - self.window

        pipe = redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, self.window + 1)
        results = await pipe.execute()

        request_count = results[2]
        if request_count > self.rpm:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Max {self.rpm} requests per minute.",
                headers={"Retry-After": str(self.window)},
            )
```

### 4.4 Router Example: Agents

```python
# app/routers/agents.py
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user
from app.deps.api_key import validate_api_key, require_scope
from app.deps.rate_limit import RateLimiter
from app.models.user import User
from app.schemas.agent import (
    AgentCreate, AgentRead, AgentUpdate,
    AgentHeartbeat, AgentStateChange, AgentStateChangeResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.agent_service import AgentService

router = APIRouter()


@router.post(
    "",
    response_model=AgentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(requests_per_minute=100))],
)
async def register_agent(
    data: AgentCreate,
    key_info: Annotated[dict, Depends(require_scope("ingest"))],
    db: AsyncSession = Depends(get_db),
):
    """Register a new agent in the workspace (SDK endpoint)."""
    service = AgentService(db)
    agent = await service.register_agent(
        workspace_id=key_info["workspace_id"],
        data=data,
    )
    return agent


@router.get(
    "",
    response_model=PaginatedResponse[AgentRead],
    dependencies=[Depends(RateLimiter(requests_per_minute=60))],
)
async def list_agents(
    user: Annotated[User, Depends(get_current_user)],
    workspace_id: UUID,
    state: str | None = None,
    framework: str | None = None,
    sort: str = "xp_total",
    order: str = "desc",
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all agents in a workspace."""
    service = AgentService(db)
    agents, total = await service.list_agents(
        workspace_id=workspace_id,
        state=state,
        framework=framework,
        sort=sort,
        order=order,
        offset=(page - 1) * page_size,
        limit=min(page_size, 100),
    )
    return PaginatedResponse(
        items=agents,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{agent_id}",
    response_model=AgentRead,
    dependencies=[Depends(RateLimiter(requests_per_minute=120))],
)
async def get_agent(
    agent_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get agent details."""
    service = AgentService(db)
    agent = await service.get_agent(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put(
    "/{agent_id}",
    response_model=AgentRead,
    dependencies=[Depends(RateLimiter(requests_per_minute=30))],
)
async def update_agent(
    agent_id: UUID,
    data: AgentUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Update agent configuration."""
    service = AgentService(db)
    agent = await service.update_agent(agent_id, data)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post(
    "/{agent_id}/heartbeat",
    dependencies=[Depends(RateLimiter(requests_per_minute=200))],
)
async def agent_heartbeat(
    agent_id: UUID,
    data: AgentHeartbeat,
    key_info: Annotated[dict, Depends(require_scope("ingest"))],
    db: AsyncSession = Depends(get_db),
):
    """Agent heartbeat for health monitoring."""
    service = AgentService(db)
    result = await service.process_heartbeat(agent_id, data)
    return result


@router.post(
    "/{agent_id}/state",
    response_model=AgentStateChangeResponse,
    dependencies=[Depends(RateLimiter(requests_per_minute=500))],
)
async def update_agent_state(
    agent_id: UUID,
    data: AgentStateChange,
    key_info: Annotated[dict, Depends(require_scope("ingest"))],
    db: AsyncSession = Depends(get_db),
):
    """Update agent state (triggered by SDK on state transitions)."""
    service = AgentService(db)
    result = await service.change_state(agent_id, data)
    return result
```

### 4.5 Error Handling

```python
# app/core/exceptions.py
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError


class AppException(Exception):
    def __init__(self, status_code: int, detail: str, error_code: str | None = None):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code


class NotFoundError(AppException):
    def __init__(self, resource: str, id: str | None = None):
        detail = f"{resource} not found" + (f": {id}" if id else "")
        super().__init__(status.HTTP_404_NOT_FOUND, detail, "NOT_FOUND")


class ConflictError(AppException):
    def __init__(self, detail: str):
        super().__init__(status.HTTP_409_CONFLICT, detail, "CONFLICT")


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, "FORBIDDEN")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": exc.error_code,
            },
        )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "error_code": "VALIDATION_ERROR",
                "field_errors": {
                    str(e["loc"]): e["msg"] for e in exc.errors()
                },
            },
        )
```

---

## 5. Authentication & Authorization

### 5.1 Security Core

```python
# app/core/security.py
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: UUID, extra_claims: dict | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_jwt_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_api_key(prefix: str = "oav_live_") -> tuple[str, str]:
    """Generate an API key and return (raw_key, hashed_key)."""
    random_part = secrets.token_urlsafe(32)
    raw_key = f"{prefix}{random_part}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    return raw_key, key_hash


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()
```

### 5.2 Auth Service with Default User Seeding

```python
# app/services/auth_service.py
import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    generate_api_key,
)
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.api_key import APIKey
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

logger = logging.getLogger(__name__)
settings = get_settings()


async def seed_default_user() -> None:
    """Seed the default admin user on startup if not exists."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == settings.DEFAULT_USER_EMAIL)
        )
        existing = result.scalar_one_or_none()
        if existing:
            logger.info(f"Default user already exists: {settings.DEFAULT_USER_EMAIL}")
            return

        user = User(
            email=settings.DEFAULT_USER_EMAIL,
            password_hash=hash_password(settings.DEFAULT_USER_PASSWORD),
            display_name=settings.DEFAULT_USER_DISPLAY_NAME,
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        await session.flush()

        workspace = Workspace(
            name="Default Workspace",
            slug="default-workspace",
            owner_id=user.id,
            tier="pro",
            gamification_enabled=True,
        )
        session.add(workspace)
        await session.flush()

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="owner",
        )
        session.add(member)

        raw_key, key_hash = generate_api_key("oav_live_")
        api_key = APIKey(
            workspace_id=workspace.id,
            created_by=user.id,
            name="Default Key",
            key_prefix="oav_live_",
            key_hash=key_hash,
            scopes=["ingest", "read", "write", "admin"],
        )
        session.add(api_key)

        await session.commit()
        logger.info(f"Default user seeded: {settings.DEFAULT_USER_EMAIL}")
        logger.info(f"Default API key: {raw_key}")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> dict:
        # Check if email exists
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if result.scalar_one_or_none():
            from app.core.exceptions import ConflictError
            raise ConflictError("Email already registered")

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            display_name=data.display_name,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        await self.db.flush()

        slug = data.display_name.lower().replace(" ", "-")[:50]
        workspace = Workspace(
            name=f"{data.display_name}'s Workspace",
            slug=f"{slug}-{str(user.id)[:8]}",
            owner_id=user.id,
        )
        self.db.add(workspace)
        await self.db.flush()

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="owner",
        )
        self.db.add(member)

        raw_key, key_hash = generate_api_key("oav_live_")
        api_key = APIKey(
            workspace_id=workspace.id,
            created_by=user.id,
            name="Default Key",
            key_prefix="oav_live_",
            key_hash=key_hash,
            scopes=["ingest", "read"],
        )
        self.db.add(api_key)
        await self.db.flush()

        tokens = TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            token_type="Bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        return {
            "user": user,
            "workspace": workspace,
            "api_key": {"key": raw_key, "name": "Default Key"},
            "tokens": tokens,
        }

    async def login(self, data: LoginRequest) -> dict:
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        user = result.scalar_one_or_none()
        if not user or not user.password_hash:
            from app.core.exceptions import AppException
            raise AppException(401, "Invalid credentials", "AUTH_FAILED")
        if not verify_password(data.password, user.password_hash):
            from app.core.exceptions import AppException
            raise AppException(401, "Invalid credentials", "AUTH_FAILED")
        if not user.is_active:
            from app.core.exceptions import AppException
            raise AppException(403, "Account deactivated", "ACCOUNT_INACTIVE")

        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        tokens = TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            token_type="Bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        return {"user": user, "tokens": tokens}

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        from app.core.security import decode_jwt_token
        payload = decode_jwt_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            from app.core.exceptions import AppException
            raise AppException(401, "Invalid refresh token", "INVALID_REFRESH")

        user_id = UUID(payload["sub"])
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            from app.core.exceptions import AppException
            raise AppException(401, "User not found", "USER_NOT_FOUND")

        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            token_type="Bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
```

### 5.3 OAuth2 Integration (Google, GitHub)

```python
# app/routers/auth.py (OAuth section)
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
import httpx

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

OAUTH_CONFIGS = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
        "scopes": "openid email profile",
        "client_id_key": "GOOGLE_CLIENT_ID",
        "client_secret_key": "GOOGLE_CLIENT_SECRET",
    },
    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "scopes": "read:user user:email",
        "client_id_key": "GITHUB_CLIENT_ID",
        "client_secret_key": "GITHUB_CLIENT_SECRET",
    },
}


@router.get("/oauth/{provider}")
async def oauth_redirect(provider: str):
    """Redirect user to OAuth provider's authorization page."""
    if provider not in OAUTH_CONFIGS:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("OAuth provider", provider)

    config = OAUTH_CONFIGS[provider]
    client_id = getattr(settings, config["client_id_key"])
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/{provider}/callback"
    state = secrets.token_urlsafe(32)

    # Store state in Redis for CSRF protection (TTL 10 min)
    redis = await get_redis()
    await redis.setex(f"oauth_state:{state}", 600, provider)

    auth_url = (
        f"{config['auth_url']}?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={config['scopes']}&"
        f"state={state}&"
        f"response_type=code"
    )
    return RedirectResponse(auth_url)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    db=Depends(get_db),
):
    """Handle OAuth callback, create/login user, redirect with tokens."""
    redis = await get_redis()
    stored = await redis.get(f"oauth_state:{state}")
    if not stored or stored.decode() != provider:
        from app.core.exceptions import AppException
        raise AppException(400, "Invalid OAuth state", "OAUTH_STATE_INVALID")
    await redis.delete(f"oauth_state:{state}")

    config = OAUTH_CONFIGS[provider]
    client_id = getattr(settings, config["client_id_key"])
    client_secret = getattr(settings, config["client_secret_key"])
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/{provider}/callback"

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            config["token_url"],
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()
        oauth_token = token_data.get("access_token")

        # Fetch user info
        userinfo_resp = await client.get(
            config["userinfo_url"],
            headers={"Authorization": f"Bearer {oauth_token}"},
        )
        user_info = userinfo_resp.json()

    # Extract email and name based on provider
    if provider == "google":
        email = user_info["email"]
        name = user_info.get("name", email.split("@")[0])
        oauth_id = user_info["id"]
    elif provider == "github":
        email = user_info.get("email")
        if not email:
            # Fetch primary email from GitHub emails API
            async with httpx.AsyncClient() as client:
                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {oauth_token}"},
                )
                emails = emails_resp.json()
                email = next(e["email"] for e in emails if e["primary"])
        name = user_info.get("name") or user_info["login"]
        oauth_id = str(user_info["id"])

    # Find or create user
    from app.services.auth_service import AuthService
    auth_service = AuthService(db)
    user, tokens = await auth_service.oauth_login_or_register(
        email=email,
        display_name=name,
        oauth_provider=provider,
        oauth_id=oauth_id,
        avatar_url=user_info.get("avatar_url") or user_info.get("picture"),
    )

    # Redirect to frontend with tokens in URL fragment
    frontend_url = settings.ALLOWED_ORIGINS[0]
    return RedirectResponse(
        f"{frontend_url}/auth/callback"
        f"#access_token={tokens.access_token}"
        f"&refresh_token={tokens.refresh_token}"
        f"&expires_in={tokens.expires_in}"
    )
```

### 5.4 RBAC Implementation

The RBAC system maps workspace roles to permission sets:

```python
# app/deps/workspace.py
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.user import User
from app.repositories.workspace_repo import WorkspaceRepository

ROLE_HIERARCHY = {
    "owner": 4,
    "admin": 3,
    "engineer": 2,
    "viewer": 1,
}


async def get_workspace_member(
    workspace_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    repo = WorkspaceRepository(db)
    member = await repo.get_member(workspace_id, user.id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace",
        )
    return member


def require_workspace_role(min_role: str):
    """Dependency factory: requires minimum workspace role level."""
    min_level = ROLE_HIERARCHY.get(min_role, 0)

    async def _dep(
        workspace_id: UUID,
        user: Annotated[User, Depends(get_current_user)],
        db: AsyncSession = Depends(get_db),
    ):
        repo = WorkspaceRepository(db)
        member = await repo.get_member(workspace_id, user.id)
        if member is None:
            raise HTTPException(status_code=403, detail="Not a workspace member")
        user_level = ROLE_HIERARCHY.get(member.role, 0)
        if user_level < min_level:
            raise HTTPException(
                status_code=403,
                detail=f"Requires at least '{min_role}' role in this workspace",
            )
        return member

    return _dep
```

---

## 6. Event Ingestion Pipeline

### 6.1 OTLP HTTP Receiver

```python
# app/routers/otlp_receiver.py
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from google.protobuf.json_format import MessageToDict
from opentelemetry.proto.collector.trace.v1.trace_service_pb2 import (
    ExportTraceServiceRequest,
)

from app.deps.api_key import validate_api_key
from app.deps.rate_limit import RateLimiter
from app.services.event_service import EventService
from app.services.otlp_service import OTLPParser
from app.core.redis import get_redis

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/v1/traces",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(RateLimiter(requests_per_minute=1000))],
)
async def otlp_http_receiver(
    request: Request,
    key_info: dict = Depends(validate_api_key),
    content_type: str = Header("application/x-protobuf"),
):
    """
    OTLP HTTP trace receiver (port 4318 path /v1/traces).
    Accepts protobuf or JSON payloads, parses spans,
    and produces them to Redis Streams for async processing.
    """
    body = await request.body()
    if len(body) > 16 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload exceeds 16 MB limit",
        )

    workspace_id = key_info["workspace_id"]
    parser = OTLPParser()

    if content_type == "application/x-protobuf":
        otlp_request = ExportTraceServiceRequest()
        otlp_request.ParseFromString(body)
        normalized_events = parser.parse_protobuf(otlp_request, workspace_id)
    elif content_type == "application/json":
        import orjson
        json_body = orjson.loads(body)
        normalized_events = parser.parse_json(json_body, workspace_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Content-Type must be application/x-protobuf or application/json",
        )

    # Produce to Redis Streams
    redis = await get_redis()
    event_service = EventService(redis)
    processing_id = uuid.uuid4()
    await event_service.produce_events(
        workspace_id=workspace_id,
        events=normalized_events,
        processing_id=processing_id,
    )

    return {
        "accepted": True,
        "events_count": len(normalized_events),
        "processing_id": str(processing_id),
    }
```

### 6.2 OTLP Protobuf Parser

```python
# app/services/otlp_service.py
import logging
from datetime import datetime, timezone
from uuid import UUID

from google.protobuf.json_format import MessageToDict
from opentelemetry.proto.collector.trace.v1.trace_service_pb2 import (
    ExportTraceServiceRequest,
)

logger = logging.getLogger(__name__)


class OTLPParser:
    """Parses OTLP trace data into normalized OAV event dicts."""

    # OTel GenAI semantic convention attribute keys
    GENAI_SYSTEM = "gen_ai.system"
    GENAI_MODEL = "gen_ai.request.model"
    GENAI_INPUT_TOKENS = "gen_ai.usage.input_tokens"
    GENAI_OUTPUT_TOKENS = "gen_ai.usage.output_tokens"
    GENAI_TEMPERATURE = "gen_ai.request.temperature"
    GENAI_FINISH_REASON = "gen_ai.response.finish_reasons"

    # OAV extended attribute keys
    OAV_AGENT_ID = "oav.agent.id"
    OAV_AGENT_NAME = "oav.agent.name"
    OAV_AGENT_ROLE = "oav.agent.role"
    OAV_AGENT_FRAMEWORK = "oav.agent.framework"
    OAV_TASK_ID = "oav.task.id"
    OAV_COST_USD = "oav.cost.usd"
    OAV_SESSION_ID = "oav.session.id"
    OAV_TENANT_ID = "oav.tenant.id"

    def parse_protobuf(
        self, request: ExportTraceServiceRequest, workspace_id: UUID
    ) -> list[dict]:
        """Parse OTLP protobuf ExportTraceServiceRequest into normalized events."""
        events = []
        for resource_spans in request.resource_spans:
            resource_attrs = self._extract_attributes(
                resource_spans.resource.attributes
            )
            for scope_spans in resource_spans.scope_spans:
                for span in scope_spans.spans:
                    span_attrs = self._extract_attributes(span.attributes)
                    merged_attrs = {**resource_attrs, **span_attrs}

                    normalized = {
                        "workspace_id": str(workspace_id),
                        "agent_id": merged_attrs.get(self.OAV_AGENT_ID, "unknown"),
                        "session_id": merged_attrs.get(self.OAV_SESSION_ID),
                        "trace_id": span.trace_id.hex(),
                        "span_id": span.span_id.hex(),
                        "parent_span_id": (
                            span.parent_span_id.hex()
                            if span.parent_span_id
                            else None
                        ),
                        "operation_name": span.name,
                        "span_kind": self._span_kind_to_str(span.kind),
                        "status_code": self._status_to_str(span.status),
                        "status_message": span.status.message or None,
                        "start_time": self._nanos_to_datetime(
                            span.start_time_unix_nano
                        ),
                        "end_time": (
                            self._nanos_to_datetime(span.end_time_unix_nano)
                            if span.end_time_unix_nano
                            else None
                        ),
                        "duration_ms": (
                            (span.end_time_unix_nano - span.start_time_unix_nano)
                            // 1_000_000
                            if span.end_time_unix_nano
                            else None
                        ),
                        "model": merged_attrs.get(self.GENAI_MODEL),
                        "input_tokens": merged_attrs.get(self.GENAI_INPUT_TOKENS),
                        "output_tokens": merged_attrs.get(self.GENAI_OUTPUT_TOKENS),
                        "cost_usd": merged_attrs.get(self.OAV_COST_USD),
                        "temperature": merged_attrs.get(self.GENAI_TEMPERATURE),
                        "attributes": merged_attrs,
                        "resource_attrs": resource_attrs,
                        "span_events": [
                            {
                                "name": e.name,
                                "timestamp": self._nanos_to_datetime(
                                    e.time_unix_nano
                                ),
                                "attributes": self._extract_attributes(
                                    e.attributes
                                ),
                            }
                            for e in span.events
                        ],
                    }
                    events.append(normalized)
        return events

    def parse_json(self, json_body: dict, workspace_id: UUID) -> list[dict]:
        """Parse OTLP JSON payload into normalized events."""
        events = []
        for rs in json_body.get("resourceSpans", []):
            resource_attrs = self._extract_kv_list(
                rs.get("resource", {}).get("attributes", [])
            )
            for ss in rs.get("scopeSpans", []):
                for span in ss.get("spans", []):
                    span_attrs = self._extract_kv_list(
                        span.get("attributes", [])
                    )
                    merged = {**resource_attrs, **span_attrs}
                    normalized = {
                        "workspace_id": str(workspace_id),
                        "agent_id": merged.get(self.OAV_AGENT_ID, "unknown"),
                        "session_id": merged.get(self.OAV_SESSION_ID),
                        "trace_id": span.get("traceId", ""),
                        "span_id": span.get("spanId", ""),
                        "parent_span_id": span.get("parentSpanId"),
                        "operation_name": span.get("name", ""),
                        "span_kind": str(span.get("kind", 0)),
                        "status_code": span.get("status", {}).get(
                            "code", "ok"
                        ),
                        "start_time": span.get("startTimeUnixNano"),
                        "end_time": span.get("endTimeUnixNano"),
                        "model": merged.get(self.GENAI_MODEL),
                        "input_tokens": merged.get(self.GENAI_INPUT_TOKENS),
                        "output_tokens": merged.get(self.GENAI_OUTPUT_TOKENS),
                        "cost_usd": merged.get(self.OAV_COST_USD),
                        "attributes": merged,
                        "resource_attrs": resource_attrs,
                    }
                    events.append(normalized)
        return events

    @staticmethod
    def _extract_attributes(attrs) -> dict:
        result = {}
        for attr in attrs:
            key = attr.key
            value = attr.value
            if value.HasField("string_value"):
                result[key] = value.string_value
            elif value.HasField("int_value"):
                result[key] = value.int_value
            elif value.HasField("double_value"):
                result[key] = value.double_value
            elif value.HasField("bool_value"):
                result[key] = value.bool_value
        return result

    @staticmethod
    def _extract_kv_list(kv_list: list[dict]) -> dict:
        result = {}
        for kv in kv_list:
            key = kv.get("key", "")
            value = kv.get("value", {})
            if "stringValue" in value:
                result[key] = value["stringValue"]
            elif "intValue" in value:
                result[key] = int(value["intValue"])
            elif "doubleValue" in value:
                result[key] = float(value["doubleValue"])
            elif "boolValue" in value:
                result[key] = value["boolValue"]
        return result

    @staticmethod
    def _nanos_to_datetime(nanos: int) -> str:
        return datetime.fromtimestamp(
            nanos / 1e9, tz=timezone.utc
        ).isoformat()

    @staticmethod
    def _span_kind_to_str(kind: int) -> str:
        mapping = {0: "unspecified", 1: "internal", 2: "server", 3: "client", 4: "producer", 5: "consumer"}
        return mapping.get(kind, "unspecified")

    @staticmethod
    def _status_to_str(status) -> str:
        mapping = {0: "unset", 1: "ok", 2: "error"}
        return mapping.get(status.code, "unset")
```

### 6.3 Event Validation, PII Detection, and Redis Streams Producer

```python
# app/services/event_service.py
import logging
import uuid
from datetime import datetime, timezone
from uuid import UUID

import orjson
from redis.asyncio import Redis

from app.services.pii_detector import PIIDetector

logger = logging.getLogger(__name__)


class EventService:
    """Validates events and produces them to Redis Streams."""

    STREAM_PREFIX = "oav:events:"
    DEAD_LETTER_STREAM = "oav:deadletter"
    MAX_STREAM_LEN = 100_000  # Cap stream length per tenant

    def __init__(self, redis: Redis):
        self.redis = redis
        self.pii_detector = PIIDetector()

    async def produce_events(
        self,
        workspace_id: UUID,
        events: list[dict],
        processing_id: uuid.UUID,
    ) -> int:
        """Validate, mask PII, and write events to Redis Streams."""
        produced = 0
        stream_key = f"{self.STREAM_PREFIX}{workspace_id}"

        pipe = self.redis.pipeline()
        for event in events:
            try:
                # Validate required fields
                self._validate_event(event)

                # PII detection and masking
                if "attributes" in event:
                    event["attributes"] = self.pii_detector.mask(
                        event["attributes"]
                    )

                # Add metadata
                event["_processing_id"] = str(processing_id)
                event["_ingested_at"] = datetime.now(timezone.utc).isoformat()

                # Serialize and produce
                payload = {"data": orjson.dumps(event).decode()}
                pipe.xadd(
                    stream_key,
                    payload,
                    maxlen=self.MAX_STREAM_LEN,
                    approximate=True,
                )
                produced += 1

            except Exception as e:
                logger.warning(f"Event validation failed: {e}")
                # Send to dead letter queue
                pipe.xadd(
                    self.DEAD_LETTER_STREAM,
                    {
                        "data": orjson.dumps(event).decode(),
                        "error": str(e),
                        "workspace_id": str(workspace_id),
                    },
                    maxlen=10_000,
                    approximate=True,
                )

        await pipe.execute()
        logger.info(
            f"Produced {produced}/{len(events)} events to stream {stream_key}"
        )
        return produced

    @staticmethod
    def _validate_event(event: dict) -> None:
        required = ["workspace_id", "agent_id", "trace_id", "span_id"]
        for field in required:
            if not event.get(field):
                raise ValueError(f"Missing required field: {field}")
        if event.get("operation_name") and len(event["operation_name"]) > 255:
            raise ValueError("operation_name exceeds 255 characters")
```

### 6.4 PII Detector and Masker

```python
# app/services/pii_detector.py
import re


class PIIDetector:
    """Detects and masks PII in event payloads."""

    EMAIL_PATTERN = re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    )
    PHONE_PATTERN = re.compile(
        r"\b(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b"
    )
    SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
    CREDIT_CARD_PATTERN = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b")
    IP_PATTERN = re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")

    SENSITIVE_KEYS = {
        "password", "secret", "token", "api_key", "apikey", "authorization",
        "credential", "private_key", "access_token", "refresh_token",
        "ssn", "social_security", "credit_card", "card_number",
    }

    MASK = "[REDACTED]"

    def mask(self, data: dict) -> dict:
        """Recursively scan dict and mask PII values."""
        return self._mask_recursive(data)

    def _mask_recursive(self, obj):
        if isinstance(obj, dict):
            result = {}
            for key, value in obj.items():
                if key.lower() in self.SENSITIVE_KEYS:
                    result[key] = self.MASK
                else:
                    result[key] = self._mask_recursive(value)
            return result
        elif isinstance(obj, list):
            return [self._mask_recursive(item) for item in obj]
        elif isinstance(obj, str):
            return self._mask_string(obj)
        return obj

    def _mask_string(self, text: str) -> str:
        text = self.EMAIL_PATTERN.sub("[EMAIL_REDACTED]", text)
        text = self.SSN_PATTERN.sub("[SSN_REDACTED]", text)
        text = self.CREDIT_CARD_PATTERN.sub("[CC_REDACTED]", text)
        # Do not mask IPs or phones by default (too many false positives in logs)
        return text
```

### 6.5 Batch Ingestion Endpoint (REST JSON)

```python
# Inside app/routers/traces.py
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.deps.api_key import require_scope
from app.deps.rate_limit import RateLimiter
from app.schemas.event import BulkIngestRequest, BulkIngestResponse
from app.services.event_service import EventService

router = APIRouter()


@router.post(
    "/ingest",
    response_model=BulkIngestResponse,
    status_code=202,
    dependencies=[Depends(RateLimiter(requests_per_minute=1000))],
)
async def bulk_ingest(
    data: BulkIngestRequest,
    key_info: dict = Depends(require_scope("ingest")),
):
    """Bulk ingest events and spans via REST JSON (SDK batch mode)."""
    workspace_id = key_info["workspace_id"]
    redis = await get_redis()
    event_service = EventService(redis)
    processing_id = uuid4()

    # Normalize SDK events into stream format
    normalized = []
    for evt in data.events:
        normalized.append({
            "workspace_id": str(workspace_id),
            "agent_id": evt.agent_id,
            "session_id": evt.session_id,
            "trace_id": evt.trace_id,
            "span_id": evt.span_id,
            "parent_span_id": evt.parent_span_id,
            "event_type": evt.event_type,
            "event_data": evt.event_data,
            "created_at": (evt.timestamp or datetime.now(timezone.utc)).isoformat(),
        })

    for span in data.spans:
        normalized.append({
            "workspace_id": str(workspace_id),
            "trace_id": span.trace_id,
            "span_id": span.span_id,
            "parent_span_id": span.parent_span_id,
            "operation_name": span.operation_name,
            "span_kind": span.span_kind,
            "start_time": span.start_time.isoformat(),
            "end_time": span.end_time.isoformat() if span.end_time else None,
            "status_code": span.status_code,
            "attributes": span.attributes,
        })

    count = await event_service.produce_events(
        workspace_id=workspace_id,
        events=normalized,
        processing_id=processing_id,
    )

    return BulkIngestResponse(
        accepted=True,
        events_count=len(data.events),
        spans_count=len(data.spans),
        processing_id=processing_id,
    )
```

---

## 7. Real-Time Services

### 7.1 WebSocket Manager

```python
# app/services/websocket_manager.py
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import orjson
from fastapi import WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

logger = logging.getLogger(__name__)


class ConnectionInfo:
    def __init__(
        self,
        websocket: WebSocket,
        user_id: uuid.UUID,
        workspace_id: uuid.UUID,
        subscriptions: set[str] | None = None,
    ):
        self.websocket = websocket
        self.user_id = user_id
        self.workspace_id = workspace_id
        self.subscriptions = subscriptions or {"agents", "tasks", "alerts"}
        self.connected_at = datetime.now(timezone.utc)
        self.last_pong = datetime.now(timezone.utc)


class WebSocketManager:
    """Manages WebSocket connections and message routing."""

    def __init__(self, redis: Redis):
        self.redis = redis
        self.connections: dict[str, ConnectionInfo] = {}  # conn_id -> info
        self.workspace_connections: dict[str, set[str]] = {}  # workspace_id -> {conn_ids}
        self._pubsub_task: asyncio.Task | None = None

    async def connect(
        self,
        websocket: WebSocket,
        user_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> str:
        """Accept WebSocket connection and register it."""
        await websocket.accept()
        conn_id = str(uuid.uuid4())

        info = ConnectionInfo(
            websocket=websocket,
            user_id=user_id,
            workspace_id=workspace_id,
        )
        self.connections[conn_id] = info

        ws_id = str(workspace_id)
        if ws_id not in self.workspace_connections:
            self.workspace_connections[ws_id] = set()
        self.workspace_connections[ws_id].add(conn_id)

        logger.info(
            f"WebSocket connected: conn={conn_id} user={user_id} workspace={workspace_id}"
        )

        # Send initial state
        await self._send_json(websocket, {
            "type": "connected",
            "connection_id": conn_id,
            "server_time": datetime.now(timezone.utc).isoformat(),
        })

        return conn_id

    async def disconnect(self, conn_id: str) -> None:
        """Remove connection from registry."""
        info = self.connections.pop(conn_id, None)
        if info:
            ws_id = str(info.workspace_id)
            if ws_id in self.workspace_connections:
                self.workspace_connections[ws_id].discard(conn_id)
                if not self.workspace_connections[ws_id]:
                    del self.workspace_connections[ws_id]
            logger.info(f"WebSocket disconnected: conn={conn_id}")

    async def broadcast_to_workspace(
        self,
        workspace_id: uuid.UUID,
        message: dict,
        event_type: str = "agents",
    ) -> int:
        """Send message to all connections in a workspace subscribed to event_type."""
        ws_id = str(workspace_id)
        conn_ids = self.workspace_connections.get(ws_id, set())
        sent = 0
        dead = []

        for conn_id in conn_ids:
            info = self.connections.get(conn_id)
            if info is None:
                dead.append(conn_id)
                continue
            if event_type not in info.subscriptions:
                continue
            try:
                await self._send_json(info.websocket, message)
                sent += 1
            except Exception:
                dead.append(conn_id)

        for conn_id in dead:
            await self.disconnect(conn_id)

        return sent

    async def handle_client_message(self, conn_id: str, data: dict) -> None:
        """Process incoming messages from WebSocket clients."""
        msg_type = data.get("type")

        if msg_type == "subscribe":
            channels = data.get("channels", [])
            info = self.connections.get(conn_id)
            if info:
                info.subscriptions.update(channels)

        elif msg_type == "unsubscribe":
            channels = data.get("channels", [])
            info = self.connections.get(conn_id)
            if info:
                info.subscriptions -= set(channels)

        elif msg_type == "pong":
            info = self.connections.get(conn_id)
            if info:
                info.last_pong = datetime.now(timezone.utc)

    async def start_redis_subscriber(self) -> None:
        """Subscribe to Redis pub/sub and fan out messages to WebSocket clients."""
        pubsub = self.redis.pubsub()
        await pubsub.psubscribe("oav:ws:*")

        async for message in pubsub.listen():
            if message["type"] != "pmessage":
                continue
            channel = message["channel"]
            if isinstance(channel, bytes):
                channel = channel.decode()
            # Channel format: oav:ws:{workspace_id}
            workspace_id = channel.split(":")[-1]
            try:
                data = orjson.loads(message["data"])
                await self.broadcast_to_workspace(
                    uuid.UUID(workspace_id),
                    data,
                    event_type=data.get("event_type", "agents"),
                )
            except Exception as e:
                logger.error(f"Redis pubsub fan-out error: {e}")

    async def heartbeat_loop(self, interval: int = 30) -> None:
        """Send periodic pings to detect dead connections."""
        while True:
            await asyncio.sleep(interval)
            now = datetime.now(timezone.utc)
            dead = []
            for conn_id, info in self.connections.items():
                stale = (now - info.last_pong).total_seconds()
                if stale > interval * 3:
                    dead.append(conn_id)
                    continue
                try:
                    await self._send_json(info.websocket, {"type": "ping"})
                except Exception:
                    dead.append(conn_id)
            for conn_id in dead:
                await self.disconnect(conn_id)

    @staticmethod
    async def _send_json(ws: WebSocket, data: dict) -> None:
        await ws.send_bytes(orjson.dumps(data))
```

### 7.2 WebSocket Router

```python
# app/routers/websocket.py
import asyncio
import logging

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from app.core.redis import get_redis
from app.core.security import decode_jwt_token
from app.services.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)
router = APIRouter()

_manager: WebSocketManager | None = None


async def get_ws_manager() -> WebSocketManager:
    global _manager
    if _manager is None:
        redis = await get_redis()
        _manager = WebSocketManager(redis)
        asyncio.create_task(_manager.start_redis_subscriber())
        asyncio.create_task(_manager.heartbeat_loop())
    return _manager


@router.websocket("/ws/{workspace_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    workspace_id: str,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time agent events.
    Connect: ws://host/ws/{workspace_id}?token=jwt_access_token
    """
    # Authenticate via JWT token in query parameter
    payload = decode_jwt_token(token)
    if payload is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    from uuid import UUID
    user_id = UUID(payload["sub"])
    ws_workspace_id = UUID(workspace_id)

    manager = await get_ws_manager()
    conn_id = await manager.connect(websocket, user_id, ws_workspace_id)

    try:
        while True:
            raw = await websocket.receive_text()
            import orjson
            data = orjson.loads(raw)
            await manager.handle_client_message(conn_id, data)
    except WebSocketDisconnect:
        await manager.disconnect(conn_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(conn_id)
```

### 7.3 SSE Endpoint for Metrics

```python
# Inside app/routers/metrics.py
import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.core.redis import get_redis
from app.deps.auth import get_current_user

router = APIRouter()


@router.get("/stream")
async def metric_stream(
    workspace_id: UUID,
    agent_id: UUID | None = None,
    metrics: str = Query("tokens_rate,cost_rate,error_rate"),
    user=Depends(get_current_user),
):
    """
    SSE endpoint streaming real-time metric updates.
    Connect: GET /api/v1/metrics/stream?workspace_id=...&metrics=tokens_rate,cost_rate
    """
    metric_names = [m.strip() for m in metrics.split(",")]

    async def event_generator():
        redis = await get_redis()
        pubsub = redis.pubsub()
        channel = f"oav:metrics:{workspace_id}"
        if agent_id:
            channel = f"oav:metrics:{workspace_id}:{agent_id}"
        await pubsub.subscribe(channel)

        try:
            yield "event: connected\ndata: {}\n\n"
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                import orjson
                data = orjson.loads(message["data"])
                if data.get("metric_name") in metric_names:
                    yield f"event: metric\ndata: {orjson.dumps(data).decode()}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(channel)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

### 7.4 Redis Pub/Sub Service

```python
# app/services/redis_pubsub.py
import logging
from uuid import UUID

import orjson
from redis.asyncio import Redis

logger = logging.getLogger(__name__)


class RedisPubSub:
    """Wrapper around Redis pub/sub for event fan-out."""

    def __init__(self, redis: Redis):
        self.redis = redis

    async def publish_agent_update(
        self, workspace_id: UUID, agent_id: UUID, event_type: str, data: dict
    ) -> int:
        """Publish an agent state update to the workspace channel."""
        channel = f"oav:ws:{workspace_id}"
        message = {
            "event_type": "agents",
            "action": event_type,
            "agent_id": str(agent_id),
            "data": data,
        }
        return await self.redis.publish(channel, orjson.dumps(message))

    async def publish_alert(
        self, workspace_id: UUID, alert_data: dict
    ) -> int:
        """Publish an alert to the workspace alert channel."""
        channel = f"oav:alerts:{workspace_id}"
        return await self.redis.publish(channel, orjson.dumps(alert_data))

    async def publish_metric(
        self,
        workspace_id: UUID,
        agent_id: UUID | None,
        metric_name: str,
        value: float,
    ) -> int:
        """Publish a metric update for SSE consumers."""
        channel = f"oav:metrics:{workspace_id}"
        if agent_id:
            channel = f"oav:metrics:{workspace_id}:{agent_id}"
        message = {
            "metric_name": metric_name,
            "value": value,
            "agent_id": str(agent_id) if agent_id else None,
        }
        return await self.redis.publish(channel, orjson.dumps(message))

    async def publish_notification(
        self, workspace_id: UUID, user_id: UUID | None, notification: dict
    ) -> int:
        """Publish a notification event."""
        channel = f"oav:ws:{workspace_id}"
        message = {
            "event_type": "notifications",
            "action": "new",
            "target_user_id": str(user_id) if user_id else None,
            "data": notification,
        }
        return await self.redis.publish(channel, orjson.dumps(message))
```

---

## 8. Gamification Engine

### 8.1 XP Calculation Service

```python
# app/services/xp_service.py
import logging
import math
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.task import TaskResult
from app.models.xp import XPLedger

logger = logging.getLogger(__name__)


# Complexity tier -> base XP
COMPLEXITY_XP = {
    "trivial": 5,
    "low": 15,
    "medium": 40,
    "high": 100,
    "critical": 250,
}

# Quality score -> multiplier
QUALITY_TIERS = [
    (0.95, 2.0),   # Perfect
    (0.85, 1.5),   # Excellent
    (0.70, 1.25),  # Good
    (0.50, 1.0),   # Average
    (0.30, 0.75),  # Below Average
    (0.00, 0.5),   # Poor
]

# Streak days -> bonus multiplier
STREAK_BONUSES = [
    (30, 1.3),
    (14, 1.2),
    (7, 1.15),
    (4, 1.1),
    (2, 1.05),
    (0, 1.0),
]


class XPService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_and_award_xp(
        self,
        agent_id: UUID,
        workspace_id: UUID,
        task_result: TaskResult,
        complexity: str,
        expected_cost: float | None = None,
    ) -> dict:
        """
        Calculate XP for a completed task and write to ledger.
        Returns XP breakdown and level-up info.
        """
        agent = await self.db.get(Agent, agent_id)
        if not agent:
            raise ValueError(f"Agent not found: {agent_id}")

        # 1. Base XP from complexity
        base_xp = COMPLEXITY_XP.get(complexity, 15)

        # 2. Quality multiplier
        quality_score = float(task_result.quality_score or 0.5)
        quality_mult = self._get_quality_multiplier(quality_score)

        # 3. Difficulty modifier (check for repetition diminishing returns)
        difficulty_mod = await self._get_difficulty_modifier(
            agent_id, task_result.task_id
        )

        # 4. Streak bonus
        streak_bonus = self._get_streak_bonus(agent.streak_days)

        # 5. Efficiency XP
        efficiency_xp = 0
        if expected_cost and expected_cost > 0:
            actual_cost = float(task_result.cost_usd)
            ratio = max(0, 1 - actual_cost / expected_cost)
            efficiency_xp = int(base_xp * ratio)

        # Master formula
        total_xp = int(
            math.floor(base_xp * quality_mult * difficulty_mod * streak_bonus)
            + efficiency_xp
        )
        total_xp = max(1, total_xp)  # Minimum 1 XP

        # Write to ledger
        xp_before = agent.xp_total
        xp_after = xp_before + total_xp
        level_before = agent.level
        level_after = self._compute_level(xp_after)

        ledger_entry = XPLedger(
            agent_id=agent_id,
            workspace_id=workspace_id,
            source_type="task_completion",
            source_id=task_result.id,
            xp_amount=total_xp,
            xp_before=xp_before,
            xp_after=xp_after,
            level_before=level_before,
            level_after=level_after,
            breakdown={
                "base_xp": base_xp,
                "quality_multiplier": quality_mult,
                "difficulty_modifier": difficulty_mod,
                "streak_bonus": streak_bonus,
                "efficiency_xp": efficiency_xp,
                "complexity": complexity,
                "quality_score": quality_score,
            },
        )
        self.db.add(ledger_entry)

        # Update agent denormalized fields
        agent.xp_total = xp_after
        agent.level = level_after
        agent.tier_name = self._get_tier_name(level_after)
        agent.total_tasks += 1
        await self.db.flush()

        # Update task result XP fields
        task_result.base_xp = base_xp
        task_result.quality_multiplier = quality_mult
        task_result.difficulty_modifier = difficulty_mod
        task_result.streak_bonus = streak_bonus
        task_result.efficiency_xp = efficiency_xp
        task_result.total_xp = total_xp
        await self.db.flush()

        return {
            "base_xp": base_xp,
            "quality_multiplier": quality_mult,
            "difficulty_modifier": difficulty_mod,
            "streak_bonus": streak_bonus,
            "efficiency_xp": efficiency_xp,
            "total_xp": total_xp,
            "level_before": level_before,
            "level_after": level_after,
            "level_up": level_after > level_before,
            "tier_name": agent.tier_name,
        }

    @staticmethod
    def _get_quality_multiplier(score: float) -> float:
        for threshold, mult in QUALITY_TIERS:
            if score >= threshold:
                return mult
        return 0.5

    @staticmethod
    def _get_streak_bonus(streak_days: int) -> float:
        for threshold, bonus in STREAK_BONUSES:
            if streak_days >= threshold:
                return bonus
        return 1.0

    async def _get_difficulty_modifier(
        self, agent_id: UUID, task_id: UUID
    ) -> float:
        """Check for repetition-based diminishing returns."""
        from app.models.task import Task, TaskResult as TR
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        # Get task type for the current task
        task = await self.db.get(Task, task_id)
        if not task or not task.task_type:
            return 1.0

        # Count same-type completions today
        result = await self.db.execute(
            select(func.count())
            .select_from(TR)
            .join(Task, TR.task_id == Task.id)
            .where(
                and_(
                    TR.agent_id == agent_id,
                    Task.task_type == task.task_type,
                    TR.created_at >= today_start,
                )
            )
        )
        count = result.scalar_one()

        if count > 50:
            return 0.25
        elif count > 20:
            return 0.5
        return 1.0

    @staticmethod
    def _compute_level(total_xp: int) -> int:
        """Compute level from total XP using formula: XP_required(level) = floor(100 * level^1.8)."""
        level = 1
        cumulative = 0
        while level < 100:
            xp_for_next = int(math.floor(100 * (level ** 1.8)))
            if cumulative + xp_for_next > total_xp:
                break
            cumulative += xp_for_next
            level += 1
        return level

    @staticmethod
    def _get_tier_name(level: int) -> str:
        if level >= 90:
            return "Legend"
        elif level >= 70:
            return "Grandmaster"
        elif level >= 50:
            return "Master"
        elif level >= 30:
            return "Expert"
        elif level >= 20:
            return "Journeyman"
        elif level >= 10:
            return "Apprentice"
        return "Rookie"
```

### 8.2 Achievement Evaluation Service

```python
# app/services/achievement_service.py
import logging
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement, UserAchievement
from app.models.agent import Agent
from app.models.task import TaskResult
from app.models.xp import XPLedger

logger = logging.getLogger(__name__)


class AchievementService:
    """Evaluates achievement criteria and unlocks achievements."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_after_task(
        self, agent_id: UUID, workspace_id: UUID
    ) -> list[dict]:
        """Evaluate all achievement criteria after a task completion. Returns newly unlocked."""
        agent = await self.db.get(Agent, agent_id)
        if not agent:
            return []

        # Get already unlocked achievement IDs
        result = await self.db.execute(
            select(UserAchievement.achievement_id).where(
                UserAchievement.agent_id == agent_id
            )
        )
        unlocked_ids = {row[0] for row in result.all()}

        # Load all achievements
        result = await self.db.execute(select(Achievement))
        all_achievements = result.scalars().all()

        newly_unlocked = []
        for achievement in all_achievements:
            if achievement.id in unlocked_ids:
                continue
            if await self._check_criteria(agent, achievement):
                ua = UserAchievement(
                    agent_id=agent_id,
                    achievement_id=achievement.id,
                    progress_data={"trigger": "task_completion"},
                )
                self.db.add(ua)

                # Award XP for achievement
                from app.services.xp_service import XPService
                xp_service = XPService(self.db)
                ledger = XPLedger(
                    agent_id=agent_id,
                    workspace_id=workspace_id,
                    source_type="achievement",
                    source_id=achievement.id,
                    xp_amount=achievement.xp_reward,
                    xp_before=agent.xp_total,
                    xp_after=agent.xp_total + achievement.xp_reward,
                    level_before=agent.level,
                    level_after=xp_service._compute_level(
                        agent.xp_total + achievement.xp_reward
                    ),
                    breakdown={"achievement_name": achievement.name},
                )
                self.db.add(ledger)
                agent.xp_total += achievement.xp_reward
                agent.level = ledger.level_after

                newly_unlocked.append({
                    "id": str(achievement.id),
                    "name": achievement.name,
                    "category": achievement.category,
                    "xp_reward": achievement.xp_reward,
                    "rarity_tier": achievement.rarity_tier,
                })
                logger.info(
                    f"Achievement unlocked: {achievement.name} for agent {agent_id}"
                )

        if newly_unlocked:
            await self.db.flush()
        return newly_unlocked

    async def _check_criteria(
        self, agent: Agent, achievement: Achievement
    ) -> bool:
        """Evaluate a single achievement's criteria against current agent state."""
        criteria = achievement.criteria
        check_type = criteria.get("type")

        if check_type == "total_tasks":
            return agent.total_tasks >= criteria.get("threshold", 0)

        elif check_type == "level_reached":
            return agent.level >= criteria.get("level", 0)

        elif check_type == "streak_days":
            return agent.streak_days >= criteria.get("days", 0)

        elif check_type == "consecutive_quality":
            # Check last N tasks have quality above threshold
            n = criteria.get("count", 10)
            min_quality = criteria.get("min_quality", 0.9)
            result = await self.db.execute(
                select(TaskResult.quality_score)
                .where(TaskResult.agent_id == agent.id)
                .order_by(TaskResult.created_at.desc())
                .limit(n)
            )
            scores = [row[0] for row in result.all() if row[0] is not None]
            if len(scores) < n:
                return False
            return all(float(s) >= min_quality for s in scores)

        elif check_type == "zero_errors":
            count = criteria.get("task_count", 500)
            result = await self.db.execute(
                select(func.count())
                .select_from(TaskResult)
                .where(
                    and_(
                        TaskResult.agent_id == agent.id,
                        TaskResult.error_count == 0,
                    )
                )
            )
            return result.scalar_one() >= count

        elif check_type == "cost_saved":
            threshold = criteria.get("amount_usd", 100)
            result = await self.db.execute(
                select(func.sum(XPLedger.xp_amount))
                .where(
                    and_(
                        XPLedger.agent_id == agent.id,
                        XPLedger.source_type == "task_completion",
                    )
                )
            )
            # Approximate: use efficiency XP as a proxy
            # A more exact implementation would track cumulative savings
            return agent.xp_total > 0  # Placeholder for cost tracking

        return False
```

### 8.3 Leaderboard Computation and Caching

```python
# app/services/leaderboard_service.py
import logging
import math
from datetime import datetime, timedelta, timezone
from uuid import UUID

import orjson
from redis.asyncio import Redis
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.leaderboard import LeaderboardSnapshot
from app.models.task import TaskResult

logger = logging.getLogger(__name__)

CACHE_TTL = {
    "daily": 300,      # 5 min
    "weekly": 600,     # 10 min
    "monthly": 1800,   # 30 min
    "alltime": 3600,   # 1 hour
}


class LeaderboardService:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis

    async def get_leaderboard(
        self,
        workspace_id: UUID,
        time_window: str = "weekly",
        limit: int = 50,
    ) -> list[dict]:
        """Get leaderboard rankings, cached in Redis."""
        cache_key = f"leaderboard:{workspace_id}:{time_window}"
        cached = await self.redis.get(cache_key)
        if cached:
            return orjson.loads(cached)

        rankings = await self._compute_rankings(workspace_id, time_window, limit)

        await self.redis.setex(
            cache_key,
            CACHE_TTL.get(time_window, 600),
            orjson.dumps(rankings),
        )
        return rankings

    async def _compute_rankings(
        self,
        workspace_id: UUID,
        time_window: str,
        limit: int,
    ) -> list[dict]:
        """Compute leaderboard scores from task results."""
        now = datetime.now(timezone.utc)
        if time_window == "daily":
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_window == "weekly":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_window == "monthly":
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            period_start = datetime(2020, 1, 1, tzinfo=timezone.utc)

        # Get all active agents with their task results in the period
        agents_result = await self.db.execute(
            select(Agent).where(
                and_(Agent.workspace_id == workspace_id, Agent.is_active == True)
            )
        )
        agents = agents_result.scalars().all()

        rankings = []
        for agent in agents:
            results = await self.db.execute(
                select(TaskResult).where(
                    and_(
                        TaskResult.agent_id == agent.id,
                        TaskResult.created_at >= period_start,
                    )
                )
            )
            task_results = results.scalars().all()
            if not task_results:
                continue

            # Compute four score dimensions
            tasks_completed = len(task_results)
            quality_scores = [
                float(r.quality_score)
                for r in task_results
                if r.quality_score is not None
            ]
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.5
            total_errors = sum(r.error_count for r in task_results)
            error_rate = total_errors / tasks_completed if tasks_completed else 0

            productivity_score = min(1.0, tasks_completed / max(50, tasks_completed))
            quality_score = avg_quality
            efficiency_score = min(
                1.0,
                sum(r.efficiency_xp for r in task_results) / max(1, tasks_completed * 10),
            )
            reliability_score = max(0, 1.0 - error_rate)

            composite = (
                productivity_score * 0.30
                + quality_score * 0.30
                + efficiency_score * 0.20
                + reliability_score * 0.20
            ) * 1000

            rankings.append({
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "framework": agent.framework,
                "level": agent.level,
                "tier_name": agent.tier_name,
                "score": round(composite),
                "tasks_completed": tasks_completed,
                "avg_quality": round(avg_quality, 3),
                "efficiency_score": round(efficiency_score, 3),
                "reliability_score": round(reliability_score, 3),
                "xp_earned": sum(r.total_xp for r in task_results),
            })

        # Sort by score descending
        rankings.sort(key=lambda x: x["score"], reverse=True)

        # Add rank positions
        for i, entry in enumerate(rankings[:limit]):
            entry["rank"] = i + 1

        return rankings[:limit]

    async def save_snapshot(
        self, workspace_id: UUID, time_window: str
    ) -> None:
        """Save a leaderboard snapshot for historical tracking."""
        rankings = await self.get_leaderboard(workspace_id, time_window)
        now = datetime.now(timezone.utc)

        if time_window == "daily":
            period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=1)
        elif time_window == "weekly":
            period_start = now - timedelta(days=now.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(weeks=1)
        else:
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            period_end = (period_start + timedelta(days=32)).replace(day=1)

        snapshot = LeaderboardSnapshot(
            workspace_id=workspace_id,
            time_window=time_window,
            period_start=period_start,
            period_end=period_end,
            rankings=rankings,
        )
        self.db.add(snapshot)
        await self.db.flush()
```

### 8.4 Quest Generation and Tracking

```python
# app/services/quest_service.py
import logging
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent

logger = logging.getLogger(__name__)

DAILY_QUEST_TEMPLATES = [
    {
        "template_id": "task_burst",
        "name": "Task Burst",
        "description": "Complete {threshold} tasks today",
        "category": "productivity",
        "metric": "daily_task_count",
        "default_threshold": 10,
        "base_reward": 30,
    },
    {
        "template_id": "quality_focus",
        "name": "Quality Focus",
        "description": "Complete 3 tasks with quality score > 0.9",
        "category": "quality",
        "metric": "high_quality_count",
        "default_threshold": 3,
        "base_reward": 40,
    },
    {
        "template_id": "speed_run",
        "name": "Speed Run",
        "description": "Complete a task in under {threshold}% of average time",
        "category": "efficiency",
        "metric": "speed_percentile",
        "default_threshold": 80,
        "base_reward": 35,
    },
    {
        "template_id": "token_miser",
        "name": "Token Miser",
        "description": "Complete 5 tasks spending less than 90% of expected tokens",
        "category": "efficiency",
        "metric": "under_budget_count",
        "default_threshold": 5,
        "base_reward": 45,
    },
    {
        "template_id": "error_free_day",
        "name": "Error-Free Day",
        "description": "Complete all tasks today with zero errors",
        "category": "reliability",
        "metric": "zero_error_day",
        "default_threshold": 1,
        "base_reward": 25,
    },
    {
        "template_id": "variety_pack",
        "name": "Variety Pack",
        "description": "Complete tasks across {threshold} different categories",
        "category": "diversity",
        "metric": "task_category_count",
        "default_threshold": 3,
        "base_reward": 30,
    },
]

DAILY_COMPLETION_BONUS = 50  # Extra XP for completing all 3 dailies


class QuestService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_daily_quests(self, agent_id: UUID) -> list[dict]:
        """Generate 3 daily quests tailored to an agent's capabilities."""
        agent = await self.db.get(Agent, agent_id)
        if not agent:
            return []

        # Weighted selection favoring improvement areas
        available = list(DAILY_QUEST_TEMPLATES)
        random.shuffle(available)

        # Select 3 from different categories
        selected = []
        used_categories = set()
        for template in available:
            if template["category"] not in used_categories and len(selected) < 3:
                quest = {
                    **template,
                    "agent_id": str(agent_id),
                    "workspace_id": str(agent.workspace_id),
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "expires_at": (
                        datetime.now(timezone.utc).replace(
                            hour=23, minute=59, second=59
                        )
                    ).isoformat(),
                    "status": "active",
                    "progress": 0,
                }
                # Calibrate threshold to agent performance
                quest["threshold"] = self._calibrate_threshold(
                    template["default_threshold"],
                    agent_avg=agent.total_tasks / max(1, agent.streak_days or 1),
                    stretch_factor=1.2,
                )
                selected.append(quest)
                used_categories.add(template["category"])

        return selected

    @staticmethod
    def _calibrate_threshold(
        base: float, agent_avg: float, stretch_factor: float
    ) -> int:
        """Set quest threshold based on agent's actual performance."""
        if agent_avg <= 0:
            return int(base)
        return max(int(base * 0.5), int(agent_avg * stretch_factor))
```

---

## 9. Background Tasks

### 9.1 Celery Worker Configuration

```python
# app/workers/celery_app.py
from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "openagentvisualizer",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=4,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=60,
    task_max_retries=3,
    broker_connection_retry_on_startup=True,
    worker_concurrency=4,
)

# Auto-discover tasks
celery_app.autodiscover_tasks([
    "app.workers.tasks.gamification",
    "app.workers.tasks.alerting",
    "app.workers.tasks.metrics",
    "app.workers.tasks.cleanup",
    "app.workers.tasks.reports",
])
```

### 9.2 Beat Schedule

```python
# app/workers/beat_schedule.py
from celery.schedules import crontab

from app.workers.celery_app import celery_app

celery_app.conf.beat_schedule = {
    # Gamification
    "generate-daily-quests": {
        "task": "app.workers.tasks.gamification.generate_all_daily_quests",
        "schedule": crontab(minute=0, hour=0),  # 00:00 UTC daily
    },
    "compute-daily-leaderboard": {
        "task": "app.workers.tasks.gamification.compute_leaderboard_snapshot",
        "schedule": crontab(minute=5, hour=0),  # 00:05 UTC daily
        "args": ("daily",),
    },
    "compute-weekly-leaderboard": {
        "task": "app.workers.tasks.gamification.compute_leaderboard_snapshot",
        "schedule": crontab(minute=10, hour=0, day_of_week=1),  # Monday 00:10 UTC
        "args": ("weekly",),
    },
    "compute-monthly-leaderboard": {
        "task": "app.workers.tasks.gamification.compute_leaderboard_snapshot",
        "schedule": crontab(minute=15, hour=0, day_of_month=1),  # 1st of month
        "args": ("monthly",),
    },
    "distribute-weekly-bonus": {
        "task": "app.workers.tasks.gamification.distribute_weekly_bonus",
        "schedule": crontab(minute=30, hour=0, day_of_week=1),  # Monday 00:30 UTC
    },
    "update-achievement-rarity": {
        "task": "app.workers.tasks.gamification.update_achievement_rarity",
        "schedule": crontab(minute=0, hour=1),  # 01:00 UTC daily
    },

    # Alerting
    "evaluate-alert-rules": {
        "task": "app.workers.tasks.alerting.evaluate_all_alert_rules",
        "schedule": 60.0,  # Every 60 seconds
    },

    # Metrics
    "refresh-agent-summaries": {
        "task": "app.workers.tasks.metrics.refresh_agent_daily_summaries",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },

    # Cleanup
    "data-retention-cleanup": {
        "task": "app.workers.tasks.cleanup.enforce_retention_policies",
        "schedule": crontab(minute=0, hour=3),  # 03:00 UTC daily
    },
    "detect-stale-agents": {
        "task": "app.workers.tasks.cleanup.detect_stale_agents",
        "schedule": crontab(minute="*/10"),  # Every 10 minutes
    },
}
```

### 9.3 Gamification Celery Tasks

```python
# app/workers/tasks/gamification.py
import logging
from uuid import UUID

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def generate_all_daily_quests(self):
    """Generate daily quests for all active agents across all workspaces."""
    import asyncio
    asyncio.run(_generate_all_daily_quests())


async def _generate_all_daily_quests():
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.agent import Agent
    from app.services.quest_service import QuestService

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Agent).where(Agent.is_active == True)
        )
        agents = result.scalars().all()
        service = QuestService(db)

        for agent in agents:
            quests = await service.generate_daily_quests(agent.id)
            logger.info(f"Generated {len(quests)} daily quests for agent {agent.id}")
            # Store quests in Redis for fast access
            from app.core.redis import get_redis_sync
            import orjson
            redis = await get_redis_sync()
            key = f"quests:daily:{agent.id}"
            await redis.setex(key, 86400, orjson.dumps(quests))

        await db.commit()
    logger.info(f"Daily quest generation complete for {len(agents)} agents")


@celery_app.task(bind=True, max_retries=3)
def compute_leaderboard_snapshot(self, time_window: str):
    """Compute and save leaderboard snapshot."""
    import asyncio
    asyncio.run(_compute_leaderboard_snapshot(time_window))


async def _compute_leaderboard_snapshot(time_window: str):
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.core.redis import get_redis_sync
    from app.models.workspace import Workspace
    from app.services.leaderboard_service import LeaderboardService

    async with AsyncSessionLocal() as db:
        redis = await get_redis_sync()
        result = await db.execute(select(Workspace))
        workspaces = result.scalars().all()

        for ws in workspaces:
            service = LeaderboardService(db, redis)
            await service.save_snapshot(ws.id, time_window)
            logger.info(f"Leaderboard snapshot saved: {ws.slug} / {time_window}")

        await db.commit()


@celery_app.task(bind=True, max_retries=3)
def distribute_weekly_bonus(self):
    """Distribute weekly XP bonus pool every Monday."""
    import asyncio
    asyncio.run(_distribute_weekly_bonus())


async def _distribute_weekly_bonus():
    from sqlalchemy import select, func
    from app.core.database import AsyncSessionLocal
    from app.models.agent import Agent
    from app.models.xp import XPLedger
    from app.services.xp_service import XPService
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Agent).where(Agent.is_active == True)
        )
        agents = result.scalars().all()

        for agent in agents:
            # Get total XP earned this week
            xp_result = await db.execute(
                select(func.sum(XPLedger.xp_amount)).where(
                    XPLedger.agent_id == agent.id,
                    XPLedger.created_at >= week_start,
                )
            )
            weekly_xp = xp_result.scalar_one() or 0

            if weekly_xp <= 0:
                continue

            # 10% bonus
            bonus = int(weekly_xp * 0.1)
            if bonus < 1:
                continue

            xp_service = XPService(db)
            ledger = XPLedger(
                agent_id=agent.id,
                workspace_id=agent.workspace_id,
                source_type="weekly_bonus",
                xp_amount=bonus,
                xp_before=agent.xp_total,
                xp_after=agent.xp_total + bonus,
                level_before=agent.level,
                level_after=xp_service._compute_level(agent.xp_total + bonus),
                breakdown={"weekly_xp": weekly_xp, "bonus_rate": 0.1},
            )
            db.add(ledger)
            agent.xp_total += bonus
            agent.level = ledger.level_after

        await db.commit()
    logger.info(f"Weekly bonus distributed to {len(agents)} agents")


@celery_app.task
def update_achievement_rarity():
    """Update achievement rarity percentages based on platform-wide data."""
    import asyncio
    asyncio.run(_update_achievement_rarity())


async def _update_achievement_rarity():
    from sqlalchemy import select, func
    from app.core.database import AsyncSessionLocal
    from app.models.achievement import Achievement, UserAchievement
    from app.models.agent import Agent

    async with AsyncSessionLocal() as db:
        total_agents = await db.scalar(
            select(func.count()).select_from(Agent).where(Agent.is_active == True)
        )
        if total_agents == 0:
            return

        achievements = (await db.execute(select(Achievement))).scalars().all()
        for ach in achievements:
            unlocked_count = await db.scalar(
                select(func.count())
                .select_from(UserAchievement)
                .where(UserAchievement.achievement_id == ach.id)
            )
            pct = (unlocked_count / total_agents) * 100
            # Update rarity tier based on actual unlock rate
            if pct >= 60:
                ach.rarity_tier = "common"
            elif pct >= 30:
                ach.rarity_tier = "uncommon"
            elif pct >= 10:
                ach.rarity_tier = "rare"
            elif pct >= 3:
                ach.rarity_tier = "epic"
            else:
                ach.rarity_tier = "legendary"

        await db.commit()
    logger.info("Achievement rarity tiers updated")
```

### 9.4 Alert Evaluation Tasks

```python
# app/workers/tasks/alerting.py
import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=2)
def evaluate_all_alert_rules(self):
    """Evaluate all enabled alert rules across all workspaces."""
    import asyncio
    asyncio.run(_evaluate_all_alert_rules())


async def _evaluate_all_alert_rules():
    from sqlalchemy import select, and_
    from datetime import datetime, timedelta, timezone
    from app.core.database import AsyncSessionLocal
    from app.core.redis import get_redis_sync
    from app.models.alert import AlertRule, Alert
    from app.models.agent import Agent
    from app.services.redis_pubsub import RedisPubSub

    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as db:
        redis = await get_redis_sync()
        pubsub_service = RedisPubSub(redis)

        result = await db.execute(
            select(AlertRule).where(AlertRule.is_enabled == True)
        )
        rules = result.scalars().all()

        for rule in rules:
            # Check cooldown
            cooldown_key = f"alert_cooldown:{rule.id}"
            if await redis.exists(cooldown_key):
                continue

            try:
                fired = await _evaluate_rule(db, rule, now)
                if fired:
                    alert = Alert(
                        workspace_id=rule.workspace_id,
                        rule_id=rule.id,
                        agent_id=fired.get("agent_id"),
                        alert_type=rule.rule_type,
                        severity=rule.severity,
                        title=fired["title"],
                        description=fired.get("description"),
                        alert_data=fired["data"],
                    )
                    db.add(alert)
                    await db.flush()

                    # Set cooldown
                    await redis.setex(
                        cooldown_key,
                        rule.cooldown_minutes * 60,
                        "1",
                    )

                    # Publish alert via pub/sub
                    await pubsub_service.publish_alert(
                        rule.workspace_id,
                        {
                            "alert_id": str(alert.id),
                            "severity": alert.severity,
                            "title": alert.title,
                        },
                    )
                    logger.warning(
                        f"Alert fired: {alert.title} (rule={rule.name})"
                    )
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.id}: {e}")

        await db.commit()


async def _evaluate_rule(db, rule, now):
    """Evaluate a single alert rule. Returns dict if fired, None otherwise."""
    conditions = rule.conditions
    rule_type = rule.rule_type

    if rule_type == "agent_offline":
        threshold_minutes = conditions.get("threshold_minutes", 5)
        from sqlalchemy import select, and_
        from datetime import timedelta
        from app.models.agent import Agent
        cutoff = now - timedelta(minutes=threshold_minutes)

        result = await db.execute(
            select(Agent).where(
                and_(
                    Agent.workspace_id == rule.workspace_id,
                    Agent.is_active == True,
                    Agent.current_state != "terminated",
                    Agent.last_heartbeat < cutoff,
                )
            )
        )
        stale_agents = result.scalars().all()
        if stale_agents:
            names = [a.name for a in stale_agents[:5]]
            return {
                "title": f"{len(stale_agents)} agent(s) offline for >{threshold_minutes}min",
                "description": f"Agents: {', '.join(names)}",
                "agent_id": stale_agents[0].id if len(stale_agents) == 1 else None,
                "data": {
                    "agent_ids": [str(a.id) for a in stale_agents],
                    "threshold_minutes": threshold_minutes,
                },
            }

    elif rule_type == "error_rate":
        # Check error rate over the configured window
        threshold = conditions.get("threshold", 0.1)
        window_minutes = conditions.get("window_minutes", 15)
        from sqlalchemy import select, func, and_
        from datetime import timedelta
        from app.models.task import TaskResult
        cutoff = now - timedelta(minutes=window_minutes)

        total = await db.scalar(
            select(func.count())
            .select_from(TaskResult)
            .join(
                from_clause=None  # placeholder
            )
            .where(TaskResult.created_at >= cutoff)
        )
        if total and total > 0:
            errors = await db.scalar(
                select(func.count())
                .select_from(TaskResult)
                .where(
                    and_(
                        TaskResult.created_at >= cutoff,
                        TaskResult.error_count > 0,
                    )
                )
            )
            rate = (errors or 0) / total
            if rate > threshold:
                return {
                    "title": f"Error rate {rate:.1%} exceeds threshold {threshold:.1%}",
                    "data": {"error_rate": rate, "threshold": threshold, "window_minutes": window_minutes},
                }

    elif rule_type == "cost_threshold":
        from sqlalchemy import select, func
        from datetime import timedelta
        from app.models.task import TaskResult
        threshold_usd = conditions.get("threshold_usd", 100)
        window_hours = conditions.get("window_hours", 24)
        cutoff = now - timedelta(hours=window_hours)

        total_cost = await db.scalar(
            select(func.sum(TaskResult.cost_usd)).where(
                TaskResult.created_at >= cutoff
            )
        )
        if total_cost and float(total_cost) > threshold_usd:
            return {
                "title": f"Cost ${float(total_cost):.2f} exceeds ${threshold_usd:.2f} in {window_hours}h",
                "data": {"total_cost": float(total_cost), "threshold": threshold_usd},
            }

    return None
```

### 9.5 Data Retention and Cleanup

```python
# app/workers/tasks/cleanup.py
import logging
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def enforce_retention_policies():
    """Drop old TimescaleDB chunks based on retention settings."""
    import asyncio
    asyncio.run(_enforce_retention())


async def _enforce_retention():
    from app.core.database import engine
    from app.core.config import get_settings
    settings = get_settings()

    async with engine.begin() as conn:
        # Events retention
        await conn.execute(
            f"SELECT drop_chunks('events', older_than => INTERVAL '{settings.RETENTION_EVENTS_DAYS} days');"
        )
        await conn.execute(
            f"SELECT drop_chunks('spans', older_than => INTERVAL '{settings.RETENTION_SPANS_DAYS} days');"
        )
        await conn.execute(
            f"SELECT drop_chunks('metrics_raw', older_than => INTERVAL '{settings.RETENTION_METRICS_RAW_DAYS} days');"
        )
        await conn.execute(
            f"SELECT drop_chunks('audit_log', older_than => INTERVAL '{settings.RETENTION_AUDIT_LOG_DAYS} days');"
        )

    logger.info("Retention policies enforced successfully")


@celery_app.task
def detect_stale_agents():
    """Detect agents that missed heartbeats and mark them as potentially offline."""
    import asyncio
    asyncio.run(_detect_stale_agents())


async def _detect_stale_agents():
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import select, and_
    from app.core.database import AsyncSessionLocal
    from app.core.redis import get_redis_sync
    from app.models.agent import Agent
    from app.services.redis_pubsub import RedisPubSub

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=2)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Agent).where(
                and_(
                    Agent.is_active == True,
                    Agent.current_state.in_(["idle", "working"]),
                    Agent.last_heartbeat < cutoff,
                    Agent.last_heartbeat.isnot(None),
                )
            )
        )
        stale = result.scalars().all()

        redis = await get_redis_sync()
        pubsub = RedisPubSub(redis)

        for agent in stale:
            # Update cached state
            await redis.hset(
                f"agent_state:{agent.id}",
                mapping={"state": "offline_suspected", "since": cutoff.isoformat()},
            )
            await pubsub.publish_agent_update(
                agent.workspace_id,
                agent.id,
                "heartbeat_missed",
                {"agent_name": agent.name, "last_heartbeat": agent.last_heartbeat.isoformat()},
            )

        if stale:
            logger.warning(f"Detected {len(stale)} stale agents")
```

### 9.6 Persist Writer (Redis Streams Consumer)

```python
# app/workers/persist_writer.py
"""
Standalone process: Consumes events from Redis Streams and writes to TimescaleDB.
Run with: python -m app.workers.persist_writer
"""
import asyncio
import logging
import signal
from uuid import UUID

import orjson
from redis.asyncio import Redis

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.core.redis import init_redis, get_redis
from app.models.event import Event
from app.models.span import Span

logger = logging.getLogger(__name__)
settings = get_settings()

CONSUMER_GROUP = "persist_writers"
CONSUMER_NAME = "writer_1"
BATCH_SIZE = 100
BLOCK_MS = 5000
STREAM_PATTERN = "oav:events:*"


class PersistWriter:
    def __init__(self):
        self.running = True

    async def run(self):
        await init_redis()
        redis = await get_redis()

        # Create consumer group if not exists
        # In production, discover streams dynamically
        try:
            await redis.xgroup_create(
                "oav:events:default", CONSUMER_GROUP, id="0", mkstream=True
            )
        except Exception:
            pass  # Group already exists

        logger.info("Persist Writer started")

        while self.running:
            try:
                messages = await redis.xreadgroup(
                    CONSUMER_GROUP,
                    CONSUMER_NAME,
                    {"oav:events:default": ">"},
                    count=BATCH_SIZE,
                    block=BLOCK_MS,
                )

                if not messages:
                    continue

                async with AsyncSessionLocal() as db:
                    for stream_name, stream_messages in messages:
                        for msg_id, fields in stream_messages:
                            try:
                                data = orjson.loads(fields[b"data"])
                                await self._write_event(db, data)
                                await redis.xack(
                                    stream_name, CONSUMER_GROUP, msg_id
                                )
                            except Exception as e:
                                logger.error(f"Failed to persist event: {e}")

                    await db.commit()

            except Exception as e:
                logger.error(f"Persist Writer error: {e}")
                await asyncio.sleep(1)

    async def _write_event(self, db, data: dict):
        """Write a single normalized event to the appropriate table."""
        if "operation_name" in data:
            # It is a span
            span = Span(
                workspace_id=UUID(data["workspace_id"]),
                agent_id=UUID(data.get("agent_id", "00000000-0000-0000-0000-000000000000")),
                session_id=UUID(data["session_id"]) if data.get("session_id") else None,
                trace_id=data["trace_id"],
                span_id=data["span_id"],
                parent_span_id=data.get("parent_span_id"),
                operation_name=data["operation_name"],
                span_kind=data.get("span_kind", "internal"),
                status_code=data.get("status_code", "ok"),
                status_message=data.get("status_message"),
                start_time=data["start_time"],
                end_time=data.get("end_time"),
                duration_ms=data.get("duration_ms"),
                model=data.get("model"),
                input_tokens=data.get("input_tokens"),
                output_tokens=data.get("output_tokens"),
                cost_usd=data.get("cost_usd"),
                temperature=data.get("temperature"),
                attributes=data.get("attributes", {}),
                events_data=data.get("span_events"),
            )
            db.add(span)
        else:
            # It is an event
            event = Event(
                workspace_id=UUID(data["workspace_id"]),
                agent_id=UUID(data.get("agent_id", "00000000-0000-0000-0000-000000000000")),
                session_id=UUID(data["session_id"]) if data.get("session_id") else None,
                trace_id=data.get("trace_id", ""),
                span_id=data.get("span_id", ""),
                parent_span_id=data.get("parent_span_id"),
                event_type=data.get("event_type", "unknown"),
                event_action=data.get("event_action"),
                severity=data.get("severity", "info"),
                event_data=data.get("event_data", {}),
                resource_attrs=data.get("resource_attrs"),
                span_attrs=data.get("span_attrs"),
            )
            db.add(event)

    def stop(self):
        self.running = False


async def main():
    writer = PersistWriter()
    loop = asyncio.get_event_loop()
    loop.add_signal_handler(signal.SIGTERM, writer.stop)
    loop.add_signal_handler(signal.SIGINT, writer.stop)
    await writer.run()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
```

---

## 10. Testing Strategy

### 10.1 pytest Configuration

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = -v --tb=short --strict-markers -x
markers =
    unit: Unit tests (no external dependencies)
    integration: Integration tests (require database/redis)
    slow: Slow tests (>5s)
```

### 10.2 Test Configuration and Fixtures

```python
# tests/conftest.py
import asyncio
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, generate_api_key
from app.main import create_app
from app.models import Base
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.api_key import APIKey


def get_test_settings() -> Settings:
    return Settings(
        DATABASE_HOST="localhost",
        DATABASE_PORT=5433,
        DATABASE_USER="test_oav",
        DATABASE_PASSWORD="test_password",
        DATABASE_NAME="test_openagentvisualizer",
        REDIS_HOST="localhost",
        REDIS_PORT=6380,
        REDIS_DB=15,
        JWT_SECRET_KEY="test_secret_key_for_jwt_signing",
        DEBUG=True,
        ENVIRONMENT="test",
    )


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    settings = get_test_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_settings] = get_test_settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        password_hash=hash_password("testpassword123"),
        display_name="Test User",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def test_workspace(db_session: AsyncSession, test_user: User) -> Workspace:
    workspace = Workspace(
        id=uuid.uuid4(),
        name="Test Workspace",
        slug=f"test-ws-{uuid.uuid4().hex[:8]}",
        owner_id=test_user.id,
        tier="pro",
        gamification_enabled=True,
    )
    db_session.add(workspace)

    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=test_user.id,
        role="owner",
    )
    db_session.add(member)
    await db_session.flush()
    return workspace


@pytest_asyncio.fixture
async def test_api_key(
    db_session: AsyncSession, test_user: User, test_workspace: Workspace
) -> tuple[str, APIKey]:
    raw_key, key_hash = generate_api_key("oav_test_")
    api_key = APIKey(
        workspace_id=test_workspace.id,
        created_by=test_user.id,
        name="Test Key",
        key_prefix="oav_test_",
        key_hash=key_hash,
        scopes=["ingest", "read", "write"],
    )
    db_session.add(api_key)
    await db_session.flush()
    return raw_key, api_key


@pytest_asyncio.fixture
def auth_headers(test_user: User) -> dict:
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
def api_key_headers(test_api_key: tuple[str, APIKey]) -> dict:
    raw_key, _ = test_api_key
    return {"Authorization": f"Bearer {raw_key}"}
```

### 10.3 Factory Boy Factories

```python
# tests/factories.py
import uuid
from datetime import datetime, timezone

import factory
from factory import LazyFunction, Sequence

from app.models.agent import Agent
from app.models.task import Task, TaskResult
from app.models.user import User
from app.models.workspace import Workspace


class UserFactory(factory.Factory):
    class Meta:
        model = User

    id = LazyFunction(uuid.uuid4)
    email = Sequence(lambda n: f"user{n}@example.com")
    password_hash = "$2b$12$test_hash_placeholder"
    display_name = Sequence(lambda n: f"User {n}")
    is_active = True
    is_verified = True


class WorkspaceFactory(factory.Factory):
    class Meta:
        model = Workspace

    id = LazyFunction(uuid.uuid4)
    name = Sequence(lambda n: f"Workspace {n}")
    slug = Sequence(lambda n: f"workspace-{n}")
    tier = "pro"
    gamification_enabled = True


class AgentFactory(factory.Factory):
    class Meta:
        model = Agent

    id = LazyFunction(uuid.uuid4)
    agent_external_id = Sequence(lambda n: f"agent-ext-{n}")
    name = Sequence(lambda n: f"Agent {n}")
    role = "researcher"
    framework = "langchain"
    model = "gpt-4o"
    current_state = "idle"
    xp_total = 0
    level = 1
    tier_name = "Rookie"


class TaskFactory(factory.Factory):
    class Meta:
        model = Task

    id = LazyFunction(uuid.uuid4)
    title = Sequence(lambda n: f"Task {n}")
    task_type = "data_extraction"
    priority = "medium"
    complexity = "medium"
    status = "pending"
```

### 10.4 API Endpoint Tests

```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "securepassword123",
        "display_name": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert "tokens" in data
    assert data["tokens"]["token_type"] == "Bearer"
    assert data["user"]["email"] == "newuser@example.com"
    assert "api_key" in data
    assert data["api_key"]["key"].startswith("oav_live_")


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    response = await client.post("/api/v1/auth/register", json={
        "email": test_user.email,
        "password": "somepassword123",
        "display_name": "Duplicate",
    })
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "tokens" in data
    assert data["tokens"]["expires_in"] == 900


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, test_user):
    # Login first
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123",
    })
    refresh_token = login_resp.json()["tokens"]["refresh_token"]

    # Refresh
    response = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
```

```python
# tests/test_agents.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_agent(client: AsyncClient, api_key_headers, test_workspace):
    response = await client.post(
        "/api/v1/agents",
        json={
            "agent_external_id": "research-agent-001",
            "name": "Research Agent",
            "role": "researcher",
            "framework": "langchain",
            "model": "gpt-4o",
            "capabilities": ["web_search", "document_analysis"],
        },
        headers=api_key_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Research Agent"
    assert data["framework"] == "langchain"
    assert data["current_state"] == "idle"
    assert data["xp_total"] == 0
    assert data["level"] == 1
    assert data["tier_name"] == "Rookie"


@pytest.mark.asyncio
async def test_list_agents(client: AsyncClient, auth_headers, test_workspace):
    response = await client.get(
        f"/api/v1/agents?workspace_id={test_workspace.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_agent_heartbeat(client: AsyncClient, api_key_headers, test_workspace):
    # Register agent first
    reg_resp = await client.post(
        "/api/v1/agents",
        json={
            "agent_external_id": "heartbeat-test-001",
            "name": "Heartbeat Agent",
            "framework": "crewai",
        },
        headers=api_key_headers,
    )
    agent_id = reg_resp.json()["id"]

    # Send heartbeat
    response = await client.post(
        f"/api/v1/agents/{agent_id}/heartbeat",
        json={
            "state": "working",
            "metrics": {"tokens_used": 1500, "cost_usd": 0.045},
        },
        headers=api_key_headers,
    )
    assert response.status_code == 200
    assert response.json()["acknowledged"] is True
```

### 10.5 Gamification Tests

```python
# tests/test_gamification.py
import pytest
import math
from app.services.xp_service import XPService, COMPLEXITY_XP


class TestXPCalculation:
    """Unit tests for XP formula calculations (no DB required)."""

    def test_quality_multiplier_perfect(self):
        mult = XPService._get_quality_multiplier(0.97)
        assert mult == 2.0

    def test_quality_multiplier_poor(self):
        mult = XPService._get_quality_multiplier(0.2)
        assert mult == 0.5

    def test_quality_multiplier_average(self):
        mult = XPService._get_quality_multiplier(0.65)
        assert mult == 1.0

    def test_streak_bonus_30_days(self):
        bonus = XPService._get_streak_bonus(30)
        assert bonus == 1.3

    def test_streak_bonus_no_streak(self):
        bonus = XPService._get_streak_bonus(1)
        assert bonus == 1.0

    def test_level_calculation(self):
        # Level 1 requires 0 cumulative XP
        assert XPService._compute_level(0) == 1
        # Level 2 requires 100 XP
        assert XPService._compute_level(100) == 2
        # Very high XP should give high level
        assert XPService._compute_level(7_000_000) >= 95

    def test_tier_names(self):
        assert XPService._get_tier_name(1) == "Rookie"
        assert XPService._get_tier_name(10) == "Apprentice"
        assert XPService._get_tier_name(20) == "Journeyman"
        assert XPService._get_tier_name(30) == "Expert"
        assert XPService._get_tier_name(50) == "Master"
        assert XPService._get_tier_name(70) == "Grandmaster"
        assert XPService._get_tier_name(90) == "Legend"

    def test_complexity_xp_values(self):
        assert COMPLEXITY_XP["trivial"] == 5
        assert COMPLEXITY_XP["medium"] == 40
        assert COMPLEXITY_XP["critical"] == 250

    def test_worked_example_standard_task(self):
        """Verify worked example 1 from Gamification System Design."""
        base = 40
        quality_mult = 1.25
        difficulty_mod = 1.0
        streak_bonus = 1.05
        efficiency_xp = int(40 * (1 - 0.05 / 0.08))  # 15

        total = math.floor(base * quality_mult * difficulty_mod * streak_bonus) + efficiency_xp
        assert total == 67  # Matches the spec

    def test_worked_example_critical_task(self):
        """Verify worked example 2 from Gamification System Design."""
        base = 250
        quality_mult = 2.0
        difficulty_mod = 1.3
        streak_bonus = 1.15
        efficiency_xp = int(250 * (1 - 0.45 / 0.60))  # 62

        total = math.floor(base * quality_mult * difficulty_mod * streak_bonus) + efficiency_xp
        assert total == 809  # Matches the spec
```

### 10.6 WebSocket Tests

```python
# tests/test_websocket.py
import pytest
from httpx import ASGITransport, AsyncClient
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import create_app


@pytest.mark.asyncio
async def test_websocket_connect_with_valid_token(test_user, test_workspace):
    app = create_app()
    token = create_access_token(test_user.id)

    with TestClient(app) as client:
        with client.websocket_connect(
            f"/ws/{test_workspace.id}?token={token}"
        ) as ws:
            data = ws.receive_json()
            assert data["type"] == "connected"
            assert "connection_id" in data


@pytest.mark.asyncio
async def test_websocket_reject_invalid_token(test_workspace):
    app = create_app()

    with TestClient(app) as client:
        with pytest.raises(Exception):
            with client.websocket_connect(
                f"/ws/{test_workspace.id}?token=invalid_token"
            ) as ws:
                pass


@pytest.mark.asyncio
async def test_websocket_subscribe_unsubscribe(test_user, test_workspace):
    app = create_app()
    token = create_access_token(test_user.id)

    with TestClient(app) as client:
        with client.websocket_connect(
            f"/ws/{test_workspace.id}?token={token}"
        ) as ws:
            # Receive connected message
            ws.receive_json()

            # Subscribe to alerts
            ws.send_json({"type": "subscribe", "channels": ["alerts", "metrics"]})

            # Unsubscribe from metrics
            ws.send_json({"type": "unsubscribe", "channels": ["metrics"]})
```

### 10.7 Integration Tests

```python
# tests/test_integration.py
import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.integration
async def test_full_agent_lifecycle(
    client: AsyncClient, auth_headers, api_key_headers, test_workspace
):
    """End-to-end test: register agent -> create task -> submit result -> check XP."""

    # 1. Register agent
    agent_resp = await client.post("/api/v1/agents", json={
        "agent_external_id": f"lifecycle-test-{uuid.uuid4().hex[:8]}",
        "name": "Lifecycle Test Agent",
        "framework": "langchain",
        "model": "gpt-4o",
    }, headers=api_key_headers)
    assert agent_resp.status_code == 201
    agent_id = agent_resp.json()["id"]

    # 2. Create task
    task_resp = await client.post("/api/v1/tasks", json={
        "title": "Analyze competitor pricing",
        "task_type": "research",
        "priority": "high",
        "assigned_agent_id": agent_id,
    }, headers=auth_headers)
    assert task_resp.status_code == 201
    task_id = task_resp.json()["id"]

    # 3. Update agent state to working
    state_resp = await client.post(f"/api/v1/agents/{agent_id}/state", json={
        "new_state": "working",
        "trigger": "task_assigned",
    }, headers=api_key_headers)
    assert state_resp.status_code == 200

    # 4. Submit task result
    result_resp = await client.post(f"/api/v1/tasks/{task_id}/result", json={
        "agent_id": agent_id,
        "tokens_used": 2500,
        "cost_usd": 0.075,
        "duration_ms": 12000,
        "quality_score": 0.85,
        "error_count": 0,
        "retry_count": 0,
    }, headers=api_key_headers)
    assert result_resp.status_code == 200
    xp_data = result_resp.json()["xp_awarded"]
    assert xp_data["total_xp"] > 0
    assert xp_data["base_xp"] > 0

    # 5. Verify agent XP was updated
    agent_detail = await client.get(
        f"/api/v1/agents/{agent_id}", headers=auth_headers
    )
    assert agent_detail.status_code == 200
    assert agent_detail.json()["xp_total"] > 0
    assert agent_detail.json()["total_tasks"] == 1


@pytest.mark.asyncio
@pytest.mark.integration
async def test_bulk_event_ingestion(
    client: AsyncClient, api_key_headers, test_workspace
):
    """Test bulk ingestion of events and spans."""
    response = await client.post("/api/v1/traces/ingest", json={
        "events": [
            {
                "event_type": "agent.task.started",
                "agent_id": str(uuid.uuid4()),
                "trace_id": uuid.uuid4().hex,
                "span_id": uuid.uuid4().hex[:16],
                "event_data": {"task_name": "research"},
            },
            {
                "event_type": "agent.llm.request",
                "agent_id": str(uuid.uuid4()),
                "trace_id": uuid.uuid4().hex,
                "span_id": uuid.uuid4().hex[:16],
                "event_data": {"model": "gpt-4o", "tokens": 500},
            },
        ],
        "spans": [
            {
                "trace_id": uuid.uuid4().hex,
                "span_id": uuid.uuid4().hex[:16],
                "operation_name": "llm.chat",
                "span_kind": "client",
                "start_time": "2026-03-16T10:00:00Z",
                "end_time": "2026-03-16T10:00:05Z",
                "attributes": {"gen_ai.request.model": "gpt-4o"},
            },
        ],
    }, headers=api_key_headers)

    assert response.status_code == 202
    data = response.json()
    assert data["accepted"] is True
    assert data["events_count"] == 2
    assert data["spans_count"] == 1
```
