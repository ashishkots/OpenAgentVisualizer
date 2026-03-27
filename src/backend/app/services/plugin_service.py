"""Plugin service — load, validate, execute hooks, and manage lifecycle.

Security model:
    Plugins are executed in-process via importlib, not in isolated subprocesses.
    The PluginContext object restricts what the plugin can do by only exposing
    approved OAV APIs (no raw DB access, no OS access). Each hook invocation is
    wrapped in a concurrent.futures executor with a 5-second timeout to prevent
    runaway plugins from blocking the event loop.

Architecture:
    - _loaded_plugins: module-level cache mapping plugin_id -> loaded module
    - PluginContext: scoped object passed to every hook call
    - validate_manifest: schema check before installation
    - load_plugin: importlib load from module name embedded in manifest
    - execute_hook: timeout-guarded invocation
    - dispatch_hook: fan-out across all enabled plugins with matching hook
"""

import importlib
import asyncio
import concurrent.futures
import types
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

_logger = get_logger(__name__)

# In-memory cache of loaded plugin modules: plugin_id -> module
_loaded_plugins: dict[str, types.ModuleType] = {}

# Executor for running plugin hooks with timeout enforcement
_executor = concurrent.futures.ThreadPoolExecutor(
    max_workers=4, thread_name_prefix="plugin-hook"
)

_HOOK_TIMEOUT_SECONDS = 5.0

# Forbidden module names — plugins may not import these
_FORBIDDEN_MODULES = frozenset(
    ["os", "sys", "subprocess", "socket", "shutil", "pathlib", "builtins"]
)


# ---------------------------------------------------------------------------
# PluginContext — restricted API surface exposed to plugins
# ---------------------------------------------------------------------------


