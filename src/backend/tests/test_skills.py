"""Tests for the skill tree system (Sprint 6 Task 3)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_skill_trees_empty(authed_client: AsyncClient) -> None:
    """GET /api/skill-trees returns an empty list when no trees are seeded."""
    r = await authed_client.get("/api/skill-trees")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_get_agent_skills_agent_not_found(authed_client: AsyncClient) -> None:
    """GET /api/skill-trees/agents/{id}/skills returns 404 for nonexistent agent."""
    r = await authed_client.get("/api/skill-trees/agents/nonexistent/skills")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_get_agent_skills_empty_for_new_agent(authed_client: AsyncClient) -> None:
    """A newly created agent has no skills unlocked."""
    r_a = await authed_client.post(
        "/api/agents",
        json={"name": "SkillBot", "role": "tester", "framework": "custom"},
    )
    assert r_a.status_code == 201
    agent_id = r_a.json()["id"]

    r = await authed_client.get(f"/api/skill-trees/agents/{agent_id}/skills")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_unlock_skill_node_not_found(authed_client: AsyncClient) -> None:
    """POST .../unlock returns 404 when skill node doesn't exist."""
    r_a = await authed_client.post(
        "/api/agents",
        json={"name": "UnlockBot", "role": "tester", "framework": "custom"},
    )
    assert r_a.status_code == 201
    agent_id = r_a.json()["id"]

    r = await authed_client.post(
        f"/api/skill-trees/agents/{agent_id}/skills/nonexistent-node/unlock"
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_skill_trees_nodes_have_required_fields(authed_client: AsyncClient) -> None:
    """Skill tree nodes contain the required schema fields."""
    r = await authed_client.get("/api/skill-trees")
    assert r.status_code == 200
    trees = r.json()
    for tree in trees:
        assert "id" in tree
        assert "name" in tree
        assert "nodes" in tree
        for node in tree["nodes"]:
            assert "id" in node
            assert "tier" in node
            assert "cost" in node
            assert "level_required" in node
