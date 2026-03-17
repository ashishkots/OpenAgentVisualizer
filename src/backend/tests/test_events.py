import pytest
from app.services.event_pipeline import normalise_event, EventPipeline


def test_normalise_event_sets_defaults():
    raw = {"event_type": "agent.task.started", "agent_id": "a1"}
    event = normalise_event(raw, workspace_id="ws1")
    assert event["workspace_id"] == "ws1"
    assert "timestamp" in event
    assert event["event_type"] == "agent.task.started"
    assert event["agent_id"] == "a1"


@pytest.mark.asyncio
async def test_event_publish_to_redis():
    import fakeredis.aioredis
    redis = fakeredis.aioredis.FakeRedis()
    pipeline = EventPipeline(redis)
    await pipeline.publish({"workspace_id": "ws1", "event_type": "test", "timestamp": "2026-01-01T00:00:00Z"})
    entries = await redis.xrange("events:ws1", "-", "+")
    assert len(entries) >= 1


@pytest.mark.asyncio
async def test_rest_event_ingest(authed_client):
    r = await authed_client.post("/api/events", json={
        "event_type": "agent.task.started",
        "agent_id": "agent-123"
    })
    assert r.status_code == 202
