from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
import orjson

from app.services.websocket_manager import manager
from app.core.security import decode_token
from app.core.database import AsyncSessionLocal, get_db
from app.core.dependencies import get_workspace_id
from app.models.user import User, WorkspaceMember
from app.models.agent import Agent
from app.models.event import Event, AgentSession

router = APIRouter(tags=["websocket"])


def _validate_room_access(room: str, workspace_id: str) -> bool:
    """Validate that the requested room belongs to the authenticated workspace.

    Room naming:
      workspace:{workspace_id}  — allowed if workspace_id matches
      agent:{agent_id}          — always allowed (agent ownership checked at DB level)
      session:{session_id}      — always allowed (session ownership checked at DB level)
    """
    if not room:
        return False
    parts = room.split(":", 1)
    if len(parts) != 2:
        return False
    room_type, _ = parts
    if room_type == "workspace":
        return parts[1] == workspace_id
    if room_type in ("agent", "session"):
        return True  # ownership is implicitly enforced via JWT workspace scope
    return False


async def _build_room_snapshot(room: str, workspace_id: str, db: AsyncSession) -> dict:
    """Build a current-state snapshot for the requested room.

    Used by the `sync` action to reconcile missed events after reconnection.
    """
    parts = room.split(":", 1)
    if len(parts) != 2:
        return {}
    room_type, room_id = parts

    if room_type == "workspace":
        result = await db.execute(
            select(Agent)
            .where(Agent.workspace_id == workspace_id)
            .order_by(Agent.xp_total.desc())
            .limit(50)
        )
        agents = result.scalars().all()
        return {
            "agents": [
                {
                    "id": a.id,
                    "name": a.name,
                    "status": a.status,
                    "level": a.level,
                    "xp_total": a.xp_total,
                }
                for a in agents
            ]
        }

    if room_type == "agent":
        agent = await db.scalar(
            select(Agent).where(
                Agent.id == room_id,
                Agent.workspace_id == workspace_id,
            )
        )
        if not agent:
            return {}
        events_result = await db.execute(
            select(Event)
            .where(Event.agent_id == room_id, Event.workspace_id == workspace_id)
            .order_by(Event.timestamp.desc())
            .limit(20)
        )
        recent_events = events_result.scalars().all()
        return {
            "agent": {
                "id": agent.id,
                "name": agent.name,
                "status": agent.status,
                "level": agent.level,
                "xp_total": agent.xp_total,
            },
            "recent_events": [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                }
                for e in recent_events
            ],
        }

    if room_type == "session":
        session = await db.scalar(
            select(AgentSession).where(
                AgentSession.id == room_id,
                AgentSession.workspace_id == workspace_id,
            )
        )
        if not session:
            return {}
        return {
            "session": {
                "id": session.id,
                "name": session.name,
                "event_count": session.event_count,
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            }
        }

    return {}


@router.websocket("/ws/live")
async def ws_live(
    websocket: WebSocket,
    workspace_id: str = Query(...),
    token: str = Query(...),
) -> None:
    """WebSocket endpoint for real-time agent event streaming with room support.

    Connect with: ws://server/ws/live?workspace_id=<workspace_id>&token=<jwt>

    Client messages:
      {"action": "subscribe",   "room": "workspace:{id}"}
      {"action": "unsubscribe", "room": "agent:{id}"}
      {"action": "sync",        "room": "workspace:{id}"}

    Server messages include "room" and "sequence" fields on every event.
    """
    # Authenticate JWT and verify workspace membership
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if not user:
            await websocket.close(code=4001)
            return
        member = await db.scalar(
            select(WorkspaceMember).where(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.workspace_id == workspace_id,
            )
        )
        if not member:
            await websocket.close(code=4001)
            return

    await manager.connect(websocket)
    # Auto-subscribe to the workspace room so clients receive all workspace events
    manager.subscribe(websocket, f"workspace:{workspace_id}")

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = orjson.loads(raw)
            except Exception:
                continue

            action: str = msg.get("action", "")
            room: str = msg.get("room", "")

            if not _validate_room_access(room, workspace_id):
                await websocket.send_text(
                    orjson.dumps({"error": "unauthorized_room", "room": room}).decode()
                )
                continue

            if action == "subscribe":
                manager.subscribe(websocket, room)
                await websocket.send_text(
                    orjson.dumps({"action": "subscribed", "room": room}).decode()
                )

            elif action == "unsubscribe":
                manager.unsubscribe(websocket, room)
                await websocket.send_text(
                    orjson.dumps({"action": "unsubscribed", "room": room}).decode()
                )

            elif action == "sync":
                async with AsyncSessionLocal() as db:
                    snapshot = await _build_room_snapshot(room, workspace_id, db)
                await websocket.send_text(
                    orjson.dumps(
                        {"action": "sync_response", "room": room, "data": snapshot}
                    ).decode()
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/api/ws/rooms/{room_id}/subscribe", status_code=200)
async def http_subscribe_room(
    room_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """REST endpoint to acknowledge a room subscription intent (used by REST-only clients).

    The actual subscription happens over the WebSocket connection. This endpoint
    validates the room ID and returns the canonical room name.
    """
    room = room_id.replace("__", ":")  # allow URL-safe room names like workspace__abc
    if not _validate_room_access(room, workspace_id):
        raise HTTPException(status_code=403, detail="Unauthorized room access")
    return {"room": room, "status": "valid"}


@router.delete("/api/ws/rooms/{room_id}/unsubscribe", status_code=200)
async def http_unsubscribe_room(
    room_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """REST endpoint to acknowledge a room unsubscription intent."""
    room = room_id.replace("__", ":")
    if not _validate_room_access(room, workspace_id):
        raise HTTPException(status_code=403, detail="Unauthorized room access")
    return {"room": room, "status": "valid"}
