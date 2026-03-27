import json
import os
from pathlib import Path
from typing import Any

CONFIG_PATH = Path.home() / ".oav" / "config.json"

def load_config() -> dict:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text())
    return {"endpoint": "http://localhost:8000", "api_key": ""}

def save_config(cfg: dict) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2))

def get(key: str, default: Any = None) -> Any:
    return load_config().get(key, default)

def set_value(key: str, value: Any) -> None:
    cfg = load_config()
    cfg[key] = value
    save_config(cfg)
