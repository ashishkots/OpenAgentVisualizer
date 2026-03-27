"""Tests for the metrics aggregates endpoint (OAV-225)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_aggregates_hourly_returns_200(authed_client: AsyncClient):
    """GET /api/metrics/aggregates?interval=hourly returns a valid response."""
    r = await authed_client.get("/api/metrics/aggregates?interval=hourly")
    assert r.status_code == 200
    body = r.json()
    assert "interval" in body
    assert body["interval"] == "hourly"
    assert "data" in body
    assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_aggregates_daily_returns_200(authed_client: AsyncClient):
    r = await authed_client.get("/api/metrics/aggregates?interval=daily")
    assert r.status_code == 200
    assert r.json()["interval"] == "daily"


@pytest.mark.asyncio
async def test_aggregates_invalid_interval(authed_client: AsyncClient):
    r = await authed_client.get("/api/metrics/aggregates?interval=weekly")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_aggregates_period_7d(authed_client: AsyncClient):
    r = await authed_client.get("/api/metrics/aggregates?interval=hourly&period=7d")
    assert r.status_code == 200
    assert r.json()["period"] == "7d"


@pytest.mark.asyncio
async def test_aggregates_period_30d(authed_client: AsyncClient):
    r = await authed_client.get("/api/metrics/aggregates?interval=daily&period=30d")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_aggregates_invalid_period(authed_client: AsyncClient):
    r = await authed_client.get("/api/metrics/aggregates?interval=hourly&period=1y")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_aggregates_with_agent_filter(authed_client: AsyncClient):
    r = await authed_client.get(
        "/api/metrics/aggregates?interval=hourly&agent_id=nonexistent-id"
    )
    assert r.status_code == 200
    body = r.json()
    # In test env, TimescaleDB views not available; endpoint should return empty data
    assert isinstance(body["data"], list)
