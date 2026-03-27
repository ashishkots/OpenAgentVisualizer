"""oav CLI entry point.

Usage:
    oav status
    oav status <agent_id>
    oav events [--agent <id>] [--type <type>] [--count N]
    oav metrics [--chart] [--agent <id>]
    oav leaderboard [--period daily|weekly|monthly|all_time]
    oav topology
    oav health
    oav start <agent_id>
    oav stop <agent_id>
    oav config set <key> <value>
    oav config show
"""

import click
from rich.console import Console

from oav_cli.commands.config_cmd import config_group
from oav_cli.commands.control import start_cmd, stop_cmd
from oav_cli.commands.health import health_cmd
from oav_cli.commands.leaderboard import leaderboard_cmd
from oav_cli.commands.metrics import metrics_cmd
from oav_cli.commands.status import status_cmd
from oav_cli.commands.stream import events_cmd
from oav_cli.commands.topology import topology_cmd

console = Console()

CONTEXT_SETTINGS = {"help_option_names": ["-h", "--help"]}


@click.group(context_settings=CONTEXT_SETTINGS)
@click.version_option(package_name="oav-cli")
def cli() -> None:
    """oav — OpenAgentVisualizer CLI plugin.

    Manage and monitor AI agents from the terminal.

    \b
    Quick start:
      oav config set url http://localhost:8000
      oav config set api_key <your-api-key>
      oav config set workspace_id <your-workspace-id>
      oav status
    """


cli.add_command(status_cmd, name="status")
cli.add_command(events_cmd, name="events")
cli.add_command(metrics_cmd, name="metrics")
cli.add_command(leaderboard_cmd, name="leaderboard")
cli.add_command(topology_cmd, name="topology")
cli.add_command(health_cmd, name="health")
cli.add_command(start_cmd, name="start")
cli.add_command(stop_cmd, name="stop")
cli.add_command(config_group, name="config")
