import click
from oav import config as cfg_module
from oav import install as install_module
from oav import status as status_module

@click.group()
@click.version_option("1.0.0")
def cli():
    """OpenAgentVisualizer CLI — install and manage OAV integrations."""
    pass

@cli.group()
def config():
    """Configure OAV endpoint and API key."""
    pass

@config.command("set")
@click.argument("key", type=click.Choice(["endpoint", "api-key"]))
@click.argument("value")
def config_set(key, value):
    """Set a config value (endpoint or api-key)."""
    cfg_module.set_value(key.replace("-", "_"), value)
    click.echo(f"✓ Set {key} = {value}")

@config.command("show")
def config_show():
    """Show current config."""
    c = cfg_module.load_config()
    for k, v in c.items():
        display = "***" if k == "api_key" and v else v
        click.echo(f"{k}: {display}")

@cli.command()
@click.argument("integration", type=click.Choice([
    "claude-code", "claude-code-plugin", "codex", "codex-plugin", "gemini",
    "langchain", "crewai", "autogen", "openai", "anthropic",
    "haystack", "llamaindex", "semantic-kernel", "dspy", "pydantic-ai", "smolagents",
]))
def install(integration):
    """Install an OAV integration."""
    install_module.install(integration)

@cli.command()
def status():
    """Show connection status for all installed integrations."""
    status_module.show()

@cli.command()
@click.argument("integration")
def test(integration):
    """Fire a test event for an integration."""
    install_module.test_integration(integration)
