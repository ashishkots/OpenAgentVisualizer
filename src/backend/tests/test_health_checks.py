import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_liveness_returns_200(client: AsyncClient):
    resp = await client.get("/api/health/live")
    assert resp.status_code == 200
    assert resp.json()["status"] == "alive"


@pytest.mark.asyncio
async def test_readiness_checks_dependencies(client: AsyncClient):
    resp = await client.get("/api/health/ready")
    data = resp.json()
    assert "postgres" in data["checks"]
    assert "redis" in data["checks"]
