import pytest
from click.testing import CliRunner
from oav.cli import cli

def test_cli_help():
    runner = CliRunner()
    result = runner.invoke(cli, ['--help'])
    assert result.exit_code == 0
    assert 'install' in result.output
    assert 'status' in result.output
    assert 'config' in result.output

def test_config_set_endpoint(tmp_path, monkeypatch):
    monkeypatch.setattr('oav.config.CONFIG_PATH', tmp_path / 'config.json')
    runner = CliRunner()
    result = runner.invoke(cli, ['config', 'set', 'endpoint', 'http://localhost:8000'])
    assert result.exit_code == 0
    assert 'endpoint' in result.output.lower()

def test_install_shows_usage():
    runner = CliRunner()
    result = runner.invoke(cli, ['install', '--help'])
    assert result.exit_code == 0
    assert 'claude-code' in result.output or 'integration' in result.output.lower()

def test_status_offline():
    runner = CliRunner()
    result = runner.invoke(cli, ['status'])
    assert result.exit_code == 0
