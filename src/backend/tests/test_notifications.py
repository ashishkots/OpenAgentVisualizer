"""Tests for the notification endpoints (GET /api/notifications, unread-count,
PATCH .../read, POST .../read-all).

Uses the shared ``authed_client`` fixture from conftest.py so the DB is an
in-memory SQLite instance with no external dependencies.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_notifications_empty(authed_client: AsyncClient):
    """Fresh user should have no notifications."""
    resp = await authed_client.get("/api/notifications")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_unread_count_zero(authed_client: AsyncClient):
    """Unread count should be 0 for a new user with no notifications."""
    resp = await authed_client.get("/api/notifications/unread-count")
    assert resp.status_code == 200
    data = resp.json()
    assert "count" in data
    assert data["count"] == 0


@pytest.mark.asyncio
async def test_mark_all_read_returns_zero(authed_client: AsyncClient):
    """Calling read-all with no notifications should return marked_read=0."""
    resp = await authed_client.post("/api/notifications/read-all")
    assert resp.status_code == 200
    data = resp.json()
    assert "marked_read" in data
    assert data["marked_read"] == 0
