import pytest


@pytest.mark.asyncio
async def test_list_integrations_requires_auth(client):
    r = await client.get("/api/integrations")
    # FastAPI returns 422 when a required Header(...) is missing entirely;
    # 401 is returned when the header is present but invalid/expired.
    # Both represent "not authenticated" — accept either.
    assert r.status_code in (401, 422)


@pytest.mark.asyncio
async def test_list_integrations_returns_list(authed_client):
    r = await authed_client.get("/api/integrations")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 15


@pytest.mark.asyncio
async def test_integration_schema(authed_client):
    r = await authed_client.get("/api/integrations")
    item = r.json()[0]
    assert "id" in item
    assert "name" in item
    assert "status" in item
    assert "last_seen" in item
    assert "event_count_24h" in item
    assert "install_command" in item


@pytest.mark.asyncio
async def test_workspace_info(authed_client):
    r = await authed_client.get("/api/workspaces/default")
    assert r.status_code == 200
    data = r.json()
    assert "workspace_id" in data
    assert "name" in data
    assert "agent_count" in data
    assert "endpoint" in data


@pytest.mark.asyncio
async def test_workspace_not_found_returns_404(authed_client):
    r = await authed_client.get("/api/workspaces/nonexistent-ws-99")
    assert r.status_code == 404
