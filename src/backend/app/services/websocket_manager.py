from collections import defaultdict
from fastapi import WebSocket
import redis.asyncio as aioredis
import orjson


class RoomWebSocketManager:
    """Manages WebSocket connections with Redis Pub/Sub room-based subscriptions.

    Room naming convention:
      - workspace:{workspace_id}  — all events for a workspace
      - agent:{agent_id}          — single agent events
      - session:{session_id}      — single session events
    """

    def __init__(self) -> None:
        # room_name -> set of connected WebSocket objects
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)
        # ws -> set of room names (for cleanup on disconnect)
        self._ws_rooms: dict[WebSocket, set[str]] = defaultdict(set)
        # room -> monotonically increasing sequence counter
        self._sequences: dict[str, int] = defaultdict(int)

    async def connect(self, ws: WebSocket) -> None:
        """Accept the WebSocket handshake."""
        await ws.accept()
        try:
            from app.core.metrics import oav_websocket_connections_active
            oav_websocket_connections_active.inc()
        except Exception:
            pass  # Metrics import may fail during tests

    def subscribe(self, ws: WebSocket, room: str) -> None:
        """Subscribe a connection to a room."""
        self._rooms[room].add(ws)
        self._ws_rooms[ws].add(room)

    def unsubscribe(self, ws: WebSocket, room: str) -> None:
        """Unsubscribe a connection from a room."""
        self._rooms[room].discard(ws)
        self._ws_rooms[ws].discard(room)

    def disconnect(self, ws: WebSocket) -> None:
        """Remove a connection from all rooms and clean up."""
        was_connected = ws in self._ws_rooms
        for room in list(self._ws_rooms.pop(ws, set())):
            self._rooms[room].discard(ws)
        if was_connected:
            try:
                from app.core.metrics import oav_websocket_connections_active
                oav_websocket_connections_active.dec()
            except Exception:
                pass  # Metrics import may fail during tests

    def get_rooms_for_connection(self, ws: WebSocket) -> set[str]:
        """Return the set of rooms a connection is subscribed to."""
        return set(self._ws_rooms.get(ws, set()))

    async def publish_to_room(self, room: str, message: dict) -> None:
        """Send a message to all connections subscribed to a room.

        Attaches the room name and an incrementing sequence number to the
        message before sending, then prunes any dead connections.
        """
        self._sequences[room] += 1
        message["room"] = room
        message["sequence"] = self._sequences[room]
        data = orjson.dumps(message).decode()
        dead: set[WebSocket] = set()
        for ws in list(self._rooms.get(room, set())):
            try:
                await ws.send_text(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(ws)

    async def start_redis_listener(self, redis_conn: aioredis.Redis) -> None:
        """Listen to Redis Pub/Sub for room channels and fan out to subscribers.

        Expected channel format: ws:workspace:{id}, ws:agent:{id}, ws:session:{id}
        The room name is the channel key with the leading "ws:" stripped.
        """
        pubsub = redis_conn.pubsub()
        await pubsub.psubscribe("ws:*")
        async for msg in pubsub.listen():
            if msg["type"] != "pmessage":
                continue
            channel: str = msg["channel"]
            if isinstance(channel, bytes):
                channel = channel.decode()
            # Strip the "ws:" prefix to get the room name
            room = channel[3:]
            try:
                payload = orjson.loads(msg["data"])
            except Exception:
                continue
            await self.publish_to_room(room, payload)


# Global singleton manager used by the WebSocket router
manager = RoomWebSocketManager()
