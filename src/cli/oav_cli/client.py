"""HTTP + WebSocket client for the OAV backend.

Authenticates via X-API-Key header (ADR-009 — CLI uses API key, not JWT).
"""

import json
import logging
from typing import Any, AsyncIterator, Optional

import httpx

from oav_cli.config import load_config

logger = logging.getLogger(__name__)


class OAVClientError(Exception):
    """Raised when an API call fails."""

    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class OAVClient:
    """Synchronous HTTP client for OAV REST API.

    Reads server URL and API key from ~/.oav/config.toml.
    All requests include X-API-Key header for authentication.
    """

    def __init__(self) -> None:
        cfg = load_config()
        self.base_url: str = cfg.get("url", "http://localhost:8000").rstrip("/")
        self.api_key: str = cfg.get("api_key", "")
        self.workspace_id: str = cfg.get("workspace_id", "")
        self._http = httpx.Client(
            base_url=self.base_url,
            headers={
                "X-API-Key": self.api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=15.0,
        )

    def _raise_for_status(self, resp: httpx.Response) -> None:
        """Raise OAVClientError with a user-friendly message on HTTP errors."""
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            try:
                detail = exc.response.json().get("detail", str(exc))
            except Exception:
                detail = str(exc)
            raise OAVClientError(detail, status_code=exc.response.status_code) from exc

    def get(self, path: str, params: Optional[dict[str, Any]] = None) -> Any:
        """Make a GET request and return the parsed JSON response."""
        resp = self._http.get(path, params=params)
        self._raise_for_status(resp)
        return resp.json()

    def post(self, path: str, json_body: Optional[dict[str, Any]] = None) -> Any:
        """Make a POST request and return the parsed JSON response."""
        resp = self._http.post(path, json=json_body)
        self._raise_for_status(resp)
        return resp.json()

    def put(self, path: str, json_body: Optional[dict[str, Any]] = None) -> Any:
        """Make a PUT request and return the parsed JSON response."""
        resp = self._http.put(path, json=json_body)
        self._raise_for_status(resp)
        return resp.json()

    def health(self) -> dict[str, Any]:
        """Check backend health."""
        return self.get("/api/health")

    def list_agents(self) -> list[dict[str, Any]]:
        """List all agents in the workspace."""
        return self.get("/api/agents")

    def get_agent_stats(self, agent_id: str) -> dict[str, Any]:
        """Get stats for a specific agent."""
        return self.get(f"/api/agents/{agent_id}/stats")

    def get_metrics(self) -> dict[str, Any]:
        """Get cost and token metrics."""
        return self.get("/api/metrics/costs")

    def get_leaderboard(self, period: str = "all_time") -> dict[str, Any]:
        """Get the agent XP leaderboard."""
        return self.get("/api/gamification/leaderboard", params={"period": period})

    def get_agent_graph(self) -> dict[str, Any]:
        """Get the agent relationship graph (202 if computing)."""
        return self.get("/api/agents/graph")

    def update_agent_status(self, agent_id: str, status: str) -> dict[str, Any]:
        """Update an agent's status (active | idle | error)."""
        return self.put(f"/api/agents/{agent_id}", json_body={"status": status})

    def __enter__(self) -> "OAVClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self._http.close()


async def stream_events(
    workspace_id: str,
    api_key: str,
    base_url: str,
    agent_id: Optional[str] = None,
) -> AsyncIterator[dict[str, Any]]:
    """Connect to /ws/live and yield events as they arrive.

    Uses API key authentication via the api_key query param (ADR-009).
    Subscribes to the workspace room; optionally subscribes to an agent room.

    Args:
        workspace_id: Workspace to stream events for.
        api_key: API key for authentication.
        base_url: Backend base URL (http:// or https://).
        agent_id: Optional agent ID to additionally subscribe to.

    Yields:
        Parsed JSON event dicts.
    """
    import websockets

    ws_base = base_url.replace("https://", "wss://").replace("http://", "ws://")
    url = f"{ws_base}/ws/live?workspace_id={workspace_id}&api_key={api_key}"

    async with websockets.connect(url) as ws:  # type: ignore[attr-defined]
        # Subscribe to workspace room
        await ws.send(json.dumps({"action": "subscribe", "room": f"workspace:{workspace_id}"}))

        if agent_id:
            await ws.send(json.dumps({"action": "subscribe", "room": f"agent:{agent_id}"}))

        async for raw_msg in ws:
            try:
                yield json.loads(raw_msg)
            except (json.JSONDecodeError, TypeError):
                continue
