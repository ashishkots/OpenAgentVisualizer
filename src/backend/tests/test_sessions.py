import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_session_and_replay(authed_client: AsyncClient):
    # Create session
    r = await authed_client.post("/api/sessions", json={"name": "Test Run", "agent_ids": ["a1"]})
    assert r.status_code == 201
    session_id = r.json()["id"]

    # End session
    r = await authed_client.patch(f"/api/sessions/{session_id}/end")
    assert r.status_code == 200

    # Get replay events (will be empty since no events were ingested)
    r = await authed_client.get(f"/api/sessions/{session_id}/replay")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
