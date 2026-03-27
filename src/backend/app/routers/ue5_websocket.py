"""UE5 Pixel Streaming WebSocket endpoint.

Provides a bidirectional relay channel between the React web app and the
Unreal Engine 5 Pixel Streaming application.

Auth:
    Web clients authenticate via JWT token query param (same as /ws/live).
    UE5 application authenticates via api_key query param (ADR-009).

Protocol:
    All messages are JSON with the envelope:
        {
            "type": "<message_type>",
            "source": "web" | "ue5",
            "workspace_id": "<uuid>",
            "payload": { ... },
            "timestamp": "<ISO 8601>"
        }

    Web -> UE5 message types (5):
        focus_agent, select_agent, deselect_all, set_view_mode, sync_agents

    UE5 -> Web message types (3):
        agent_clicked, camera_moved, scene_ready

    Backend-originated message types (2):
        agent_state_changed, agent_spawned
"""

import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

import orjson
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.dependencies import get_workspace_id_from_api_key
from app.core.redis_client import get_redis
from app.core.security import decode_token
from app.models.agent import Agent
from app.models.user import APIKey, User, WorkspaceMember
from app.core.security import pwd_context as _pwd_ctx

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ue5"])

# --- In-memory connection registry (one UE5 per workspace, N web clients) ---
# workspace_id -> single UE5 WebSocket
_ue5_connections: dict[str, WebSocket] = {}
# workspace_id -> set of web WebSocket connections
_web_connections: dict[str, set[WebSocket]] = defaultdict(set)

# Valid web-originated message types
_WEB_TO_UE5_TYPES = {
    "focus_agent",
    "select_agent",
    "deselect_all",
    "set_view_mode",
    "sync_agents",
}

# Valid UE5-originated message types
_UE5_TO_WEB_TYPES = {
    "agent_clicked",
    "camera_moved",
    "scene_ready",
}


async def _authenticate_jwt(token: str, workspace_id: str) -> bool:
    """Validate a JWT token and verify workspace membership.

    Returns True if authentication succeeds.
    """
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return False
    except JWTError:
        return False

    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if not user:
            return False
        member = await db.scalar(
            select(WorkspaceMember).where(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.workspace_id == workspace_id,
            )
        )
        return member is not None


