"""Tests for the Prometheus /metrics endpoint (OAV-243)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_metrics_endpoint_returns_200(client: AsyncClient) -> None:
    """The /metrics endpoint should be accessible without authentication."""
    r = await client.get("/metrics")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_metrics_endpoint_returns_prometheus_format(client: AsyncClient) -> None:
    """The /metrics endpoint should return valid Prometheus text format."""
    r = await client.get("/metrics")
    assert r.status_code == 200
    content = r.text
    # Prometheus format starts with HELP or TYPE comments
    assert "# HELP" in content or "# TYPE" in content or "python_" in content


@pytest.mark.asyncio
async def test_metrics_endpoint_no_auth_required(client: AsyncClient) -> None:
    """The /metrics endpoint should not require a JWT token."""
    # No Authorization header — should still return 200
    r = await client.get("/metrics")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_health_endpoint_accessible(client: AsyncClient) -> None:
    """/api/health should remain accessible without authentication."""
    r = await client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
