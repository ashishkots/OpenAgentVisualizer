from datetime import datetime, timezone
import redis.asyncio as aioredis
import orjson


def normalise_event(raw: dict, workspace_id: str) -> dict:
    """Normalise an incoming event dict, injecting workspace_id and default timestamp."""
    return {
        "workspace_id": workspace_id,
        "event_type": raw.get("event_type", "unknown"),
        "agent_id": raw.get("agent_id"),
        "session_id": raw.get("session_id"),
        "timestamp": raw.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "extra_data": {
            k: v
            for k, v in raw.items()
            if k not in ("event_type", "agent_id", "session_id", "timestamp")
        },
    }


class EventPipeline:
    def __init__(self, redis: aioredis.Redis) -> None:
        self.redis = redis

    async def publish(self, event: dict) -> None:
        """Persist event to Redis stream and fan out to all relevant WebSocket rooms.

        Publishes to:
          - ws:workspace:{workspace_id}  — always
          - ws:agent:{agent_id}          — when agent_id is present
          - ws:session:{session_id}      — when session_id is present
        """
        workspace_id = event["workspace_id"]
        agent_id = event.get("agent_id")
        session_id = event.get("session_id")
        payload = orjson.dumps(event, option=orjson.OPT_NON_STR_KEYS)

        # Persist to Redis stream for durability
        stream_key = f"events:{workspace_id}"
        await self.redis.xadd(stream_key, {"payload": payload}, maxlen=100_000)

        # Fan out to WebSocket room channels via Pub/Sub
        await self.redis.publish(f"ws:workspace:{workspace_id}", payload)
        if agent_id:
            await self.redis.publish(f"ws:agent:{agent_id}", payload)
        if session_id:
            await self.redis.publish(f"ws:session:{session_id}", payload)
