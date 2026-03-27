"""Tests for season endpoints (Task 7)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_current_season_auto_created(authed_client: AsyncClient):
    """GET /api/seasons/current auto-creates Season 1 on first call."""
    r = await authed_client.get("/api/seasons/current")
    assert r.status_code == 200
    data = r.json()
    assert data["number"] == 1
    assert data["name"] == "Season 1: Genesis"
    assert data["status"] == "active"
    assert "days_remaining" in data
    assert data["days_remaining"] >= 0


@pytest.mark.asyncio
async def test_current_season_idempotent(authed_client: AsyncClient):
    """Calling /api/seasons/current twice returns the same season (not duplicated)."""
    r1 = await authed_client.get("/api/seasons/current")
    r2 = await authed_client.get("/api/seasons/current")
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]


@pytest.mark.asyncio
async def test_season_leaderboard_empty(authed_client: AsyncClient):
    """Season leaderboard with no agents returns empty entries list."""
    r_season = await authed_client.get("/api/seasons/current")
    season_id = r_season.json()["id"]

    r = await authed_client.get(f"/api/seasons/{season_id}/leaderboard")
    assert r.status_code == 200
    data = r.json()
    assert data["season_id"] == season_id
    assert isinstance(data["entries"], list)


@pytest.mark.asyncio
async def test_season_leaderboard_not_found(authed_client: AsyncClient):
    """Leaderboard for a non-existent season returns 404."""
    r = await authed_client.get("/api/seasons/nonexistent-season-id/leaderboard")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_current_season_has_required_fields(authed_client: AsyncClient):
    """Current season response includes all required schema fields."""
    r = await authed_client.get("/api/seasons/current")
    assert r.status_code == 200
    data = r.json()
    for field in ("id", "workspace_id", "name", "number", "start_at", "end_at", "status", "days_remaining"):
        assert field in data, f"Missing field: {field}"
