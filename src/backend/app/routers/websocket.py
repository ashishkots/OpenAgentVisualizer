from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/live")
async def ws_live(
    websocket: WebSocket,
    workspace_id: str = Query(...),
):
    """WebSocket endpoint for real-time agent event streaming.

    Connect with: ws://server/ws/live?workspace_id=<workspace_id>
    Receives: JSON event objects published to ws:{workspace_id} Redis channel.
    """
    await manager.connect(websocket, workspace_id)
    try:
        while True:
            # Keep connection alive, handle client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)
