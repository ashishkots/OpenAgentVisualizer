"""Tests for OpenTrace integration router endpoints."""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_trace_waterfall_endpoint_schema(authed_client: AsyncClient) -> None:
    """Test that the waterfall endpoint returns the correct schema after CR-008 fix."""
    # Mock the service response to match TraceDetailView schema
    mock_data = {
        "trace_id": "test-trace-123",
        "spans": [
            {
                "span_id": "span-1",
                "parent_span_id": None,
                "service": "api-gateway",
                "operation": "GET /api/agents",
                "duration_ms": 150.5,
                "status": "OK",
                "start_time": "2026-03-27T10:00:00Z",
                "end_time": "2026-03-27T10:00:00.150Z",
                "attributes": {"http.method": "GET"},
            },
            {
                "span_id": "span-2",
                "parent_span_id": "span-1",
                "service": "database",
                "operation": "SELECT agents",
                "duration_ms": 45.2,
                "status": "OK",
                "start_time": "2026-03-27T10:00:00.050Z",
                "end_time": "2026-03-27T10:00:00.095Z",
                "attributes": {"db.statement": "SELECT * FROM agents"},
            },
        ],
        "duration_ms": 150.5,  # This field should match TraceDetailView, not TraceWaterfallView
        "service_count": 2,    # This field should match TraceDetailView, not TraceWaterfallView
    }

    with patch("app.services.opentrace_service.opentrace_service.get_trace_waterfall") as mock_service:
        mock_service.return_value = mock_data

        r = await authed_client.get("/api/integrations/opentrace/traces/test-trace-123/waterfall")

    assert r.status_code == 200
    data = r.json()

    # Verify the response matches TraceDetailView schema (not TraceWaterfallView)
    assert data["trace_id"] == "test-trace-123"
    assert data["duration_ms"] == 150.5  # TraceDetailView field
    assert data["service_count"] == 2     # TraceDetailView field
    assert len(data["spans"]) == 2

    # These fields should NOT be present (they're TraceWaterfallView specific)
    assert "total_duration_ms" not in data
    assert "trace_start" not in data


@pytest.mark.asyncio
async def test_trace_waterfall_handles_service_unavailable(authed_client: AsyncClient) -> None:
    """Test that waterfall endpoint returns 503 when OpenTrace service is unavailable."""
    from app.core.integrations import CircuitBreakerError

    with patch("app.services.opentrace_service.opentrace_service.get_trace_waterfall") as mock_service:
        mock_service.side_effect = CircuitBreakerError("Circuit breaker is OPEN")

        r = await authed_client.get("/api/integrations/opentrace/traces/test-trace-123/waterfall")

    assert r.status_code == 503
    assert "OpenTrace is temporarily unavailable" in r.json()["detail"]


@pytest.mark.asyncio
async def test_trace_waterfall_cache_key_includes_workspace_id(authed_client: AsyncClient) -> None:
    """Test that the cache key includes workspace_id after CR-012 fix."""
    import orjson

    mock_data = {
        "trace_id": "test-trace-123",
        "spans": [],
        "duration_ms": 100.0,
        "service_count": 1,
    }

    fake_redis = AsyncMock()
    fake_redis.get = AsyncMock(return_value=orjson.dumps(mock_data))
    fake_redis.setex = AsyncMock()

    with patch("app.services.opentrace_service.get_redis", return_value=fake_redis):
        r = await authed_client.get("/api/integrations/opentrace/traces/test-trace-123/waterfall")

    assert r.status_code == 200

    # Verify the cache key includes workspace_id
    fake_redis.get.assert_called_once()
    cache_key = fake_redis.get.call_args[0][0]
    assert "workspace:" in cache_key
    assert "test-workspace" in cache_key  # Default workspace from conftest.py
    assert "trace:test-trace-123" in cache_key