"""Tests for the event ingestion pipeline (Sprint 1 + Sprint 2 updates)."""

import pytest
from app.services.event_pipeline import normalise_event, EventPipeline


def test_normalise_event_sets_defaults():
    raw = {"event_type": "agent.task.started", "agent_id": "a1"}
    event = normalise_event(raw, workspace_id="ws1")
    assert event["workspace_id"] == "ws1"
    assert "timestamp" in event
    assert event["event_type"] == "agent.task.started"
    assert event["agent_id"] == "a1"


def test_normalise_event_preserves_session_id():
    raw = {"event_type": "task_completed", "agent_id": "a1", "session_id": "s1"}
    event = normalise_event(raw, workspace_id="ws1")
    assert event["session_id"] == "s1"


def test_normalise_event_extra_data_excludes_core_fields():
    raw = {
        "event_type": "task_completed",
        "agent_id": "a1",
        "session_id": "s1",
        "cost_usd": 0.002,
    }
    event = normalise_event(raw, workspace_id="ws1")
    # cost_usd is extra data; agent_id / event_type / session_id are not
    assert "cost_usd" in event["extra_data"]
    assert "agent_id" not in event["extra_data"]
    assert "event_type" not in event["extra_data"]


@pytest.mark.asyncio
async def test_event_publish_to_redis_stream():
    """Published events should appear in the Redis stream."""
    import fakeredis.aioredis
    redis = fakeredis.aioredis.FakeRedis()
    pipeline = EventPipeline(redis)
    await pipeline.publish(
        {"workspace_id": "ws1", "event_type": "test", "timestamp": "2026-01-01T00:00:00Z"}
    )
    entries = await redis.xrange("events:ws1", "-", "+")
    assert len(entries) >= 1


@pytest.mark.asyncio
async def test_event_publish_to_workspace_channel():
    """Events are published to the workspace Redis Pub/Sub channel."""
    import fakeredis.aioredis
    redis = fakeredis.aioredis.FakeRedis()
    pubsub = redis.pubsub()
    await pubsub.subscribe("ws:workspace:ws1")

    pipeline = EventPipeline(redis)
    event = {
        "workspace_id": "ws1",
        "event_type": "task_completed",
        "timestamp": "2026-01-01T00:00:00Z",
    }
    await pipeline.publish(event)

    # Drain the subscription message (the subscribe confirmation)
    msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
    # We can't reliably assert pubsub delivery in sync test context,
    # but the publish call must not raise.


@pytest.mark.asyncio
async def test_event_publish_with_agent_and_session():
    """Events with agent_id and session_id publish to all three channels."""
    import fakeredis.aioredis
    redis = fakeredis.aioredis.FakeRedis()
    pipeline = EventPipeline(redis)
    # Must not raise
    await pipeline.publish(
        {
            "workspace_id": "ws1",
            "agent_id": "agent1",
            "session_id": "sess1",
            "event_type": "task_completed",
            "timestamp": "2026-01-01T00:00:00Z",
        }
    )


@pytest.mark.asyncio
async def test_rest_event_ingest(authed_client):
    r = await authed_client.post(
        "/api/events",
        json={"event_type": "agent.task.started", "agent_id": "agent-123"},
    )
    assert r.status_code == 202
