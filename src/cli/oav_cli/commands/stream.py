"""oav events — stream real-time events from the backend WebSocket."""

import asyncio
from typing import Optional

import click
from rich.console import Console
from rich.live import Live
from rich.text import Text

from oav_cli.client import OAVClientError, stream_events
from oav_cli.config import load_config
from oav_cli.display import event_row

console = Console()

_MAX_LINES = 50  # Scroll buffer depth


@click.command("events")
@click.option("--agent", default=None, help="Filter to a specific agent ID")
@click.option("--type", "event_type", default=None, help="Filter by event type")
@click.option("--count", default=0, help="Stop after N events (0 = unlimited)")
def events_cmd(agent: Optional[str], event_type: Optional[str], count: int) -> None:
    """Stream real-time events from the workspace WebSocket.

    Press Ctrl+C to stop.
    """
    cfg = load_config()
    workspace_id = cfg.get("workspace_id", "")
    api_key = cfg.get("api_key", "")
    base_url = cfg.get("url", "http://localhost:8000")

    if not workspace_id:
        console.print("[red]Error:[/red] workspace_id not set. Run: oav config set workspace_id <id>")
        raise SystemExit(1)
    if not api_key:
        console.print("[red]Error:[/red] api_key not set. Run: oav config set api_key <key>")
        raise SystemExit(1)

    console.print(f"[dim]Streaming events for workspace [bold]{workspace_id}[/bold]...[/dim]")
    console.print("[dim]Press Ctrl+C to stop.[/dim]\n")

    async def _run() -> None:
        lines: list[str] = []
        seen = 0

        async for event in stream_events(workspace_id, api_key, base_url, agent_id=agent):
            # Filter by event type if specified
            et = event.get("event_type", event.get("type", ""))
            if event_type and et != event_type:
                continue

            lines.append(event_row(event))
            if len(lines) > _MAX_LINES:
                lines = lines[-_MAX_LINES:]

            console.print(event_row(event))
            seen += 1
            if count and seen >= count:
                break

    try:
        asyncio.run(_run())
    except KeyboardInterrupt:
        console.print("\n[dim]Stopped.[/dim]")
