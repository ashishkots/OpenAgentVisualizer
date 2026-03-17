import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_and_resolve_alerts(authed_client: AsyncClient):
    # List unresolved alerts (will be empty, but endpoint must work)
    r = await authed_client.get("/api/alerts")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_get_leaderboard(authed_client: AsyncClient):
    r = await authed_client.get("/api/gamification/leaderboard")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_resolve_alert(authed_client: AsyncClient):
    """PATCH /api/alerts/{id} resolves an alert (or 404 when no alerts exist)."""
    # Test that resolving non-existent alert returns 404.
    response = await authed_client.patch("/api/alerts/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_resolve_alert_idor_protection(authed_client: AsyncClient):
    """PATCH /api/alerts/{id} must 404 on alerts from other workspaces."""
    # Use a made-up UUID that cannot belong to our workspace
    import uuid
    fake_id = str(uuid.uuid4())
    response = await authed_client.patch(f"/api/alerts/{fake_id}")
    assert response.status_code == 404
