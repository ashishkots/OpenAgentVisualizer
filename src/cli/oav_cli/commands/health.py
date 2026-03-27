"""oav health — check backend health status."""

import click
from rich.console import Console

from oav_cli.client import OAVClient, OAVClientError
from oav_cli.display import health_panel

console = Console()


@click.command("health")
def health_cmd() -> None:
    """Check backend health status."""
    with OAVClient() as client:
        try:
            data = client.health()
            console.print(health_panel(data))
        except OAVClientError as exc:
            console.print(health_panel({"status": "unreachable", "error": str(exc)}))
            raise SystemExit(1) from exc
