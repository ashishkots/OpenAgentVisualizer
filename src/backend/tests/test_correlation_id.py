import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_response_includes_correlation_id(client: AsyncClient):
    resp = await client.get("/api/health")
    assert "X-Correlation-ID" in resp.headers
    assert len(resp.headers["X-Correlation-ID"]) == 36  # UUID format


@pytest.mark.asyncio
async def test_correlation_id_propagated_from_request(client: AsyncClient):
    resp = await client.get(
        "/api/health",
        headers={"X-Correlation-ID": "test-corr-id-12345"},
    )
    assert resp.headers["X-Correlation-ID"] == "test-corr-id-12345"


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
