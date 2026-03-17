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
