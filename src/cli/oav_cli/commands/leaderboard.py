"""oav leaderboard — show the agent XP leaderboard."""

import click
from rich.console import Console

from oav_cli.client import OAVClient, OAVClientError
from oav_cli.display import leaderboard_table

console = Console()


@click.command("leaderboard")
@click.option(
    "--period",
    default="all_time",
    type=click.Choice(["daily", "weekly", "monthly", "all_time"]),
    show_default=True,
    help="Leaderboard time period",
)
def leaderboard_cmd(period: str) -> None:
    """Show the agent XP leaderboard."""
    with OAVClient() as client:
        try:
            data = client.get_leaderboard(period)
            console.print(leaderboard_table(data))
        except OAVClientError as exc:
            console.print(f"[red]Error:[/red] {exc}")
            raise SystemExit(1) from exc
