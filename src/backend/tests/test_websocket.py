import pytest
import json

# httpx-ws is required for WebSocket testing but not installed in the current
# test environment. Tests are skipped until the dependency is available.


@pytest.mark.skip(reason="httpx-ws not installed in test environment")
@pytest.mark.asyncio
async def test_websocket_connects(client):
    """Test that WebSocket connection is accepted.

    Requires: httpx-ws==0.6.0 (in requirements.txt, installed in Docker)
    """
    from httpx_ws import aconnect_ws
    async with aconnect_ws("ws://test/ws/live?workspace_id=ws-test", client) as ws:
        await ws.send_text(json.dumps({"type": "ping"}))
        assert ws is not None
