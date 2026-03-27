"""oav topology — show agent relationship topology as an ASCII tree."""

import click
from rich.console import Console
from rich.tree import Tree

from oav_cli.client import OAVClient, OAVClientError
from oav_cli.display import STATUS_COLORS

console = Console()


def _build_tree(agents: list[dict], edges: list[dict]) -> Tree:
    """Build a Rich Tree from agents and relationship edges."""
    root = Tree("[bold cyan]Workspace Topology[/bold cyan]")

    # Build adjacency: parent -> [children]
    children_map: dict[str, list[str]] = {}
    child_ids: set[str] = set()
    for edge in edges:
        src = edge.get("source", "")
        tgt = edge.get("target", "")
        if src and tgt:
            children_map.setdefault(src, []).append(tgt)
            child_ids.add(tgt)

    agents_by_id = {a["id"]: a for a in agents}

    def _agent_label(agent_id: str) -> str:
        agent = agents_by_id.get(agent_id, {})
        name = agent.get("name", agent_id[:8])
        status = agent.get("status", "unknown")
        level = agent.get("level", 1)
        color = STATUS_COLORS.get(status.lower(), "white")
        return f"[bold]{name}[/bold] [{color}]{status}[/{color}] [dim]L{level}[/dim]"

    def _add_node(tree_node: Tree, agent_id: str, visited: set[str]) -> None:
        if agent_id in visited:
            return
        visited.add(agent_id)
        branch = tree_node.add(_agent_label(agent_id))
        for child_id in children_map.get(agent_id, []):
            _add_node(branch, child_id, visited)

    # Roots = agents not referenced as children
    root_agents = [a["id"] for a in agents if a["id"] not in child_ids]
    # Fall back: show all if no edges
    if not edges:
        root_agents = [a["id"] for a in agents]

    visited: set[str] = set()
    for agent_id in root_agents:
        _add_node(root, agent_id, visited)

    # Add any orphaned agents not yet visited
    for agent in agents:
        if agent["id"] not in visited:
            root.add(_agent_label(agent["id"]))

    return root


@click.command("topology")
def topology_cmd() -> None:
    """Show the agent relationship topology as an ASCII tree."""
    with OAVClient() as client:
        try:
            agents = client.list_agents()
        except OAVClientError as exc:
            console.print(f"[red]Error fetching agents:[/red] {exc}")
            raise SystemExit(1) from exc

        edges: list[dict] = []
        try:
            graph_data = client.get_agent_graph()
            edges = graph_data.get("edges", [])
        except OAVClientError:
            pass  # Graph may be computing; show flat list

    tree = _build_tree(agents, edges)
    console.print(tree)
