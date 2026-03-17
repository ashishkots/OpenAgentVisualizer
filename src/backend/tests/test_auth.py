import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    r = await client.post("/api/auth/register", json={
        "email": "test@example.com", "password": "secret123", "workspace_name": "Test WS"
    })
    assert r.status_code == 201

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
    r = await client.get("/api/agents", headers={"Authorization": "Bearer invalid_token"})
    assert r.status_code == 401
