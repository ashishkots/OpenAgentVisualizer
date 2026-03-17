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