async def _authenticate_api_key(api_key: str) -> Optional[str]:
    """Resolve a raw API key to its workspace_id.

    Returns workspace_id on success, None on failure.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(APIKey)
            .where(APIKey.is_active == True)  # noqa: E712
            .limit(50)
        )
        keys = result.scalars().all()
        for key in keys:
            if _pwd_ctx.verify(api_key, key.key_hash):
                return key.workspace_id
    return None


def _register(workspace_id: str, source: str, ws: WebSocket) -> None:
    """Register a new connection in the appropriate registry."""
    if source == "ue5":
        _ue5_connections[workspace_id] = ws
        logger.info("UE5 connected for workspace %s", workspace_id)
    else:
        _web_connections[workspace_id].add(ws)
        logger.debug("Web client connected to UE5 channel, workspace %s", workspace_id)


def _unregister(workspace_id: str, source: str, ws: WebSocket) -> None:
    """Remove a connection from the registry."""
    if source == "ue5":
        if _ue5_connections.get(workspace_id) is ws:
            del _ue5_connections[workspace_id]
            logger.info("UE5 disconnected from workspace %s", workspace_id)
    else:
        _web_connections[workspace_id].discard(ws)


async def _relay(workspace_id: str, source: str, msg: dict) -> None:
    """Route a message to the appropriate targets.

    web -> UE5: forward to the UE5 connection for this workspace.
    ue5 -> web: broadcast to all web connections for this workspace.
    """
    msg_type = msg.get("type", "")
    data = orjson.dumps(msg).decode()

    if source == "web":
        ue5_ws = _ue5_connections.get(workspace_id)
        if ue5_ws is not None:
            try:
                await ue5_ws.send_text(data)
            except Exception:
                _unregister(workspace_id, "ue5", ue5_ws)
    elif source == "ue5":
        dead: set[WebSocket] = set()
        for web_ws in list(_web_connections.get(workspace_id, set())):
            try:
                await web_ws.send_text(data)
            except Exception:
                dead.add(web_ws)
        for ws in dead:
            _unregister(workspace_id, "web", ws)


async def _build_sync_agents_payload(workspace_id: str) -> dict:
    """Build the sync_agents payload with current agent states."""
    async with AsyncSessionLocal() as db:
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


async def _send_initial_sync(workspace_id: str, ws: WebSocket) -> None:
    """Send initial agent state sync to a newly connected UE5 client."""
    try:
        payload = await _build_sync_agents_payload(workspace_id)
        msg = {
            "type": "sync_agents",
            "source": "backend",
            "workspace_id": workspace_id,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await ws.send_text(orjson.dumps(msg).decode())
    except Exception as exc:
        logger.error("Failed to send initial sync to UE5: %s", exc)


@router.websocket("/ws/ue5")
async def ws_ue5(
    websocket: WebSocket,
    workspace_id: str = Query(..., description="Workspace ID"),
    token: Optional[str] = Query(None, description="JWT token (web clients)"),
    api_key: Optional[str] = Query(None, description="API key (UE5 application)"),
) -> None:
    """Bidirectional relay between React web clients and the UE5 application.

    Web clients authenticate via JWT token query param.
    UE5 connects with a service API key via api_key query param.
    """
    source: Optional[str] = None

    if api_key:
        resolved_workspace = await _authenticate_api_key(api_key)
        if resolved_workspace and resolved_workspace == workspace_id:
            source = "ue5"
        else:
            await websocket.close(code=4001)
            return
    elif token:
        if await _authenticate_jwt(token, workspace_id):
            source = "web"
        else:
            await websocket.close(code=4001)
            return
    else:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    _register(workspace_id, source, websocket)

    # On UE5 connect: send current agent state immediately
    if source == "ue5":
        await _send_initial_sync(workspace_id, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = orjson.loads(raw)
            except Exception:
                continue

            msg_type = msg.get("type", "")

            # Validate message direction
            if source == "web" and msg_type not in _WEB_TO_UE5_TYPES:
                logger.debug("Ignoring unknown web message type: %s", msg_type)
                continue
            if source == "ue5" and msg_type not in _UE5_TO_WEB_TYPES:
                logger.debug("Ignoring unknown UE5 message type: %s", msg_type)
                continue

            msg["source"] = source
            msg["workspace_id"] = workspace_id
            if "timestamp" not in msg:
                msg["timestamp"] = datetime.now(timezone.utc).isoformat()

            await _relay(workspace_id, source, msg)

    except WebSocketDisconnect:
        _unregister(workspace_id, source, websocket)
    except Exception as exc:
        logger.error("UE5 WebSocket error (source=%s, workspace=%s): %s", source, workspace_id, exc)
        _unregister(workspace_id, source, websocket)


@router.get("/api/ue5/status")
async def ue5_status() -> dict:
    """Return UE5 connection status by workspace.

    This endpoint does not require authentication — it only reports
    whether any UE5 application is currently connected.
    """
    return {
        "connected_workspaces": list(_ue5_connections.keys()),
        "total_ue5_connections": len(_ue5_connections),
        "total_web_connections": sum(len(s) for s in _web_connections.values()),
    }


async def broadcast_agent_state_changed(
    workspace_id: str,
    agent_id: str,
    status: str,
    level: int,
    xp_total: int,
) -> None:
    """Broadcast an agent_state_changed event to all UE5 and web clients.

    Called by the event pipeline when an agent's state changes.
    """
    msg = {
        "type": "agent_state_changed",
        "source": "backend",
        "workspace_id": workspace_id,
        "payload": {
            "agent_id": agent_id,
            "status": status,
            "level": level,
            "xp_total": xp_total,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    data = orjson.dumps(msg).decode()

    targets: list[WebSocket] = []
    if workspace_id in _ue5_connections:
        targets.append(_ue5_connections[workspace_id])
    targets.extend(_web_connections.get(workspace_id, set()))

    dead: list[WebSocket] = []
    for ws in targets:
        try:
            await ws.send_text(data)
        except Exception:
            dead.append(ws)

    for ws in dead:
        _unregister(workspace_id, "ue5" if ws is _ue5_connections.get(workspace_id) else "web", ws)


async def broadcast_agent_spawned(
    workspace_id: str,
    agent_id: str,
    agent_name: str,
    agent_status: str,
) -> None:
    """Broadcast an agent_spawned event when a new agent is registered."""
    msg = {
        "type": "agent_spawned",
        "source": "backend",
        "workspace_id": workspace_id,
        "payload": {
            "agent_id": agent_id,
            "name": agent_name,
            "status": agent_status,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    data = orjson.dumps(msg).decode()

    targets: list[WebSocket] = []
    if workspace_id in _ue5_connections:
        targets.append(_ue5_connections[workspace_id])
    targets.extend(_web_connections.get(workspace_id, set()))

    dead: list[WebSocket] = []
    for ws in targets:
        try:
            await ws.send_text(data)
        except Exception:
            dead.append(ws)

    for ws in dead:
        _unregister(workspace_id, "ue5" if ws is _ue5_connections.get(workspace_id) else "web", ws)
