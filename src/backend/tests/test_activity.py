"""Tests for the activity feed endpoint.

GET /api/workspaces/activity

Uses the shared ``authed_client`` fixture from conftest.py.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_activity_feed_empty(authed_client: AsyncClient):
    """Fresh workspace should have no activity feed entries."""
    resp = await authed_client.get("/api/workspaces/activity")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_activity_feed_after_invite(authed_client: AsyncClient):
    """Creating an invite should add a member_invited activity entry."""
    await authed_client.post(
        "/api/workspaces/invite",
        json={"email": "activity.check@example.com", "role": "member"},
    )
    resp = await authed_client.get("/api/workspaces/activity")
    assert resp.status_code == 200
    entries = resp.json()
    assert len(entries) >= 1
    actions = [e["action"] for e in entries]
    assert "member_invited" in actions


@pytest.mark.asyncio
async def test_activity_feed_pagination(authed_client: AsyncClient):
    """Pagination params are accepted without error."""
    resp = await authed_client.get("/api/workspaces/activity?limit=10&offset=0")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
