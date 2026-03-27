from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.database import engine, Base, AsyncSessionLocal
from app.core.redis_client import get_redis, close_redis
from app.core.security import hash_password
from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.correlation import CorrelationIDMiddleware

# Import all models so Base.metadata is populated before create_all
from app.models.user import User, Workspace, WorkspaceMember  # noqa: F401
from app.models.agent import Agent, Task  # noqa: F401
from app.models.event import Event, Span, AgentSession  # noqa: F401
from app.models.gamification import XPTransaction, Alert  # noqa: F401
from app.models.metrics import MetricsRaw, MetricsAgg  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.achievement import Achievement  # noqa: F401
from app.models.integration import IntegrationConfig  # noqa: F401

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
    # Cleanup
    await close_redis()


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
