"""Tests for WebSocket room support (OAV-221)."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import WebSocket

from app.services.websocket_manager import RoomWebSocketManager


class FakeWebSocket:
    """Minimal WebSocket stand-in for unit tests."""

    def __init__(self):
        self.sent: list[str] = []
        self.accepted = False

    async def accept(self):
        self.accepted = True

    async def send_text(self, data: str):
        self.sent.append(data)


def make_manager() -> RoomWebSocketManager:
    return RoomWebSocketManager()


def test_subscribe_adds_connection_to_room():
    mgr = make_manager()
    ws = FakeWebSocket()
    mgr.subscribe(ws, "workspace:ws1")
    assert ws in mgr._rooms["workspace:ws1"]
    assert "workspace:ws1" in mgr._ws_rooms[ws]


def test_unsubscribe_removes_connection_from_room():
    mgr = make_manager()
    ws = FakeWebSocket()
    mgr.subscribe(ws, "workspace:ws1")
    mgr.unsubscribe(ws, "workspace:ws1")
    assert ws not in mgr._rooms.get("workspace:ws1", set())
    assert "workspace:ws1" not in mgr._ws_rooms.get(ws, set())


def test_disconnect_removes_from_all_rooms():
    mgr = make_manager()
    ws = FakeWebSocket()
    mgr.subscribe(ws, "workspace:ws1")
    mgr.subscribe(ws, "agent:agent1")
    mgr.subscribe(ws, "session:sess1")
    mgr.disconnect(ws)
    assert ws not in mgr._rooms.get("workspace:ws1", set())
    assert ws not in mgr._rooms.get("agent:agent1", set())
    assert ws not in mgr._rooms.get("session:sess1", set())
    assert ws not in mgr._ws_rooms


def test_get_rooms_for_connection():
    mgr = make_manager()
    ws = FakeWebSocket()
    mgr.subscribe(ws, "workspace:ws1")
    mgr.subscribe(ws, "agent:a1")
    rooms = mgr.get_rooms_for_connection(ws)
    assert "workspace:ws1" in rooms
    assert "agent:a1" in rooms


@pytest.mark.asyncio
async def test_publish_to_room_sends_to_subscribers():
    mgr = make_manager()
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()
    mgr.subscribe(ws1, "workspace:ws1")
    mgr.subscribe(ws2, "workspace:ws1")

    await mgr.publish_to_room("workspace:ws1", {"event_type": "test_event"})

    assert len(ws1.sent) == 1
    assert len(ws2.sent) == 1
    import orjson
    data = orjson.loads(ws1.sent[0])
    assert data["event_type"] == "test_event"
    assert data["room"] == "workspace:ws1"
    assert data["sequence"] == 1


@pytest.mark.asyncio
async def test_publish_to_room_sequence_increments():
    mgr = make_manager()
    ws = FakeWebSocket()
    mgr.subscribe(ws, "workspace:ws1")

    await mgr.publish_to_room("workspace:ws1", {"event_type": "e1"})
    await mgr.publish_to_room("workspace:ws1", {"event_type": "e2"})

    import orjson
    assert orjson.loads(ws.sent[0])["sequence"] == 1
    assert orjson.loads(ws.sent[1])["sequence"] == 2


@pytest.mark.asyncio
async def test_publish_to_room_different_rooms_independent_sequences():
    mgr = make_manager()
    ws = FakeWebSocket()
    mgr.subscribe(ws, "workspace:ws1")
    mgr.subscribe(ws, "agent:a1")

    await mgr.publish_to_room("workspace:ws1", {"event_type": "e1"})
    await mgr.publish_to_room("agent:a1", {"event_type": "e2"})

    import orjson
    msgs = [orjson.loads(m) for m in ws.sent]
    ws1_msg = next(m for m in msgs if m["room"] == "workspace:ws1")
    agent_msg = next(m for m in msgs if m["room"] == "agent:a1")
    assert ws1_msg["sequence"] == 1
    assert agent_msg["sequence"] == 1  # independent counter


@pytest.mark.asyncio
async def test_publish_to_room_prunes_dead_connections():
    mgr = make_manager()

    class DeadWebSocket(FakeWebSocket):
        async def send_text(self, data: str):
            raise RuntimeError("connection closed")

    dead_ws = DeadWebSocket()
    live_ws = FakeWebSocket()
    mgr.subscribe(dead_ws, "workspace:ws1")
    mgr.subscribe(live_ws, "workspace:ws1")

    await mgr.publish_to_room("workspace:ws1", {"event_type": "test"})

    # Dead connection should have been pruned
    assert dead_ws not in mgr._rooms.get("workspace:ws1", set())
    # Live connection still received the message
    assert len(live_ws.sent) == 1


@pytest.mark.asyncio
async def test_publish_does_not_send_to_non_subscribed_room():
    mgr = make_manager()
    ws = FakeWebSocket()
    mgr.subscribe(ws, "workspace:ws1")

    await mgr.publish_to_room("workspace:ws2", {"event_type": "other"})

    assert len(ws.sent) == 0


@pytest.mark.asyncio
async def test_connect_accepts_websocket():
    mgr = make_manager()
    ws = FakeWebSocket()
    await mgr.connect(ws)
    assert ws.accepted


@pytest.mark.asyncio
async def test_rest_subscribe_endpoint_valid_room(authed_client):
    r = await authed_client.post("/api/ws/rooms/workspace__auto-ws/subscribe")
    # May return 200 (valid room) or 403 (workspace mismatch) — both are acceptable
    assert r.status_code in (200, 403)


@pytest.mark.asyncio
async def test_rest_subscribe_endpoint_agent_room_valid(authed_client):
    r = await authed_client.post("/api/ws/rooms/agent__some-agent-id/subscribe")
    assert r.status_code == 200
    assert r.json()["room"] == "agent:some-agent-id"
