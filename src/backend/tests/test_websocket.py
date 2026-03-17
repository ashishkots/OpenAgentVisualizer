import pytest
import json
import asyncio

# httpx-ws is required for WebSocket testing but not installed in the current
# test environment. Tests are skipped until the dependency is available.
pytestmark = pytest.mark.skip(reason="httpx-ws not installed in test environment")

try:
    from httpx import AsyncClient
    from httpx_ws import aconnect_ws
    pytestmark = None  # Unset skip if import succeeds
except ImportError:
    pass


@pytest.mark.asyncio
async def test_websocket_connects(client: AsyncClient):
    """Test that WebSocket connection is accepted."""
    async with aconnect_ws("ws://test/ws/live?workspace_id=ws-test", client) as ws:
        # Just connecting should work — send a ping-like message
        await ws.send_text(json.dumps({"type": "ping"}))
        # Connection was accepted
        assert ws is not None
