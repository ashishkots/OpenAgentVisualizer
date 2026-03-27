import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_login_returns_refresh_token_cookie(client: AsyncClient):
    # Register first
    await client.post("/api/auth/register", json={
        "email": "refresh@test.com",
        "password": "test1234",
        "workspace_name": "refresh-ws",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "refresh@test.com",
        "password": "test1234",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    # Check for refresh token in Set-Cookie
    cookies = resp.headers.get_list("set-cookie")
    refresh_cookies = [c for c in cookies if "refresh_token" in c]
    assert len(refresh_cookies) == 1
    assert "httponly" in refresh_cookies[0].lower()


@pytest.mark.asyncio
async def test_refresh_endpoint_returns_new_access_token(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "refresh2@test.com",
        "password": "test1234",
        "workspace_name": "refresh-ws-2",
    })
    await client.post("/api/auth/login", json={
        "email": "refresh2@test.com",
        "password": "test1234",
    })
    # Client should auto-send cookies from the login response
    refresh_resp = await client.post("/api/auth/refresh")
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()


@pytest.mark.asyncio
async def test_refresh_without_cookie_returns_401(client: AsyncClient):
    resp = await client.post("/api/auth/refresh")
    assert resp.status_code == 401
