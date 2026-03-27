"""Tests for team endpoints (Task 8)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_teams_empty(authed_client: AsyncClient):
    """Listing teams on a fresh workspace returns an empty list."""
    r = await authed_client.get("/api/teams")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_team(authed_client: AsyncClient):
    """Creating a team returns 201 with the team data."""
    r = await authed_client.post(
        "/api/teams",
        json={"name": "Alpha Squad", "description": "Top performers", "icon": "zap"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Alpha Squad"
    assert data["icon"] == "zap"
    assert "id" in data
    assert "workspace_id" in data


@pytest.mark.asyncio
async def test_create_team_max_limit(authed_client: AsyncClient):
    """Creating more than 5 teams in a workspace returns 400."""
    for i in range(5):
        r = await authed_client.post(
            "/api/teams",
            json={"name": f"Team {i + 1}"},
        )
        assert r.status_code == 201

    r = await authed_client.post("/api/teams", json={"name": "Team 6"})
    assert r.status_code == 400
    assert "maximum" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_team_not_found(authed_client: AsyncClient):
    """Fetching a non-existent team returns 404."""
    r = await authed_client.get("/api/teams/nonexistent-id")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_add_member_to_team(authed_client: AsyncClient):
    """Adding an agent to a team returns 201 with membership data."""
    # Create team
    r_team = await authed_client.post("/api/teams", json={"name": "Bravo Team"})
    assert r_team.status_code == 201
    team_id = r_team.json()["id"]

    # Create agent
    r_agent = await authed_client.post(
        "/api/agents",
        json={"name": "TeamBot", "role": "worker", "framework": "custom"},
    )
    assert r_agent.status_code == 201
    agent_id = r_agent.json()["id"]

    # Add agent to team
    r = await authed_client.post(
        f"/api/teams/{team_id}/members",
        json={"agent_id": agent_id, "role": "member"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["agent_id"] == agent_id
    assert data["team_id"] == team_id
    assert data["role"] == "member"


@pytest.mark.asyncio
async def test_add_member_duplicate(authed_client: AsyncClient):
    """Adding the same agent twice returns 409."""
    r_team = await authed_client.post("/api/teams", json={"name": "Charlie Team"})
    team_id = r_team.json()["id"]

    r_agent = await authed_client.post(
        "/api/agents",
        json={"name": "DuplicateBot", "role": "worker", "framework": "custom"},
    )
    agent_id = r_agent.json()["id"]

    await authed_client.post(
        f"/api/teams/{team_id}/members",
        json={"agent_id": agent_id, "role": "member"},
    )
    r = await authed_client.post(
        f"/api/teams/{team_id}/members",
        json={"agent_id": agent_id, "role": "member"},
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_remove_member(authed_client: AsyncClient):
    """Removing an agent from a team returns 204."""
    r_team = await authed_client.post("/api/teams", json={"name": "Delta Team"})
    team_id = r_team.json()["id"]

    r_agent = await authed_client.post(
        "/api/agents",
        json={"name": "RemoveBot", "role": "worker", "framework": "custom"},
    )
    agent_id = r_agent.json()["id"]

    await authed_client.post(
        f"/api/teams/{team_id}/members",
        json={"agent_id": agent_id},
    )
    r = await authed_client.delete(f"/api/teams/{team_id}/members/{agent_id}")
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_team_stats(authed_client: AsyncClient):
    """Team stats returns the correct structure."""
    r_team = await authed_client.post("/api/teams", json={"name": "Echo Team"})
    team_id = r_team.json()["id"]

    r = await authed_client.get(f"/api/teams/{team_id}/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["team_id"] == team_id
    assert "total_xp" in data
    assert "total_tasks" in data
    assert "level" in data
    assert "level_name" in data
    assert data["member_count"] == 0


@pytest.mark.asyncio
async def test_add_member_max_limit(authed_client: AsyncClient):
    """Adding more than 10 members to a team returns 400."""
    r_team = await authed_client.post("/api/teams", json={"name": "Foxtrot Team"})
    team_id = r_team.json()["id"]

    agent_ids = []
    for i in range(10):
        r_agent = await authed_client.post(
            "/api/agents",
            json={"name": f"MemberBot{i}", "role": "worker", "framework": "custom"},
        )
        assert r_agent.status_code == 201
        agent_ids.append(r_agent.json()["id"])
        await authed_client.post(
            f"/api/teams/{team_id}/members",
            json={"agent_id": agent_ids[-1]},
        )

    # 11th agent
    r_agent_11 = await authed_client.post(
        "/api/agents",
        json={"name": "OverflowBot", "role": "worker", "framework": "custom"},
    )
    r = await authed_client.post(
        f"/api/teams/{team_id}/members",
        json={"agent_id": r_agent_11.json()["id"]},
    )
    assert r.status_code == 400
    assert "maximum" in r.json()["detail"].lower()
