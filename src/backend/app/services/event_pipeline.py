from datetime import datetime, timezone
import json
import redis.asyncio as aioredis


def normalise_event(raw: dict, workspace_id: str) -> dict:
    """Normalise an incoming event dict, injecting workspace_id and default timestamp."""
    return {
        "workspace_id": workspace_id,
        "event_type": raw.get("event_type", "unknown"),
        "agent_id": raw.get("agent_id"),
        "session_id": raw.get("session_id"),
        "timestamp": raw.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "extra_data": {k: v for k, v in raw.items() if k not in ("event_type", "agent_id", "session_id", "timestamp")},
    }


class EventPipeline:
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis

    async def publish(self, event: dict) -> None:
        stream_key = f"events:{event['workspace_id']}"
        payload = json.dumps(event, default=str)
        await self.redis.xadd(stream_key, {"payload": payload}, maxlen=100_000)
        # Fan out to WebSocket subscribers via Pub/Sub
        await self.redis.publish(f"ws:{event['workspace_id']}", payload)
