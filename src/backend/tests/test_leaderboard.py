"""Tests for the enhanced leaderboard (OAV-224, OAV-225)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_leaderboard_all_time_returns_list(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/leaderboard")
    assert r.status_code == 200
    body = r.json()
    assert "agents" in body
    assert "period" in body
    assert "category" in body
    assert body["period"] == "all_time"
    assert body["category"] == "xp"


@pytest.mark.asyncio
async def test_leaderboard_with_agents(authed_client: AsyncClient):
    # Create two agents
    r1 = await authed_client.post(
        "/api/agents",
        json={"name": "HighXP", "role": "worker", "framework": "custom"},
    )
    r2 = await authed_client.post(
        "/api/agents",
        json={"name": "LowXP", "role": "worker", "framework": "custom"},
    )
    assert r1.status_code == 201
    assert r2.status_code == 201

    r = await authed_client.get("/api/gamification/leaderboard")
    assert r.status_code == 200
    agents = r.json()["agents"]
    assert len(agents) >= 2

    # Each entry must have required fields
    for entry in agents:
        assert "agent_id" in entry
        assert "name" in entry
        assert "level" in entry
        assert "xp_total" in entry
        assert "rank" in entry
        assert "achievement_count" in entry
        assert "trend" in entry


@pytest.mark.asyncio
async def test_leaderboard_ranks_start_at_1(authed_client: AsyncClient):
    await authed_client.post(
        "/api/agents",
        json={"name": "RankBot", "role": "worker", "framework": "custom"},
    )
    r = await authed_client.get("/api/gamification/leaderboard")
    agents = r.json()["agents"]
    if agents:
        assert agents[0]["rank"] == 1


@pytest.mark.asyncio
async def test_leaderboard_period_daily(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/leaderboard?period=daily")
    assert r.status_code == 200
    assert r.json()["period"] == "daily"


@pytest.mark.asyncio
async def test_leaderboard_period_weekly(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/leaderboard?period=weekly")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_leaderboard_period_monthly(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/leaderboard?period=monthly")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_leaderboard_invalid_period(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/leaderboard?period=hourly")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_leaderboard_invalid_category(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/leaderboard?category=unknown")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_leaderboard_limit_respected(authed_client: AsyncClient):
    # Create 3 agents
    for i in range(3):
        await authed_client.post(
            "/api/agents",
            json={"name": f"LimitBot{i}", "role": "worker", "framework": "custom"},
        )
    r = await authed_client.get("/api/gamification/leaderboard?limit=2")
    assert r.status_code == 200
    agents = r.json()["agents"]
    assert len(agents) <= 2


@pytest.mark.asyncio
async def test_leaderboard_trend_field_valid_values(authed_client: AsyncClient):
    """Trend field must be one of: up, down, same."""
    r = await authed_client.get("/api/gamification/leaderboard")
    assert r.status_code == 200
    for entry in r.json()["agents"]:
        assert entry["trend"] in ("up", "down", "same")
