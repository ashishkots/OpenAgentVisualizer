"""Rich terminal output formatters for oav-cli commands."""

from typing import Any, Optional

from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich import box


STATUS_COLORS: dict[str, str] = {
    "active": "green",
    "running": "green",
    "idle": "dim",
    "error": "red",
    "failed": "red",
    "paused": "yellow",
    "waiting": "yellow",
}

GRADE_COLORS: dict[str, str] = {
    "A": "bright_green",
    "B": "green",
    "C": "yellow",
    "D": "orange1",
    "F": "red",
}


def status_badge(status: str) -> Text:
    """Return a colored Rich Text badge for an agent status."""
    color = STATUS_COLORS.get(status.lower(), "white")
    return Text(f"● {status}", style=color)


def agents_table(agents: list[dict[str, Any]]) -> Table:
    """Build a Rich Table for a list of agent dicts."""
    table = Table(
        title="Agents",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("Name", style="bold", min_width=16)
    table.add_column("Status", min_width=10)
    table.add_column("Level", justify="right")
    table.add_column("XP", justify="right")
    table.add_column("Framework", style="dim")
    table.add_column("ID", style="dim", overflow="fold")

    for agent in agents:
        table.add_row(
            agent.get("name", "—"),
            status_badge(agent.get("status", "unknown")),
            str(agent.get("level", 1)),
            f"{agent.get('xp_total', 0):,}",
            agent.get("framework", "—"),
            agent.get("id", "—"),
        )
    return table


def agent_detail_panel(stats: dict[str, Any]) -> Panel:
    """Build a Rich Panel for agent detail stats."""
    lines = [
        f"[bold]Name:[/bold]       {stats.get('name', '—')}",
        f"[bold]Status:[/bold]     {stats.get('status', '—')}",
        f"[bold]Level:[/bold]      {stats.get('level', 1)}",
        f"[bold]XP Total:[/bold]   {stats.get('xp_total', 0):,}",
        f"[bold]Framework:[/bold]  {stats.get('framework', '—')}",
        f"[bold]Role:[/bold]       {stats.get('role', '—')}",
        f"[bold]Tokens:[/bold]     {stats.get('total_tokens', 0):,}",
        f"[bold]Cost USD:[/bold]   ${float(stats.get('total_cost_usd', 0)):.4f}",
    ]
    return Panel("\n".join(lines), title=f"Agent: {stats.get('id', '—')}", border_style="cyan")


def leaderboard_table(data: dict[str, Any]) -> Table:
    """Build a Rich Table for the leaderboard."""
    table = Table(
        title=f"Leaderboard ({data.get('period', 'all_time')})",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold magenta",
    )
    table.add_column("Rank", justify="right", style="bold")
    table.add_column("Name", min_width=16)
    table.add_column("Level", justify="right")
    table.add_column("XP", justify="right", style="green")
    table.add_column("Achievements", justify="right")

    for entry in data.get("agents", []):
        table.add_row(
            f"#{entry.get('rank', '—')}",
            entry.get("name", "—"),
            str(entry.get("level", 1)),
            f"{entry.get('xp_total', 0):,}",
            str(entry.get("achievement_count", 0)),
        )
    return table


def health_panel(data: dict[str, Any]) -> Panel:
    """Build a Rich Panel for the health endpoint response."""
    status = data.get("status", "unknown")
    color = "green" if status == "ok" else "red"
    content = f"[{color}][bold]{status.upper()}[/bold][/{color}]"

    extras = [f"[dim]{k}:[/dim] {v}" for k, v in data.items() if k != "status"]
    if extras:
        content += "\n" + "\n".join(extras)

    return Panel(content, title="Backend Health", border_style=color)


def event_row(event: dict[str, Any]) -> str:
    """Format a single event for the streaming log display."""
    ts = event.get("timestamp", event.get("ts", ""))
    event_type = event.get("event_type", event.get("type", "event"))
    agent_id = event.get("agent_id", "")
    room = event.get("room", "")

    parts = [f"[dim]{ts}[/dim]" if ts else ""]
    if room:
        parts.append(f"[cyan]{room}[/cyan]")
    parts.append(f"[bold yellow]{event_type}[/bold yellow]")
    if agent_id:
        parts.append(f"[green]{agent_id[:8]}[/green]")

    return "  ".join(p for p in parts if p)
