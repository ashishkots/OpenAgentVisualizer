"""oav metrics — display token and cost metrics with optional ASCII charts."""

from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich import box

from oav_cli.client import OAVClient, OAVClientError
from oav_cli.charts import cost_chart, token_chart

console = Console()


@click.command("metrics")
@click.option("--chart", is_flag=True, default=False, help="Show ASCII charts")
@click.option("--agent", default=None, help="Scope metrics to a specific agent ID")
def metrics_cmd(chart: bool, agent: Optional[str]) -> None:
    """Show cost and token usage metrics."""
    with OAVClient() as client:
        try:
            if agent:
                data = client.get(f"/api/metrics/costs", params={"agent_id": agent})
            else:
                data = client.get("/api/metrics/costs")
        except OAVClientError as exc:
            console.print(f"[red]Error:[/red] {exc}")
            raise SystemExit(1) from exc

    # Summary table
    table = Table(title="Metrics Summary", box=box.ROUNDED, header_style="bold cyan")
    table.add_column("Metric")
    table.add_column("Value", justify="right")

    if isinstance(data, list):
        # List of per-agent cost records
        total_tokens = sum(r.get("total_tokens", 0) for r in data)
        total_cost = sum(float(r.get("total_cost_usd", 0)) for r in data)
        table.add_row("Total Tokens", f"{total_tokens:,}")
        table.add_row("Total Cost USD", f"${total_cost:.4f}")
        table.add_row("Agents", str(len(data)))
    elif isinstance(data, dict):
        for k, v in data.items():
            if not k.startswith("_"):
                table.add_row(k, str(v))

    console.print(table)

    if chart:
        # Build simple hourly series from available data (stub — real impl needs timeseries endpoint)
        hourly_tokens: list[float] = []
        hourly_costs: list[float] = []
        if isinstance(data, list):
            for r in data:
                hourly_tokens.append(float(r.get("total_tokens", 0)))
                hourly_costs.append(float(r.get("total_cost_usd", 0)))

        if hourly_tokens:
            console.print()
            console.print(token_chart(hourly_tokens))
        if hourly_costs:
            console.print()
            console.print(cost_chart(hourly_costs))
