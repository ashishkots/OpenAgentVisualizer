"""Tests for the admin DLQ (dead letter queue) endpoints.

These tests use fakeredis to simulate Celery DLQ entries stored in the
``celery:dead_letter`` Redis list without requiring a running broker.
"""

import json
import base64
import pytest
import fakeredis.aioredis
from httpx import AsyncClient

from app.routers.admin import get_redis, _DLQ_REDIS_KEY


def _make_celery_message(task_id: str, task_name: str, args: list, kwargs: dict) -> str:
    """Encode a minimal Celery AMQP-style message as stored in the Redis list."""
    body_bytes = json.dumps([args, kwargs, {}]).encode()
    body_b64 = base64.b64encode(body_bytes).decode()
    message = {
        "headers": {
            "id": task_id,
            "task": task_name,
            "retries": 3,
        },
        "body": body_b64,
    }
    return json.dumps(message)


@pytest.mark.asyncio
async def test_list_dlq_empty(authed_client: AsyncClient) -> None:
    """GET /api/admin/dlq returns an empty list when no tasks are queued."""
    from app.main import app

    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    app.dependency_overrides[get_redis] = lambda: fake_redis

    try:
        r = await authed_client.get("/api/admin/dlq")
        assert r.status_code == 200
        assert r.json() == []
    finally:
        app.dependency_overrides.pop(get_redis, None)


@pytest.mark.asyncio
async def test_list_dlq_with_tasks(authed_client: AsyncClient) -> None:
    """GET /api/admin/dlq returns all tasks present in the DLQ Redis list."""
    from app.main import app

    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    app.dependency_overrides[get_redis] = lambda: fake_redis

    try:
        # Seed two tasks into the fake DLQ
        msg1 = _make_celery_message(
            "task-001", "app.tasks.achievements.unlock", ["agent-1"], {}
        )
        msg2 = _make_celery_message(
            "task-002", "app.tasks.graph.compute_agent_graph", [], {"workspace_id": "ws-1"}
        )
        await fake_redis.rpush(_DLQ_REDIS_KEY, msg1, msg2)

        r = await authed_client.get("/api/admin/dlq")
        assert r.status_code == 200
        body = r.json()
        assert len(body) == 2
        task_ids = {t["task_id"] for t in body}
        assert "task-001" in task_ids
        assert "task-002" in task_ids
        assert body[0]["queue"] == "dead_letter"
    finally:
        app.dependency_overrides.pop(get_redis, None)


@pytest.mark.asyncio
async def test_retry_dlq_task(authed_client: AsyncClient) -> None:
    """POST /api/admin/dlq/{task_id}/retry removes the task from DLQ and returns 202."""
    from unittest.mock import patch
    from app.main import app

    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    app.dependency_overrides[get_redis] = lambda: fake_redis

    try:
        msg = _make_celery_message(
            "task-999", "app.tasks.graph.compute_agent_graph", [], {"workspace_id": "ws-x"}
        )
        await fake_redis.rpush(_DLQ_REDIS_KEY, msg)

        # Patch Celery send_task so we don't need a real broker
        with patch("app.routers.admin.celery_app.send_task") as mock_send:
            r = await authed_client.post("/api/admin/dlq/task-999/retry")
            assert r.status_code == 202
            data = r.json()
            assert data["task_id"] == "task-999"
            assert data["status"] == "requeued"
            mock_send.assert_called_once()

        # Task must be removed from the DLQ
        remaining = await fake_redis.lrange(_DLQ_REDIS_KEY, 0, -1)
        assert len(remaining) == 0
    finally:
        app.dependency_overrides.pop(get_redis, None)


@pytest.mark.asyncio
async def test_retry_dlq_task_not_found(authed_client: AsyncClient) -> None:
    """POST /api/admin/dlq/{task_id}/retry returns 404 for unknown task IDs."""
    from app.main import app

    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    app.dependency_overrides[get_redis] = lambda: fake_redis

    try:
        r = await authed_client.post("/api/admin/dlq/does-not-exist/retry")
        assert r.status_code == 404
    finally:
        app.dependency_overrides.pop(get_redis, None)


@pytest.mark.asyncio
async def test_list_dlq_skips_malformed_entries(authed_client: AsyncClient) -> None:
    """GET /api/admin/dlq silently skips entries that cannot be parsed."""
    from app.main import app

    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    app.dependency_overrides[get_redis] = lambda: fake_redis

    try:
        # Push one valid and one malformed entry
        valid_msg = _make_celery_message("task-valid", "app.tasks.foo", [], {})
        await fake_redis.rpush(_DLQ_REDIS_KEY, "not-valid-json{{{", valid_msg)

        r = await authed_client.get("/api/admin/dlq")
        assert r.status_code == 200
        body = r.json()
        # Only the valid entry is returned
        assert len(body) == 1
        assert body[0]["task_id"] == "task-valid"
    finally:
        app.dependency_overrides.pop(get_redis, None)
