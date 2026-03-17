import json
from fastapi import WebSocket
from collections import defaultdict
import redis.asyncio as aioredis


class WebSocketManager:
    def __init__(self):
        # {workspace_id: set[WebSocket]}
        self._connections: dict = defaultdict(set)

    async def connect(self, ws: WebSocket, workspace_id: str) -> None:
        await ws.accept()
        self._connections[workspace_id].add(ws)

    def disconnect(self, ws: WebSocket, workspace_id: str) -> None:
        self._connections[workspace_id].discard(ws)

    async def broadcast(self, workspace_id: str, message: str) -> None:
        """Send message to all connected clients in a workspace. Dead connections are pruned."""
        dead = set()
        for ws in list(self._connections.get(workspace_id, set())):
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[workspace_id].discard(ws)

    async def start_redis_listener(self, redis: aioredis.Redis) -> None:
        """Listen to Redis Pub/Sub and fanout to connected WebSocket clients.

        Subscribes to all workspace channels (ws:*) and broadcasts each message
        to the relevant workspace's connected clients.
        """
        pubsub = redis.pubsub()
        await pubsub.psubscribe("ws:*")
        async for msg in pubsub.listen():
            if msg["type"] == "pmessage":
                channel = msg["channel"]
                workspace_id = channel.split(":", 1)[1]
                await self.broadcast(workspace_id, msg["data"])


# Global singleton manager
manager = WebSocketManager()
