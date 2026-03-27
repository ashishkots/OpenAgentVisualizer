"""Tests for data export endpoints.

GET /api/export/agents?format=csv|json
GET /api/export/events?format=csv|json&start=...&end=...

Uses the shared ``authed_client`` fixture from conftest.py.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_export_agents_csv(authed_client: AsyncClient):
    """CSV export of agents returns text/csv with header row."""
    resp = await authed_client.get("/api/export/agents?format=csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    # Header row must contain the first column name
    assert "id" in resp.text
    assert "content-disposition" in resp.headers
    assert "agents-" in resp.headers["content-disposition"]


@pytest.mark.asyncio
async def test_export_agents_json(authed_client: AsyncClient):
    """JSON export of agents returns application/json and a JSON array."""
    resp = await authed_client.get("/api/export/agents?format=json")
    assert resp.status_code == 200
    assert "application/json" in resp.headers["content-type"]
    body = resp.json()
    assert isinstance(body, list)


@pytest.mark.asyncio
async def test_export_events_exceeds_max_range(authed_client: AsyncClient):
    """Events export returns 400 when requested range exceeds 30 days."""
    resp = await authed_client.get(
        "/api/export/events",
        params={
            "format": "csv",
            "start": "2025-01-01T00:00:00Z",
            "end": "2025-06-01T00:00:00Z",
        },
    )
    assert resp.status_code == 400
    assert "30 days" in resp.json()["detail"]
