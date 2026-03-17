import json
from unittest.mock import patch
from oav.install import _install_claude_code_mcp

def test_install_registers_all_three_hook_types(tmp_path):
    # _install_claude_code_mcp writes to Path.home() / ".claude" / "settings.json"
    claude_dir = tmp_path / ".claude"
    claude_dir.mkdir(parents=True, exist_ok=True)
    settings_path = claude_dir / "settings.json"
    settings_path.write_text("{}")
    with patch("pathlib.Path.home", return_value=tmp_path):
        _install_claude_code_mcp(endpoint="http://localhost:4318", api_key="test-key")
    settings = json.loads(settings_path.read_text())
    assert "PreToolUse" in settings["hooks"]
    assert "PostToolUse" in settings["hooks"]
    assert "Stop" in settings["hooks"]
    assert len(settings["hooks"]["PreToolUse"]) == 1

def test_install_is_idempotent(tmp_path):
    # _install_claude_code_mcp writes to Path.home() / ".claude" / "settings.json"
    claude_dir = tmp_path / ".claude"
    claude_dir.mkdir(parents=True, exist_ok=True)
    settings_path = claude_dir / "settings.json"
    settings_path.write_text("{}")
    with patch("pathlib.Path.home", return_value=tmp_path):
        _install_claude_code_mcp(endpoint="http://localhost:4318", api_key="key")
        _install_claude_code_mcp(endpoint="http://localhost:4318", api_key="key")
    settings = json.loads(settings_path.read_text())
    assert len(settings["hooks"]["PreToolUse"]) == 1
    assert len(settings["hooks"]["Stop"]) == 1
