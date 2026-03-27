"""oav config — manage ~/.oav/config.toml settings."""

import click
from rich.console import Console
from rich.table import Table
from rich import box

from oav_cli.config import CONFIG_FILE, load_config, set_config_value

console = Console()

KNOWN_KEYS = {
    "url": "Backend base URL (e.g. http://localhost:8000)",
    "api_key": "API key for authentication",
    "workspace_id": "Default workspace ID",
}


@click.group("config")
def config_group() -> None:
    """Manage oav-cli configuration."""


@config_group.command("set")
@click.argument("key")
@click.argument("value")
def config_set(key: str, value: str) -> None:
    """Set a configuration value.

    \b
    Known keys:
      url          Backend base URL
      api_key      API key for authentication
      workspace_id Default workspace ID

    Example:
      oav config set url http://localhost:8000
      oav config set api_key oav_myapikey123
    """
    set_config_value(key, value)
    masked = value if key != "api_key" else value[:4] + "..." + value[-4:] if len(value) > 8 else "***"
    console.print(f"[green]Set[/green] [bold]{key}[/bold] = {masked}")
    console.print(f"[dim]Config file: {CONFIG_FILE}[/dim]")


@config_group.command("show")
def config_show() -> None:
    """Show current configuration."""
    cfg = load_config()

    if not cfg:
        console.print(f"[dim]No configuration found at {CONFIG_FILE}[/dim]")
        console.print("[dim]Use 'oav config set' to configure the CLI.[/dim]")
        return

    table = Table(
        title=f"Configuration ({CONFIG_FILE})",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("Key", style="bold")
    table.add_column("Value")
    table.add_column("Description", style="dim")

    for key, value in cfg.items():
        # Mask API keys in output
        display_value = value
        if "key" in key.lower() and isinstance(value, str) and len(value) > 8:
            display_value = value[:4] + "..." + value[-4:]
        description = KNOWN_KEYS.get(key, "")
        table.add_row(key, str(display_value), description)

    console.print(table)
