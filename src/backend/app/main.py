from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import uuid

from app.core.database import engine, Base, AsyncSessionLocal, get_db
from app.core.redis_client import get_redis, close_redis
from app.core.security import hash_password
from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.correlation import CorrelationIDMiddleware
from app.core.rate_limiter import limiter

# Import all models so Base.metadata is populated before create_all
from app.models.user import User, Workspace, WorkspaceMember  # noqa: F401
from app.models.agent import Agent, Task  # noqa: F401
from app.models.event import Event, Span, AgentSession  # noqa: F401
from app.models.gamification import XPTransaction, Alert  # noqa: F401
from app.models.metrics import MetricsRaw, MetricsAgg  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.achievement import Achievement  # noqa: F401
from app.models.integration import IntegrationConfig  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.invite import WorkspaceInvite  # noqa: F401
from app.models.activity import ActivityFeed  # noqa: F401

from app.routers import (
    auth,
    agents,
    events,
    otlp_receiver,
    sessions,
    metrics,
    alerts,
    gamification,
)
from app.routers import websocket as ws_router
from app.routers.spans import router as spans_router
from app.routers import integrations as integrations_router
from app.routers import ue5_websocket
from app.routers import admin as admin_router
from app.services.websocket_manager import manager as ws_manager
from app.core.logging import get_logger

_logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # Initialize DB tables (Alembic handles production; create_all for dev/test)
    async with engine.begin() as conn:
        await conn.run_sync(lambda c: Base.metadata.create_all(c, checkfirst=True))
    # Warm up Redis pool (fixes race condition — single init here, not lazy)
    await get_redis()
    # Seed default user and workspace
    await seed_default_user()
    yield
    # Shutdown
    _logger.info("shutdown.initiated", event="graceful_shutdown_start")
    await ws_manager.close_all()
    _logger.info("shutdown.websockets_drained", event="websocket_connections_closed")
    await close_redis()
    _logger.info("shutdown.complete", event="graceful_shutdown_complete")


async def seed_default_user() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.email == settings.SEED_EMAIL))
        if existing:
            return
        user = User(
            email=settings.SEED_EMAIL,
            hashed_password=hash_password(settings.SEED_PASSWORD),
        )
        ws = Workspace(name="Default Workspace", slug=f"default-{uuid.uuid4().hex[:6]}")
        member = WorkspaceMember(workspace=ws, user=user, role="owner")
        db.add_all([user, ws, member])
        await db.commit()


app = FastAPI(title="OpenAgentVisualizer API", version="3.0.0", lifespan=lifespan)

app.state.limiter = limiter

from slowapi import _rate_limit_exceeded_handler  # noqa: E402
from slowapi.errors import RateLimitExceeded  # noqa: E402

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CorrelationIDMiddleware)

# ---- Prometheus metrics instrumentation ----
# The /metrics endpoint is exposed without JWT auth (standard Prometheus scrape pattern).
# excluded_handlers prevents the /metrics endpoint from being tracked in HTTP counters,
# which would cause infinite recursion on scrape.
from prometheus_fastapi_instrumentator import Instrumentator  # noqa: E402

_instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    excluded_handlers=["/metrics", "/api/health"],
)
_instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/health/live", tags=["health"])
async def liveness() -> dict:
    """Liveness probe — returns 200 if process is running."""
    return {"status": "alive"}


@app.get("/api/health/ready", tags=["health"])
async def readiness(db: AsyncSession = Depends(get_db)):
    """Readiness probe — checks all dependencies (postgres + redis)."""
    checks: dict[str, str] = {}

    # PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = f"error: {exc}"

    # Redis
    try:
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    status_code = 200 if all_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={"status": "ready" if all_ok else "degraded", "checks": checks},
    )


app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(events.router)
app.include_router(otlp_receiver.router)
app.include_router(ws_router.router)
app.include_router(sessions.router)
app.include_router(metrics.router)
app.include_router(alerts.router)
app.include_router(gamification.router)
app.include_router(spans_router)
app.include_router(integrations_router.router)
app.include_router(ue5_websocket.router)
app.include_router(admin_router.router)
