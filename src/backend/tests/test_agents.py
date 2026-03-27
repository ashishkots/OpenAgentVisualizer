import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_agents(authed_client: AsyncClient):
    r = await authed_client.post("/api/agents", json={
        "name": "ResearchBot", "role": "researcher", "framework": "langchain"
    })
    assert r.status_code == 201
    agent_id = r.json()["id"]

    r = await authed_client.get("/api/agents")
    assert r.status_code == 200
    assert any(a["id"] == agent_id for a in r.json())


@pytest.mark.asyncio
async def test_get_agent_stats(authed_client: AsyncClient):
    r = await authed_client.post("/api/agents", json={"name": "Bot", "role": "worker", "framework": "custom"})
    assert r.status_code == 201
    agent_id = r.json()["id"]
    r = await authed_client.get(f"/api/agents/{agent_id}/stats")
    assert r.status_code == 200
    assert "total_tokens" in r.json()
    assert "level" in r.json()


@pytest.mark.asyncio
async def test_get_agent_events(authed_client: AsyncClient):
    """Test the new agent-specific events endpoint (NC-003 fix)."""
    # Create an agent
    r = await authed_client.post("/api/agents", json={"name": "EventBot", "role": "worker", "framework": "custom"})
    assert r.status_code == 201
    agent_id = r.json()["id"]

    # Test empty events initially
    r = await authed_client.get(f"/api/agents/{agent_id}/events")
    assert r.status_code == 200
    data = r.json()
    assert "events" in data
    assert data["events"] == []
    assert "has_more" in data
    assert data["has_more"] is False

    # Test with non-existent agent
    r = await authed_client.get("/api/agents/nonexistent/events")
    assert r.status_code == 404

    # Test pagination parameters
    r = await authed_client.get(f"/api/agents/{agent_id}/events", params={"limit": 50})
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_get_agent_achievements(authed_client: AsyncClient):
    """Test the new agent-specific achievements endpoint (NC-003 fix)."""
    # Create an agent
    r = await authed_client.post("/api/agents", json={"name": "AchievementBot", "role": "worker", "framework": "custom"})
    assert r.status_code == 201
    agent_id = r.json()["id"]

    # Test empty achievements initially
    r = await authed_client.get(f"/api/agents/{agent_id}/achievements")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 0

    # Test with non-existent agent
    r = await authed_client.get("/api/agents/nonexistent/achievements")
    assert r.status_code == 404
