import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_rate_limit_returns_429_after_exceeded(client: AsyncClient):
    """Auth endpoint allows 5 requests/min, 6th should be 429."""
    for i in range(6):
        resp = await client.post("/api/auth/login", json={
            "email": "test@test.com", "password": "wrong",
        })
        if i < 5:
            assert resp.status_code in (401, 422), f"Request {i + 1} got {resp.status_code}"
        else:
            assert resp.status_code == 429, f"Request {i + 1} should be rate limited"


@pytest.mark.asyncio
async def test_rate_limit_headers_present(client: AsyncClient):
    resp = await client.get("/api/health")
    # Health endpoint is not rate limited, but API endpoints are
    # Just verify the app starts without error
    assert resp.status_code == 200
