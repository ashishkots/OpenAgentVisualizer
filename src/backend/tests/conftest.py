import pytest
import pytest_asyncio
from contextlib import asynccontextmanager
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import fakeredis.aioredis


def pytest_configure(config):
    """Patch postgresql.JSONB → JSON for SQLite test compatibility.
    Must run before any model imports during collection.
    """
    import sqlalchemy.dialects.postgresql as _pg
    from sqlalchemy import JSON as _JSON
    _pg.JSONB = _JSON  # type: ignore[assignment]


TEST_DB_URL = "sqlite+aiosqlite:///./test.db"


@asynccontextmanager
async def mock_lifespan(app):
    """Mock lifespan that skips PostgreSQL and Redis connections during tests."""
    yield  # Test fixtures handle DB setup


@pytest_asyncio.fixture(scope="function")
async def client():
    from app.main import app
    from app.core.database import Base, get_db
    from app.routers import events
    import app.core.redis_client as redis_module

    # Override lifespan to skip PostgreSQL/Redis connections
    app.router.lifespan_context = mock_lifespan

    engine = create_async_engine(TEST_DB_URL, echo=False)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_db():
        async with SessionLocal() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    # Single shared fakeredis instance for the whole test — shared between all
    # dependency overrides so all Redis calls see the same data.
    fake_redis = fakeredis.aioredis.FakeRedis()

    async def override_redis():
        return fake_redis

    # Override the core redis_client module-level getter so agents.py graph
    # endpoint (which calls get_redis() directly) also uses fakeredis.
    original_pool = redis_module._redis_pool
    redis_module._redis_pool = fake_redis

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[events.get_redis] = override_redis

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    # Restore original Redis pool state
    redis_module._redis_pool = original_pool
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def authed_client(client: AsyncClient):
    r = await client.post("/api/auth/register", json={
        "email": "auto@example.com",
        "password": "testpass123",
        "workspace_name": "Auto WS"
    })
    assert r.status_code == 201, f"Registration failed: {r.text}"
    token = r.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
