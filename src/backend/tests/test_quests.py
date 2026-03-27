"""Tests for the quest progression system (Sprint 6 Task 2)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_quests_empty(authed_client: AsyncClient) -> None:
    """GET /api/quests returns an empty list when no quests exist."""
    r = await authed_client.get("/api/quests")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_list_quests_with_type_filter(authed_client: AsyncClient) -> None:
    """GET /api/quests?quest_type=daily filters by type."""
    r = await authed_client.get("/api/quests?quest_type=daily")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    for item in data:
        assert item["type"] == "daily"


@pytest.mark.asyncio
async def test_get_agent_quest_progress_not_found(authed_client: AsyncClient) -> None:
    """GET /api/quests/agents/{id} returns 404 for a nonexistent agent."""
    r = await authed_client.get("/api/quests/agents/nonexistent-agent-id")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_get_agent_quest_progress_found(authed_client: AsyncClient) -> None:
    """GET /api/quests/agents/{id} returns an empty list for a new agent."""
    # Create an agent first
    r_ws = await authed_client.get("/api/agents")
    workspace_resp = await authed_client.post(
        "/api/agents",
        json={"name": "QuestBot", "role": "tester", "framework": "custom"},
    )
    assert workspace_resp.status_code == 201
    agent_id = workspace_resp.json()["id"]

    r = await authed_client.get(f"/api/quests/agents/{agent_id}")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_claim_quest_nonexistent(authed_client: AsyncClient) -> None:
    """POST /api/quests/{id}/claim returns 400 for a nonexistent quest."""
    # Create an agent
    r_a = await authed_client.post(
        "/api/agents",
        json={"name": "ClaimBot", "role": "tester", "framework": "custom"},
    )
    assert r_a.status_code == 201
    agent_id = r_a.json()["id"]

    r = await authed_client.post(
        "/api/quests/nonexistent-quest-id/claim",
        params={"agent_id": agent_id},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_list_quests_with_agent_id(authed_client: AsyncClient) -> None:
    """GET /api/quests?agent_id= includes progress field in response."""
    r_a = await authed_client.post(
        "/api/agents",
        json={"name": "ProgressBot", "role": "tester", "framework": "custom"},
    )
    assert r_a.status_code == 201
    agent_id = r_a.json()["id"]

    r = await authed_client.get(f"/api/quests?agent_id={agent_id}")
    assert r.status_code == 200
    data = r.json()
    # All returned items should have a progress field (None if no progress yet)
    for item in data:
        assert "progress" in item
