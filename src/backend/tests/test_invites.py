"""Tests for workspace invite endpoints.

POST   /api/workspaces/invite
GET    /api/workspaces/invites
DELETE /api/workspaces/invites/{id}
POST   /api/workspaces/invites/{token}/accept

Uses the shared ``authed_client`` fixture from conftest.py.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_invite(authed_client: AsyncClient):
    """Creating an invite should appear in the pending list."""
    create_resp = await authed_client.post(
        "/api/workspaces/invite",
        json={"email": "newmember@example.com", "role": "member"},
    )
    assert create_resp.status_code == 201
    invite = create_resp.json()
    assert invite["email"] == "newmember@example.com"
    assert invite["status"] == "pending"

    list_resp = await authed_client.get("/api/workspaces/invites")
    assert list_resp.status_code == 200
    ids = [i["id"] for i in list_resp.json()]
    assert invite["id"] in ids


@pytest.mark.asyncio
async def test_revoke_invite(authed_client: AsyncClient):
    """Revoking an invite deletes it; a second delete returns 404."""
    create_resp = await authed_client.post(
        "/api/workspaces/invite",
        json={"email": "todelete@example.com", "role": "viewer"},
    )
    assert create_resp.status_code == 201
    invite_id = create_resp.json()["id"]

    del_resp = await authed_client.delete(f"/api/workspaces/invites/{invite_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "revoked"

    # Second delete should 404
    del_resp2 = await authed_client.delete(f"/api/workspaces/invites/{invite_id}")
    assert del_resp2.status_code == 404


@pytest.mark.asyncio
async def test_accept_expired_invite(authed_client: AsyncClient):
    """Accepting an invite with a fake/non-existent token returns 404."""
    resp = await authed_client.post("/api/workspaces/invites/nonexistenttoken123/accept")
    assert resp.status_code == 404
