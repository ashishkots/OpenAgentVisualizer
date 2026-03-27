"""oav start / stop — control agent lifecycle status."""

import click
from rich.console import Console

from oav_cli.client import OAVClient, OAVClientError
from oav_cli.display import status_badge

console = Console()


@click.command("start")
@click.argument("agent_id")
def start_cmd(agent_id: str) -> None:
    """Set an agent's status to 'active'."""
    with OAVClient() as client:
        try:
            result = client.update_agent_status(agent_id, "active")
            name = result.get("name", agent_id[:8])
            console.print(f"[green]Started[/green] agent [bold]{name}[/bold] ({agent_id})")
        except OAVClientError as exc:
            console.print(f"[red]Error:[/red] {exc}")
            raise SystemExit(1) from exc


@click.command("stop")
@click.argument("agent_id")
def stop_cmd(agent_id: str) -> None:
    """Set an agent's status to 'idle'."""
    with OAVClient() as client:
        try:
            result = client.update_agent_status(agent_id, "idle")
            name = result.get("name", agent_id[:8])
            console.print(f"[yellow]Stopped[/yellow] agent [bold]{name}[/bold] ({agent_id})")
        except OAVClientError as exc:
            console.print(f"[red]Error:[/red] {exc}")
            raise SystemExit(1) from exc
