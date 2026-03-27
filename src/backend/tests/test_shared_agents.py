"""Tests for cross-workspace agent sharing."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _register(client: AsyncClient, email: str, ws_name: str) -> tuple[str, str]:
    r = await client.post(
        "/api/auth/register",
        json={"email": email, "password": "testpass123", "workspace_name": ws_name},
    )
    assert r.status_code == 201, r.text
    data = r.json()
    return data["access_token"], data["workspace_id"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_agent(client: AsyncClient, token: str, name: str = "TestAgent") -> dict:
    r = await client.post(
        "/api/agents",
        json={"name": name, "role": "worker"},
        headers=_auth(token),
    )
    assert r.status_code == 201, r.text
    return r.json()


async def _create_org(client: AsyncClient, token: str, name: str = "Test Org") -> dict:
    r = await client.post(
        "/api/v1/orgs",
        json={"name": name},
        headers=_auth(token),
    )
    assert r.status_code == 201, r.text
    return r.json()


async def _assign_workspace_to_org(
    client: AsyncClient, workspace_id: str, org_id: str
) -> None:
    """Direct DB manipulation via the test DB to assign org_id to a workspace."""
    from app.core.database import AsyncSessionLocal
    from app.models.user import Workspace
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        ws = await db.get(Workspace, workspace_id)
        if ws:
            ws.org_id = org_id
            await db.commit()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_share_agent_cross_org_rejected(client: AsyncClient):
    """Sharing an agent with a workspace in a different org returns 403."""
    token1, ws1_id = await _register(client, "share_ws1@example.com", "Share WS1")
    token2, ws2_id = await _register(client, "share_ws2@example.com", "Share WS2")

    # Create separate orgs for each workspace
    org1 = await _create_org(client, token1, "Org One")
    org2 = await _create_org(client, token2, "Org Two")

    # Assign workspaces to separate orgs
    await _assign_workspace_to_org(client, ws1_id, org1["id"])
    await _assign_workspace_to_org(client, ws2_id, org2["id"])

    agent = await _create_agent(client, token1)

    r = await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_share_agent_no_org_rejected(client: AsyncClient):
    """Sharing an agent when workspaces have no org returns 403."""
    token1, ws1_id = await _register(client, "share_noorg1@example.com", "No Org WS1")
    token2, ws2_id = await _register(client, "share_noorg2@example.com", "No Org WS2")

    agent = await _create_agent(client, token1)

    r = await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_share_agent_same_org_succeeds(client: AsyncClient):
    """Sharing an agent with a workspace in the same org returns 201."""
    token1, ws1_id = await _register(client, "share_same1@example.com", "Same Org WS1")
    token2, ws2_id = await _register(client, "share_same2@example.com", "Same Org WS2")

    # Both workspaces in same org
    org = await _create_org(client, token1, "Shared Org")
    await _assign_workspace_to_org(client, ws1_id, org["id"])
    await _assign_workspace_to_org(client, ws2_id, org["id"])

    agent = await _create_agent(client, token1)

    r = await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["agent_id"] == agent["id"]
    assert data["permissions"] == "read"


@pytest.mark.asyncio
async def test_share_agent_already_shared_rejected(client: AsyncClient):
    """Sharing the same agent twice returns 400."""
    token1, ws1_id = await _register(client, "share_dup1@example.com", "Dup WS1")
    token2, ws2_id = await _register(client, "share_dup2@example.com", "Dup WS2")

    org = await _create_org(client, token1, "Dup Org")
    await _assign_workspace_to_org(client, ws1_id, org["id"])
    await _assign_workspace_to_org(client, ws2_id, org["id"])

    agent = await _create_agent(client, token1)

    await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )
    r = await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_list_shared_agents(client: AsyncClient):
    """GET /api/v1/shared-agents returns agents shared with current workspace."""
    token1, ws1_id = await _register(client, "share_list1@example.com", "List WS1")
    token2, ws2_id = await _register(client, "share_list2@example.com", "List WS2")

    org = await _create_org(client, token1, "List Org")
    await _assign_workspace_to_org(client, ws1_id, org["id"])
    await _assign_workspace_to_org(client, ws2_id, org["id"])

    agent = await _create_agent(client, token1)
    await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )

    # List from token2's perspective (ws2 is target)
    r = await client.get("/api/v1/shared-agents", headers=_auth(token2))
    assert r.status_code == 200
    shared = r.json()
    assert len(shared) >= 1
    assert shared[0]["agent_id"] == agent["id"]


@pytest.mark.asyncio
async def test_revoke_shared_agent(client: AsyncClient):
    """DELETE /api/v1/shared-agents/{id} removes the share record."""
    token1, ws1_id = await _register(client, "share_rev1@example.com", "Rev WS1")
    token2, ws2_id = await _register(client, "share_rev2@example.com", "Rev WS2")

    org = await _create_org(client, token1, "Rev Org")
    await _assign_workspace_to_org(client, ws1_id, org["id"])
    await _assign_workspace_to_org(client, ws2_id, org["id"])

    agent = await _create_agent(client, token1)
    share_r = await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "write"},
        headers=_auth(token1),
    )
    share_id = share_r.json()["id"]

    r = await client.delete(f"/api/v1/shared-agents/{share_id}", headers=_auth(token1))
    assert r.status_code == 204

    # Verify it's gone
    list_r = await client.get("/api/v1/shared-agents", headers=_auth(token2))
    ids = [s["id"] for s in list_r.json()]
    assert share_id not in ids


@pytest.mark.asyncio
async def test_revoke_from_wrong_workspace_forbidden(client: AsyncClient):
    """Source workspace check: non-source user cannot revoke the share."""
    token1, ws1_id = await _register(client, "share_wrong1@example.com", "Wrong WS1")
    token2, ws2_id = await _register(client, "share_wrong2@example.com", "Wrong WS2")
    token3, ws3_id = await _register(client, "share_wrong3@example.com", "Wrong WS3")

    org = await _create_org(client, token1, "Wrong Org")
    await _assign_workspace_to_org(client, ws1_id, org["id"])
    await _assign_workspace_to_org(client, ws2_id, org["id"])
    await _assign_workspace_to_org(client, ws3_id, org["id"])

    agent = await _create_agent(client, token1)
    share_r = await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )
    share_id = share_r.json()["id"]

    # token3 is not the source workspace
    r = await client.delete(f"/api/v1/shared-agents/{share_id}", headers=_auth(token3))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_share_agent_not_in_workspace_rejected(client: AsyncClient):
    """Cannot share an agent from a different workspace."""
    token1, ws1_id = await _register(client, "share_alien1@example.com", "Alien WS1")
    token2, ws2_id = await _register(client, "share_alien2@example.com", "Alien WS2")

    # Agent owned by ws2
    agent = await _create_agent(client, token2)

    # token1 (ws1) tries to share ws2's agent
    org = await _create_org(client, token1, "Alien Org")
    await _assign_workspace_to_org(client, ws1_id, org["id"])
    await _assign_workspace_to_org(client, ws2_id, org["id"])

    r = await client.post(
        f"/api/v1/agents/{agent['id']}/share",
        json={"target_workspace_id": ws2_id, "permissions": "read"},
        headers=_auth(token1),
    )
    assert r.status_code == 403
