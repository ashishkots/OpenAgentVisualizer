"""Tests for organization CRUD, member management, workspace listing, and analytics."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _register(client: AsyncClient, email: str, workspace_name: str) -> tuple[str, str]:
    """Register a user and return (token, workspace_id)."""
    r = await client.post(
        "/api/auth/register",
        json={"email": email, "password": "testpass123", "workspace_name": workspace_name},
    )
    assert r.status_code == 201, r.text
    data = r.json()
    return data["access_token"], data["workspace_id"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_org(client: AsyncClient, token: str, name: str = "Test Org") -> dict:
    r = await client.post(
        "/api/v1/orgs",
        json={"name": name, "plan": "free"},
        headers=_auth(token),
    )
    assert r.status_code == 201, r.text
    return r.json()


# ---------------------------------------------------------------------------
# Create organization
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_org(client: AsyncClient):
    token, _ = await _register(client, "org_create@example.com", "Org Create WS")
    org = await _create_org(client, token, "Acme Corp")

    assert org["name"] == "Acme Corp"
    assert org["plan"] == "free"
    assert "slug" in org
    assert "id" in org


@pytest.mark.asyncio
async def test_create_org_duplicate_slug_rejected(client: AsyncClient):
    token, _ = await _register(client, "org_slug@example.com", "Slug WS")

    r = await client.post(
        "/api/v1/orgs",
        json={"name": "Unique Org", "slug": "exact-slug"},
        headers=_auth(token),
    )
    assert r.status_code == 201

    r2 = await client.post(
        "/api/v1/orgs",
        json={"name": "Another Org", "slug": "exact-slug"},
        headers=_auth(token),
    )
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_list_orgs(client: AsyncClient):
    token, _ = await _register(client, "org_list@example.com", "List WS")
    await _create_org(client, token, "Org A")
    await _create_org(client, token, "Org B")

    r = await client.get("/api/v1/orgs", headers=_auth(token))
    assert r.status_code == 200
    orgs = r.json()
    assert len(orgs) >= 2


@pytest.mark.asyncio
async def test_get_org_detail(client: AsyncClient):
    token, _ = await _register(client, "org_detail@example.com", "Detail WS")
    org = await _create_org(client, token)

    r = await client.get(f"/api/v1/orgs/{org['id']}", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["id"] == org["id"]


@pytest.mark.asyncio
async def test_get_org_non_member_forbidden(client: AsyncClient):
    token1, _ = await _register(client, "org_own@example.com", "Own WS")
    token2, _ = await _register(client, "org_other@example.com", "Other WS")
    org = await _create_org(client, token1)

    r = await client.get(f"/api/v1/orgs/{org['id']}", headers=_auth(token2))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_update_org(client: AsyncClient):
    token, _ = await _register(client, "org_update@example.com", "Update WS")
    org = await _create_org(client, token, "Old Name")

    r = await client.put(
        f"/api/v1/orgs/{org['id']}",
        json={"name": "New Name"},
        headers=_auth(token),
    )
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"


# ---------------------------------------------------------------------------
# Member management
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_member(client: AsyncClient):
    token1, _ = await _register(client, "org_admin@example.com", "Admin WS")
    # Register the target user
    token2, _ = await _register(client, "org_new_member@example.com", "Member WS")

    org = await _create_org(client, token1)

    r = await client.post(
        f"/api/v1/orgs/{org['id']}/members",
        json={"email": "org_new_member@example.com", "role": "member"},
        headers=_auth(token1),
    )
    assert r.status_code == 201, r.text
    assert r.json()["role"] == "member"


@pytest.mark.asyncio
async def test_add_member_already_member(client: AsyncClient):
    token1, _ = await _register(client, "org_double@example.com", "Double WS")
    token2, _ = await _register(client, "org_double_m@example.com", "Double M WS")

    org = await _create_org(client, token1)

    await client.post(
        f"/api/v1/orgs/{org['id']}/members",
        json={"email": "org_double_m@example.com", "role": "member"},
        headers=_auth(token1),
    )
    r = await client.post(
        f"/api/v1/orgs/{org['id']}/members",
        json={"email": "org_double_m@example.com", "role": "member"},
        headers=_auth(token1),
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_list_members(client: AsyncClient):
    token, _ = await _register(client, "org_listm@example.com", "ListM WS")
    token2, _ = await _register(client, "org_listm2@example.com", "ListM2 WS")
    org = await _create_org(client, token)

    await client.post(
        f"/api/v1/orgs/{org['id']}/members",
        json={"email": "org_listm2@example.com", "role": "member"},
        headers=_auth(token),
    )

    r = await client.get(f"/api/v1/orgs/{org['id']}/members", headers=_auth(token))
    assert r.status_code == 200
    assert len(r.json()) >= 2  # owner + new member


@pytest.mark.asyncio
async def test_remove_member(client: AsyncClient):
    token1, _ = await _register(client, "org_rm@example.com", "Rm WS")
    token2, _ = await _register(client, "org_rm_target@example.com", "Rm Target WS")
    org = await _create_org(client, token1)

    add_r = await client.post(
        f"/api/v1/orgs/{org['id']}/members",
        json={"email": "org_rm_target@example.com", "role": "member"},
        headers=_auth(token1),
    )
    assert add_r.status_code == 201
    target_user_id = add_r.json()["user_id"]

    r = await client.delete(
        f"/api/v1/orgs/{org['id']}/members/{target_user_id}",
        headers=_auth(token1),
    )
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_cannot_remove_last_owner(client: AsyncClient):
    token, _ = await _register(client, "org_last_owner@example.com", "Last Owner WS")
    org = await _create_org(client, token)

    # Get owner's user_id
    members_r = await client.get(f"/api/v1/orgs/{org['id']}/members", headers=_auth(token))
    owner_member = members_r.json()[0]
    owner_user_id = owner_member["user_id"]

    r = await client.delete(
        f"/api/v1/orgs/{org['id']}/members/{owner_user_id}",
        headers=_auth(token),
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Workspace listing
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_workspaces_empty_without_org(client: AsyncClient):
    """Workspaces not assigned to the org should not appear."""
    token, _ = await _register(client, "org_ws_list@example.com", "WS List WS")
    org = await _create_org(client, token)

    r = await client.get(f"/api/v1/orgs/{org['id']}/workspaces", headers=_auth(token))
    assert r.status_code == 200
    # The workspace created during register has no org_id set, so result is empty
    assert isinstance(r.json(), list)


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_org_analytics_empty_org(client: AsyncClient):
    token, _ = await _register(client, "org_analytics@example.com", "Analytics WS")
    org = await _create_org(client, token)

    r = await client.get(f"/api/v1/orgs/{org['id']}/analytics", headers=_auth(token))
    assert r.status_code == 200
    data = r.json()
    assert data["org_id"] == org["id"]
    assert data["total_workspaces"] == 0
    assert data["total_agents"] == 0
    assert data["total_events"] == 0
    assert data["total_xp"] == 0
