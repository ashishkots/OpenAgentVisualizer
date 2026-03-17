import click
from oav import config as cfg_module

SDK_MESSAGES = {
    "langchain": "pip install openagentvisualizer[langchain]",
    "crewai": "pip install openagentvisualizer[crewai]",
    "autogen": "pip install openagentvisualizer[autogen]",
    "openai": "pip install openagentvisualizer[openai]",
    "anthropic": "pip install openagentvisualizer[anthropic]",
    "haystack": "pip install openagentvisualizer[haystack]",
    "llamaindex": "pip install openagentvisualizer[llamaindex]",
    "semantic-kernel": "pip install openagentvisualizer[semantic-kernel]",
    "dspy": "pip install openagentvisualizer[dspy]",
    "pydantic-ai": "pip install openagentvisualizer[pydantic-ai]",
    "smolagents": "pip install openagentvisualizer[smolagents]",
}

def install(integration: str) -> None:
    if integration in SDK_MESSAGES:
        click.echo(f"\nTo use the {integration} adapter, install the extra:\n")
        click.echo(f"  {SDK_MESSAGES[integration]}\n")
        return

    endpoint = cfg_module.get("endpoint", "http://localhost:8000")
    api_key = cfg_module.get("api_key", "")

    if integration == "claude-code":
        _install_claude_code_mcp(endpoint, api_key)
    elif integration == "claude-code-plugin":
        _install_claude_code_plugin()
    elif integration == "codex":
        _install_codex_adapter(endpoint, api_key)
    elif integration == "codex-plugin":
        _install_codex_plugin()
    elif integration == "gemini":
        _install_gemini_adapter(endpoint, api_key)
    else:
        click.echo(f"Unknown integration: {integration}")


def _install_claude_code_mcp(endpoint: str, api_key: str) -> None:
    import json, pathlib
    settings_path = pathlib.Path.home() / ".claude" / "settings.json"
    settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}

    settings.setdefault("mcpServers", {})["oav"] = {
        "command": "node",
        "args": [str(pathlib.Path.home() / ".oav" / "mcp-server" / "dist" / "index.js")],
        "env": {"OAV_ENDPOINT": endpoint, "OAV_API_KEY": api_key},
    }

    hooks_dir = pathlib.Path(__file__).parent.parent.parent / "integrations" / "claude-code" / "hooks"
    for hook_event, hook_file in [
        ("PreToolUse", "pre-tool.sh"),
        ("PostToolUse", "post-tool.sh"),
        ("Stop", "stop.sh"),
    ]:
        settings.setdefault("hooks", {}).setdefault(hook_event, [])
        hook_path = str(hooks_dir / hook_file)
        if hook_path not in settings["hooks"][hook_event]:
            settings["hooks"][hook_event].append(hook_path)

    settings_path.parent.mkdir(parents=True, exist_ok=True)
    settings_path.write_text(json.dumps(settings, indent=2))
    click.echo("✓ MCP server registered in ~/.claude/settings.json")
    click.echo("✓ PreToolUse, PostToolUse, and Stop hooks registered for transparent telemetry")
    click.echo("  Restart Claude Code to activate.")


def _install_claude_code_plugin() -> None:
    import pathlib, shutil
    plugin_src = pathlib.Path(__file__).parent.parent.parent / "integrations" / "claude-code" / "plugin"
    plugin_dst = pathlib.Path.home() / ".claude" / "plugins" / "oav"
    plugin_dst.parent.mkdir(parents=True, exist_ok=True)
    if plugin_dst.exists():
        shutil.rmtree(plugin_dst)
    shutil.copytree(plugin_src, plugin_dst)
    click.echo(f"✓ Claude Code plugin installed to {plugin_dst}")


def _install_codex_adapter(endpoint: str, api_key: str) -> None:
    import json, pathlib
    config_path = pathlib.Path.home() / ".codex" / "config.json"
    config = json.loads(config_path.read_text()) if config_path.exists() else {}
    config["oav_endpoint"] = endpoint
    config["oav_api_key"] = api_key
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text(json.dumps(config, indent=2))
    click.echo("✓ Codex adapter config written to ~/.codex/config.json")


def _install_codex_plugin() -> None:
    import pathlib, shutil, json
    plugin_src = pathlib.Path(__file__).parent.parent.parent / "integrations" / "codex" / "plugin"
    plugin_dst = pathlib.Path.home() / ".codex" / "plugins" / "oav"
    plugin_dst.parent.mkdir(parents=True, exist_ok=True)
    if plugin_dst.exists():
        shutil.rmtree(plugin_dst)
    shutil.copytree(plugin_src, plugin_dst)
    plugins_json = pathlib.Path.home() / ".codex" / "plugins.json"
    plugins = json.loads(plugins_json.read_text()) if plugins_json.exists() else []
    if "oav" not in plugins:
        plugins.append("oav")
        plugins_json.write_text(json.dumps(plugins, indent=2))
    click.echo(f"✓ Codex plugin installed to {plugin_dst}")


def _install_gemini_adapter(endpoint: str, api_key: str) -> None:
    import pathlib
    try:
        import yaml
    except ImportError:
        click.echo("Install pyyaml first: pip install pyyaml")
        return
    config_path = pathlib.Path.home() / ".gemini" / "config.yaml"
    config = yaml.safe_load(config_path.read_text()) if config_path.exists() else {}
    config["oav_endpoint"] = endpoint
    config["oav_api_key"] = api_key
    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text(yaml.dump(config))
    click.echo("✓ Gemini CLI config patched at ~/.gemini/config.yaml")


def test_integration(integration: str) -> None:
    import requests
    endpoint = cfg_module.get("endpoint", "http://localhost:8000")
    api_key = cfg_module.get("api_key", "")
    try:
        r = requests.post(f"{endpoint}/api/events",
            json={"type": "oav_test", "agent_id": f"test-{integration}", "data": {"source": integration}},
            headers={"Authorization": f"Bearer {api_key}"}, timeout=3)
        if r.ok:
            click.echo(f"✓ Test event sent for {integration}. Check OAV canvas.")
        else:
            click.echo(f"✗ Error {r.status_code}: {r.text}")
    except Exception as e:
        click.echo(f"✗ Could not reach OAV backend: {e}")
