"""CLI configuration file management.

Config file location: ~/.oav/config.toml

Example config.toml:
    url = "http://localhost:8000"
    api_key = "oav_yourkey..."
    workspace_id = "workspace-uuid"
"""

import sys
from pathlib import Path
from typing import Any

CONFIG_DIR = Path.home() / ".oav"
CONFIG_FILE = CONFIG_DIR / "config.toml"


def load_config() -> dict[str, Any]:
    """Load configuration from ~/.oav/config.toml.

    Returns an empty dict if the file does not exist.
    """
    if not CONFIG_FILE.exists():
        return {}

    if sys.version_info >= (3, 11):
        import tomllib
        with open(CONFIG_FILE, "rb") as f:
            return tomllib.load(f)
    else:
        import tomli
        with open(CONFIG_FILE, "rb") as f:
            return tomli.load(f)


def save_config(data: dict[str, Any]) -> None:
    """Write configuration to ~/.oav/config.toml.

    Creates the ~/.oav directory if it does not exist.
    """
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    import tomli_w
    with open(CONFIG_FILE, "wb") as f:
        tomli_w.dump(data, f)


def set_config_value(key: str, value: str) -> None:
    """Set a single configuration key and persist."""
    cfg = load_config()
    cfg[key] = value
    save_config(cfg)


def get_config_value(key: str, default: Any = None) -> Any:
    """Get a single configuration value with an optional default."""
    return load_config().get(key, default)
