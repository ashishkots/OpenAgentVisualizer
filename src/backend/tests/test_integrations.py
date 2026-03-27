"""Tests for integration config CRUD endpoints and health check."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_integration_configs_empty(authed_client: AsyncClient) -> None:
    """New workspace starts with no integration configs."""
    r = await authed_client.get("/api/integrations/config")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_upsert_integration_config(authed_client: AsyncClient) -> None:
    """Creating an integration config via PUT should return the saved config."""
    r = await authed_client.put(
        "/api/integrations/config/opentrace",
        json={
            "product_name": "opentrace",
            "base_url": "http://opentrace:8000",
            "api_key": "test-api-key",
            "enabled": True,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["product_name"] == "opentrace"
    assert data["base_url"] == "http://opentrace:8000"
    assert data["enabled"] is True
    # API key must never be returned
    assert "api_key" not in data
    assert "api_key_encrypted" not in data


@pytest.mark.asyncio
async def test_upsert_replaces_existing_config(authed_client: AsyncClient) -> None:
    """Calling PUT twice for the same product should update (upsert) the record."""
    await authed_client.put(
        "/api/integrations/config/openmesh",
        json={
            "product_name": "openmesh",
            "base_url": "http://openmesh:8000",
            "api_key": "key-v1",
        },
    )
    r = await authed_client.put(
        "/api/integrations/config/openmesh",
        json={
            "product_name": "openmesh",
            "base_url": "http://openmesh-new:8000",
            "api_key": "key-v2",
        },
    )
    assert r.status_code == 200
    assert r.json()["base_url"] == "http://openmesh-new:8000"

    # Only one record should exist
    r2 = await authed_client.get("/api/integrations/config")
    configs = [c for c in r2.json() if c["product_name"] == "openmesh"]
    assert len(configs) == 1


@pytest.mark.asyncio
async def test_patch_integration_config(authed_client: AsyncClient) -> None:
    """PATCH should allow partial updates."""
    await authed_client.put(
        "/api/integrations/config/openmind",
        json={
            "product_name": "openmind",
            "base_url": "http://openmind:8000",
            "api_key": "original-key",
            "enabled": True,
        },
    )
    r = await authed_client.patch(
        "/api/integrations/config/openmind",
        json={"enabled": False},
    )
    assert r.status_code == 200
    assert r.json()["enabled"] is False
    # base_url should not change
    assert r.json()["base_url"] == "http://openmind:8000"


@pytest.mark.asyncio
async def test_delete_integration_config(authed_client: AsyncClient) -> None:
    """DELETE should remove the config and return 204."""
    await authed_client.put(
        "/api/integrations/config/openshield",
        json={
            "product_name": "openshield",
            "base_url": "http://openshield:8000",
            "api_key": "shield-key",
        },
    )
    r = await authed_client.delete("/api/integrations/config/openshield")
    assert r.status_code == 204

    r2 = await authed_client.get("/api/integrations/config")
    configs = [c for c in r2.json() if c["product_name"] == "openshield"]
    assert len(configs) == 0


@pytest.mark.asyncio
async def test_upsert_rejects_unknown_product(authed_client: AsyncClient) -> None:
    """Upserting an unknown product should return 400."""
    r = await authed_client.put(
        "/api/integrations/config/unknownproduct",
        json={
            "product_name": "unknownproduct",
            "base_url": "http://example.com",
            "api_key": "key",
        },
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_upsert_rejects_invalid_url(authed_client: AsyncClient) -> None:
    """Upserting with a non-HTTP base_url should return 422."""
    r = await authed_client.put(
        "/api/integrations/config/opentrace",
        json={
            "product_name": "opentrace",
            "base_url": "ftp://opentrace:8000",
            "api_key": "key",
        },
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_health_check_endpoint(authed_client: AsyncClient) -> None:
    """Health check endpoint should return a list with status for each product."""
    r = await authed_client.get("/api/integrations/health")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # All 4 products should be represented
    product_names = {item["product_name"] for item in data}
    assert "opentrace" in product_names
    assert "openmesh" in product_names
    assert "openmind" in product_names
    assert "openshield" in product_names
    # Unconfigured products should have status "not_configured"
    for item in data:
        assert item["status"] in {"connected", "disconnected", "not_configured", "circuit_open"}


@pytest.mark.asyncio
async def test_test_connection_endpoint(authed_client: AsyncClient) -> None:
    """Test connection endpoint should return health result even for unconfigured product."""
    r = await authed_client.post("/api/integrations/opentrace/test")
    assert r.status_code == 200
    data = r.json()
    assert data["product_name"] == "opentrace"
    assert "status" in data


@pytest.mark.asyncio
async def test_integration_config_requires_auth(client: AsyncClient) -> None:
    """Integration endpoints require authentication."""
    r = await client.get("/api/integrations/config")
    assert r.status_code == 401