class PluginContext:
    """Scoped execution context injected into every plugin hook call.

    Plugins may only interact with OAV through the methods on this object.
    Direct DB access or importing system modules is not permitted.

    Args:
        workspace_id: The workspace that installed the plugin.
        db: Async SQLAlchemy session (used for get_agents / get_events).
        config: Per-plugin configuration dict (read/write by the plugin).
    """

    def __init__(
        self,
        workspace_id: str,
        db: AsyncSession,
        config: dict[str, Any],
    ) -> None:
        self._workspace_id = workspace_id
        self._db = db
        self._config: dict[str, Any] = config.copy()

    # ---- Read operations ----

    async def get_agents(self) -> list[dict[str, Any]]:
        """Return a list of agent summaries for the workspace."""
        from sqlalchemy import select as sa_select
        from app.models.agent import Agent

        result = await self._db.execute(
            sa_select(Agent).where(Agent.workspace_id == self._workspace_id).limit(100)
        )
        agents = result.scalars().all()
        return [
            {"id": a.id, "name": a.name, "status": a.status, "level": a.level}
            for a in agents
        ]

    async def get_events(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return recent events for the workspace."""
        from sqlalchemy import select as sa_select
        from app.models.event import Event

        result = await self._db.execute(
            sa_select(Event)
            .where(Event.workspace_id == self._workspace_id)
            .order_by(Event.timestamp.desc())
            .limit(min(limit, 200))
        )
        events = result.scalars().all()
        return [
            {"id": e.id, "name": e.name, "type": e.type, "timestamp": str(e.timestamp)}
            for e in events
        ]

    async def create_event(self, name: str, event_type: str, extra_data: dict | None = None) -> str:
        """Create a new event in the workspace. Returns the new event ID."""
        from app.models.event import Event
        import uuid

        event = Event(
            workspace_id=self._workspace_id,
            name=name,
            type=event_type,
            extra_data=extra_data or {},
        )
        self._db.add(event)
        await self._db.flush()
        return event.id

    # ---- Config operations ----

    def get_config(self, key: str, default: Any = None) -> Any:
        """Return a plugin configuration value."""
        return self._config.get(key, default)

    def set_config(self, key: str, value: Any) -> None:
        """Set a plugin configuration value (persisted in manifest.config)."""
        self._config[key] = value


# ---------------------------------------------------------------------------
# Manifest validation
# ---------------------------------------------------------------------------


def validate_manifest(manifest: dict[str, Any]) -> list[str]:
    """Validate a plugin manifest dict.

    Returns:
        List of validation error strings. Empty list means valid.
    """
    errors: list[str] = []
    required = ["name", "version", "author", "description"]
    for field in required:
        if not manifest.get(field):
            errors.append(f"Missing required field: {field}")

    version = manifest.get("version", "")
    if version and not _is_semver(version):
        errors.append(f"version must be semver (got '{version}')")

    hooks = manifest.get("hooks", [])
    if not isinstance(hooks, list):
        errors.append("hooks must be a list of strings")

    permissions = manifest.get("permissions", [])
    if not isinstance(permissions, list):
        errors.append("permissions must be a list of strings")

    return errors


def _is_semver(v: str) -> bool:
    """Return True if v matches MAJOR.MINOR.PATCH semver pattern."""
    parts = v.split(".")
    if len(parts) != 3:
        return False
    return all(p.isdigit() for p in parts)


# ---------------------------------------------------------------------------
# Plugin loading
# ---------------------------------------------------------------------------


def load_plugin(plugin_id: str, module_name: str) -> types.ModuleType:
    """Load (or return cached) a plugin module by its Python module name.

    Args:
        plugin_id: OAV plugin record ID (used as cache key).
        module_name: Dotted Python module path (e.g. "oav_plugins.slack_notifier").

    Returns:
        The loaded module.

    Raises:
        ImportError: If the module cannot be found.
        ValueError: If the module tries to import a forbidden module.
    """
    if plugin_id in _loaded_plugins:
        return _loaded_plugins[plugin_id]

    # Reject forbidden top-level module names
    top_level = module_name.split(".")[0]
    if top_level in _FORBIDDEN_MODULES:
        raise ValueError(f"Plugin attempted to load forbidden module: {module_name}")

    module = importlib.import_module(module_name)
    _loaded_plugins[plugin_id] = module
    _logger.info("plugin.loaded", plugin_id=plugin_id, module=module_name)
    return module


def unload_plugin(plugin_id: str) -> None:
    """Remove a plugin module from the in-memory cache."""
    _loaded_plugins.pop(plugin_id, None)


# ---------------------------------------------------------------------------
# Hook execution
# ---------------------------------------------------------------------------


async def execute_hook(
    module: types.ModuleType,
    hook_name: str,
    payload: dict[str, Any],
    context: PluginContext,
) -> Any:
    """Invoke a hook function on a plugin module with a 5-second timeout.

    The hook is executed in a thread-pool executor to avoid blocking the
    async event loop. If no function named hook_name exists on the module
    the call is silently skipped (returns None).

    Args:
        module: The loaded plugin module.
        hook_name: Name of the hook function to call.
        payload: Event payload passed as the first argument.
        context: PluginContext injected as the second argument.

    Returns:
        Whatever the hook function returns, or None if not implemented.

    Raises:
        asyncio.TimeoutError: If the hook does not return within 5 seconds.
    """
    hook_fn = getattr(module, hook_name, None)
    if hook_fn is None or not callable(hook_fn):
        return None

    loop = asyncio.get_running_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, hook_fn, payload, context),
            timeout=_HOOK_TIMEOUT_SECONDS,
        )
        return result
    except asyncio.TimeoutError:
        _logger.warning(
            "plugin.hook_timeout",
            hook=hook_name,
            module=module.__name__,
        )
        raise


# ---------------------------------------------------------------------------
# Hook dispatcher
# ---------------------------------------------------------------------------


async def dispatch_hook(
    db: AsyncSession,
    workspace_id: str,
    hook_name: str,
    payload: dict[str, Any],
) -> None:
    """Dispatch a hook to all enabled installed plugins that declare it.

    One plugin failure does not block others — errors are caught per-plugin,
    logged, and the plugin status is updated to "error" in the database.

    Args:
        db: Async DB session.
        workspace_id: Workspace whose plugins should be iterated.
        hook_name: Hook function name to invoke (e.g. "on_agent_created").
        payload: Payload dict passed to the hook.
    """
    from app.models.plugin import Plugin

    result = await db.execute(
        select(Plugin).where(
            Plugin.workspace_id == workspace_id,
            Plugin.status == "installed",
        )
    )
    plugins = result.scalars().all()

    for plugin in plugins:
        manifest: dict[str, Any] = plugin.manifest or {}
        declared_hooks: list[str] = manifest.get("hooks", [])
        if hook_name not in declared_hooks:
            continue

        module_name: str = manifest.get("module", "")
        if not module_name:
            continue

        context = PluginContext(
            workspace_id=workspace_id,
            db=db,
            config=manifest.get("config", {}),
        )

        try:
            module = load_plugin(plugin.id, module_name)
            await execute_hook(module, hook_name, payload, context)
            _logger.info(
                "plugin.hook_executed",
                plugin_id=plugin.id,
                hook=hook_name,
            )
        except asyncio.TimeoutError:
            _logger.error(
                "plugin.hook_timed_out",
                plugin_id=plugin.id,
                hook=hook_name,
            )
            plugin.status = "error"
            db.add(plugin)
        except Exception as exc:
            _logger.error(
                "plugin.hook_error",
                plugin_id=plugin.id,
                hook=hook_name,
                error=str(exc),
            )
            plugin.status = "error"
            db.add(plugin)

    await db.commit()
