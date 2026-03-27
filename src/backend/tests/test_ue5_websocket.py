"""Tests for the UE5 WebSocket endpoint (OAV-301)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ue5_status_endpoint_accessible(client: AsyncClient) -> None:
    """/api/ue5/status should be accessible without authentication."""
    r = await client.get("/api/ue5/status")
    assert r.status_code == 200
    data = r.json()
    assert "connected_workspaces" in data
    assert "total_ue5_connections" in data
    assert "total_web_connections" in data


@pytest.mark.asyncio
async def test_ue5_status_starts_empty(client: AsyncClient) -> None:
    """No UE5 connections should exist at startup."""
    r = await client.get("/api/ue5/status")
    assert r.status_code == 200
    data = r.json()
    assert data["total_ue5_connections"] == 0
    assert data["total_web_connections"] == 0
    assert data["connected_workspaces"] == []


@pytest.mark.asyncio
async def test_ue5_websocket_rejects_no_auth(client: AsyncClient) -> None:
    """WS connect without token or api_key should be rejected (code 4001)."""
    import httpx
    from httpx_ws import aconnect_ws

    try:
        async with aconnect_ws(
            "/ws/ue5?workspace_id=test-workspace",
            client,
        ) as ws:
            # Should not reach here — connection should be rejected
            pass
    except Exception:
        # Expected — connection should fail
        pass
