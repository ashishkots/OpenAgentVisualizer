from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.database import engine, Base, AsyncSessionLocal
from app.core.redis_client import get_redis, close_redis
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User, Workspace, WorkspaceMember
from app.routers import auth, agents, events, otlp_receiver, websocket as ws_router, sessions, metrics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables (Alembic handles production; create_all for dev/test)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Warm up Redis pool (fixes race condition — single init here, not lazy)
    await get_redis()
    # Seed default user
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


app = FastAPI(title="OpenAgentVisualizer API", version="1.0.0", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(events.router)
app.include_router(otlp_receiver.router)
app.include_router(ws_router.router)
app.include_router(sessions.router)
app.include_router(metrics.router)
