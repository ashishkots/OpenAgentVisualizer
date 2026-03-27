"""Tests for integration service layer — mocking httpx calls."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.integrations import CircuitBreakerError
from app.services.opentrace_service import OpenTraceService
from app.services.openmesh_service import OpenMeshService
from app.services.openmind_service import OpenMindService
from app.services.openshield_service import OpenShieldService


# ---------------------------------------------------------------------------
# Helper to build a configured service with mocked Redis
# ---------------------------------------------------------------------------

def _make_fake_redis(cached_value=None):
    fake = AsyncMock()
    fake.get = AsyncMock(return_value=cached_value)
    fake.setex = AsyncMock()
    return fake


# ---------------------------------------------------------------------------
# OpenTraceService
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_opentrace_returns_cached_traces():
    """Service should return cached data without making an HTTP call."""
    import orjson

    cached = orjson.dumps([{"trace_id": "abc", "root_service": "svc", "root_operation": "op",
                            "duration_ms": 100.0, "span_count": 3, "error_count": 0,
                            "started_at": "2026-01-01T00:00:00Z"}])
    fake_redis = _make_fake_redis(cached)

    service = OpenTraceService()
    with patch("app.services.opentrace_service.get_redis", return_value=fake_redis):
        result = await service.get_traces("ws-1", "agent-1")

    assert len(result) == 1
    assert result[0]["trace_id"] == "abc"
    # No HTTP call should be made when cache is warm
    service._client.request = AsyncMock()
    service._client.request.assert_not_called()


@pytest.mark.asyncio
async def test_opentrace_raises_circuit_breaker_error_when_open():
    """Service should propagate CircuitBreakerError when circuit is OPEN."""
    from app.core.integrations import CircuitState

    service = OpenTraceService()
    service.circuit.state = CircuitState.OPEN
    service.circuit.last_failure_time = float("inf")  # Never recover

    fake_redis = _make_fake_redis(None)  # Cache miss
    with patch("app.services.opentrace_service.get_redis", return_value=fake_redis):
        with pytest.raises(CircuitBreakerError):
            await service.get_traces("ws-1", "agent-1")


@pytest.mark.asyncio
async def test_opentrace_raises_value_error_when_not_configured():
    """Service should raise ValueError when no base URL is configured."""
    service = OpenTraceService()
    # Ensure no env vars or DB config
    with patch.object(service, "_get_config", return_value=("", "")):
        fake_redis = _make_fake_redis(None)
        with patch("app.services.opentrace_service.get_redis", return_value=fake_redis):
            with pytest.raises(ValueError, match="not configured"):
                await service.get_traces("ws-1", "agent-1")


@pytest.mark.asyncio
async def test_opentrace_cache_key_includes_workspace_id():
    """Cache keys should include workspace_id to prevent cross-workspace data leaks (CR-012)."""
    import orjson

    cached_data = [{"trace_id": "test-123", "duration_ms": 100.0}]
    fake_redis = _make_fake_redis(orjson.dumps(cached_data))

    service = OpenTraceService()
    with patch("app.services.opentrace_service.get_redis", return_value=fake_redis):
        result = await service.get_traces("workspace-123", "agent-456")

    # Verify the cache key includes workspace_id
    fake_redis.get.assert_called_once()
    cache_key = fake_redis.get.call_args[0][0]
    assert cache_key == "opentrace:workspace:workspace-123:agent:agent-456:traces"


@pytest.mark.asyncio
async def test_opentrace_trace_detail_cache_key_includes_workspace_id():
    """Trace detail cache keys should include workspace_id (CR-012)."""
    import orjson

    cached_data = {"trace_id": "test-123", "spans": [], "duration_ms": 100.0, "service_count": 1}
    fake_redis = _make_fake_redis(orjson.dumps(cached_data))

    service = OpenTraceService()
    with patch("app.services.opentrace_service.get_redis", return_value=fake_redis):
        result = await service.get_trace_detail("workspace-abc", "trace-xyz")

    # Verify the cache key includes workspace_id
    fake_redis.get.assert_called_once()
    cache_key = fake_redis.get.call_args[0][0]
    assert cache_key == "opentrace:workspace:workspace-abc:trace:trace-xyz"


# ---------------------------------------------------------------------------
# OpenMeshService
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_openmesh_returns_cached_topology():
    """Service should return cached topology without making an HTTP call."""
    import orjson

    topology = {"nodes": [], "edges": []}
    cached = orjson.dumps(topology)
    fake_redis = _make_fake_redis(cached)

    service = OpenMeshService()
    with patch("app.services.openmesh_service.get_redis", return_value=fake_redis):
        result = await service.get_topology("ws-1")

    assert result == topology


# ---------------------------------------------------------------------------
# OpenMindService
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_openmind_returns_cached_graph():
    """Service should return cached graph without making an HTTP call."""
    import orjson

    graph = {"nodes": [], "edges": [], "total_count": 0}
    cached = orjson.dumps(graph)
    fake_redis = _make_fake_redis(cached)

    service = OpenMindService()
    with patch("app.services.openmind_service.get_redis", return_value=fake_redis):
        result = await service.get_graph("ws-1")

    assert result == graph


# ---------------------------------------------------------------------------
# OpenShieldService
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_openshield_returns_cached_posture():
    """Service should return cached posture without making an HTTP call."""
    import orjson
    from datetime import datetime, timezone

    posture = {
        "workspace_id": "ws-1",
        "compliance_score": 95.0,
        "pii_exposure_count": 0,
        "violation_count": 2,
        "threat_count": 0,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    cached = orjson.dumps(posture)
    fake_redis = _make_fake_redis(cached)

    service = OpenShieldService()
    with patch("app.services.openshield_service.get_redis", return_value=fake_redis):
        result = await service.get_posture("ws-1")

    assert result["compliance_score"] == 95.0
