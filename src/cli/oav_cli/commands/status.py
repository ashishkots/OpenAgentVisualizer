"""oav status — show agent status table or single agent detail."""

import click
from rich.console import Console

from oav_cli.client import OAVClient, OAVClientError
from oav_cli.display import agent_detail_panel, agents_table

console = Console()


@click.command("status")
@click.argument("agent_id", required=False)
def status_cmd(agent_id: str | None) -> None:
    """Show agent status.

    If AGENT_ID is provided, show detailed stats for that agent.
    Otherwise, show a table of all agents.
    """
    with OAVClient() as client:
        try:
            if agent_id:
                stats = client.get_agent_stats(agent_id)
                console.print(agent_detail_panel(stats))
            else:
                agents = client.list_agents()
                if not agents:
                    console.print("[dim]No agents found in workspace.[/dim]")
                    return
                console.print(agents_table(agents))
        except OAVClientError as exc:
            console.print(f"[red]Error:[/red] {exc}")
            raise SystemExit(1) from exc
