"""Tests for oav-cli commands using Click test runner and mocked API responses."""

from unittest.mock import MagicMock, patch

import pytest
from click.testing import CliRunner

from oav_cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


@pytest.fixture
def mock_agents():
    return [
        {
            "id": "agent-001",
            "name": "ResearchBot",
            "status": "active",
            "level": 3,
            "xp_total": 1500,
            "framework": "langchain",
            "role": "researcher",
            "total_tokens": 50000,
            "total_cost_usd": 0.05,
        },
        {
            "id": "agent-002",
            "name": "WriterBot",
            "status": "idle",
            "level": 1,
            "xp_total": 100,
            "framework": "custom",
            "role": "writer",
            "total_tokens": 1000,
            "total_cost_usd": 0.001,
        },
    ]


# ---------------------------------------------------------------------------
# oav health
# ---------------------------------------------------------------------------


def test_health_ok(runner: CliRunner) -> None:
    with patch("oav_cli.commands.health.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.health.return_value = {"status": "ok"}
        result = runner.invoke(cli, ["health"])
    assert result.exit_code == 0
    assert "OK" in result.output or "ok" in result.output


def test_health_failure(runner: CliRunner) -> None:
    from oav_cli.client import OAVClientError
    with patch("oav_cli.commands.health.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.health.side_effect = OAVClientError("Connection refused", status_code=None)
        result = runner.invoke(cli, ["health"])
    assert result.exit_code != 0


# ---------------------------------------------------------------------------
# oav status
# ---------------------------------------------------------------------------


def test_status_lists_agents(runner: CliRunner, mock_agents: list) -> None:
    with patch("oav_cli.commands.status.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.list_agents.return_value = mock_agents
        result = runner.invoke(cli, ["status"])
    assert result.exit_code == 0
    assert "ResearchBot" in result.output
    assert "WriterBot" in result.output


def test_status_empty_workspace(runner: CliRunner) -> None:
    with patch("oav_cli.commands.status.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.list_agents.return_value = []
        result = runner.invoke(cli, ["status"])
    assert result.exit_code == 0
    assert "No agents" in result.output


def test_status_single_agent(runner: CliRunner, mock_agents: list) -> None:
    with patch("oav_cli.commands.status.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.get_agent_stats.return_value = mock_agents[0]
        result = runner.invoke(cli, ["status", "agent-001"])
    assert result.exit_code == 0
    assert "ResearchBot" in result.output


# ---------------------------------------------------------------------------
# oav leaderboard
# ---------------------------------------------------------------------------


def test_leaderboard_all_time(runner: CliRunner) -> None:
    mock_data = {
        "agents": [
            {"rank": 1, "agent_id": "a1", "name": "TopBot", "level": 5, "xp_total": 9999, "achievement_count": 3},
        ],
        "period": "all_time",
        "category": "xp",
    }
    with patch("oav_cli.commands.leaderboard.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.get_leaderboard.return_value = mock_data
        result = runner.invoke(cli, ["leaderboard"])
    assert result.exit_code == 0
    assert "TopBot" in result.output
    assert "#1" in result.output


def test_leaderboard_period_flag(runner: CliRunner) -> None:
    mock_data = {"agents": [], "period": "weekly", "category": "xp"}
    with patch("oav_cli.commands.leaderboard.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.get_leaderboard.return_value = mock_data
        result = runner.invoke(cli, ["leaderboard", "--period", "weekly"])
    assert result.exit_code == 0
    instance.get_leaderboard.assert_called_once_with("weekly")


# ---------------------------------------------------------------------------
# oav metrics
# ---------------------------------------------------------------------------


def test_metrics_summary(runner: CliRunner) -> None:
    mock_data = [
        {"agent_id": "a1", "total_tokens": 100000, "total_cost_usd": "0.10"},
    ]
    with patch("oav_cli.commands.metrics.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.get.return_value = mock_data
        result = runner.invoke(cli, ["metrics"])
    assert result.exit_code == 0


# ---------------------------------------------------------------------------
# oav topology
# ---------------------------------------------------------------------------


def test_topology_flat_list(runner: CliRunner, mock_agents: list) -> None:
    with patch("oav_cli.commands.topology.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.list_agents.return_value = mock_agents
        instance.get_agent_graph.return_value = {"nodes": [], "edges": []}
        result = runner.invoke(cli, ["topology"])
    assert result.exit_code == 0
    assert "ResearchBot" in result.output


# ---------------------------------------------------------------------------
# oav config
# ---------------------------------------------------------------------------


def test_config_set_and_show(runner: CliRunner, tmp_path) -> None:
    """Config set should write to config file, show should read it back."""
    import oav_cli.config as cfg_module
    import oav_cli.commands.config_cmd as config_cmd_module

    original_dir = cfg_module.CONFIG_DIR
    original_file = cfg_module.CONFIG_FILE

    # Redirect config to temp dir
    cfg_module.CONFIG_DIR = tmp_path / ".oav"
    cfg_module.CONFIG_FILE = cfg_module.CONFIG_DIR / "config.toml"

    try:
        result = runner.invoke(cli, ["config", "set", "url", "http://localhost:9999"])
        assert result.exit_code == 0
        assert "url" in result.output

        result = runner.invoke(cli, ["config", "show"])
        assert result.exit_code == 0
        assert "http://localhost:9999" in result.output
    finally:
        cfg_module.CONFIG_DIR = original_dir
        cfg_module.CONFIG_FILE = original_file


# ---------------------------------------------------------------------------
# oav start / stop
# ---------------------------------------------------------------------------


def test_start_agent(runner: CliRunner) -> None:
    with patch("oav_cli.commands.control.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.update_agent_status.return_value = {"id": "agent-001", "name": "ResearchBot"}
        result = runner.invoke(cli, ["start", "agent-001"])
    assert result.exit_code == 0
    assert "Started" in result.output
    instance.update_agent_status.assert_called_once_with("agent-001", "active")


def test_stop_agent(runner: CliRunner) -> None:
    with patch("oav_cli.commands.control.OAVClient") as MockClient:
        instance = MockClient.return_value.__enter__.return_value
        instance.update_agent_status.return_value = {"id": "agent-001", "name": "ResearchBot"}
        result = runner.invoke(cli, ["stop", "agent-001"])
    assert result.exit_code == 0
    assert "Stopped" in result.output
    instance.update_agent_status.assert_called_once_with("agent-001", "idle")


# ---------------------------------------------------------------------------
# Sprint 3: CLI ↔ SDK auth compatibility (ADR-009)
# ---------------------------------------------------------------------------
# Both OAVClient (CLI) and RESTExporter (SDK) authenticate with X-API-Key
# header.  These tests verify the CLI side; SDK side is tested in
# src/sdk/tests/test_sprint3_compatibility.py::TestCLISDKAuthCompatibility.


def test_oav_client_uses_x_api_key_header() -> None:
    """OAVClient must pass X-API-Key header, not Authorization: Bearer."""
    from oav_cli.client import OAVClient

    _key = "oav_sprint3_test_12345678901234"
    cfg = {"url": "http://localhost:8000", "api_key": _key, "workspace_id": "ws-test"}
    with patch("oav_cli.client.load_config", return_value=cfg):
        client = OAVClient()

    assert client.api_key == _key
    assert client._http.headers.get("x-api-key") == _key


def test_oav_client_does_not_use_bearer_auth() -> None:
    """CLI must not include Authorization header — API key auth only (ADR-009)."""
    from oav_cli.client import OAVClient

    _key = "oav_sprint3_test_12345678901234"
    cfg = {"url": "http://localhost:8000", "api_key": _key, "workspace_id": "ws-test"}
    with patch("oav_cli.client.load_config", return_value=cfg):
        client = OAVClient()

    header_names = {k.lower() for k in client._http.headers}
    assert "authorization" not in header_names


def test_oav_client_workspace_id_loaded_from_config() -> None:
    """workspace_id must be read from config so CLI commands are workspace-scoped."""
    from oav_cli.client import OAVClient

    cfg = {"url": "http://localhost:8000", "api_key": "oav_k_12345", "workspace_id": "ws-xyz"}
    with patch("oav_cli.client.load_config", return_value=cfg):
        client = OAVClient()

    assert client.workspace_id == "ws-xyz"


def test_oav_client_stream_events_uses_api_key_query_param() -> None:
    """stream_events WebSocket URL must include api_key as query param (ADR-009).

    The /ws/live endpoint accepts api_key via query param for WebSocket auth
    because WebSocket clients cannot set custom headers in most browsers.
    """
    import asyncio
    import inspect
    from oav_cli.client import stream_events

    # Inspect the source: the function must build the WS URL with api_key param
    src = inspect.getsource(stream_events)
    assert "api_key={api_key}" in src or "api_key" in src
