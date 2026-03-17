from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select
from jose import JWTError
from app.services.websocket_manager import manager
from app.core.security import decode_token
from app.core.database import AsyncSessionLocal
from app.models.user import User, WorkspaceMember

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/live")
async def ws_live(
    websocket: WebSocket,
    workspace_id: str = Query(...),
    token: str = Query(...),
):
    """WebSocket endpoint for real-time agent event streaming.

    Connect with: ws://server/ws/live?workspace_id=<workspace_id>&token=<jwt>
    Receives: JSON event objects published to ws:{workspace_id} Redis channel.
    """
    # Validate JWT token and verify workspace membership
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

    await manager.connect(websocket, workspace_id)
    try:
        while True:
            # Keep connection alive, handle client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)
