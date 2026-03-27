"""Tests for the plugin system — registry, install, enable/disable, hook dispatch."""

import asyncio
import types
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Registry tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_registry_empty(authed_client: AsyncClient):
    """Registry returns empty list when no entries are seeded (test DB)."""
    r = await authed_client.get("/api/plugins/registry")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_list_installed_empty(authed_client: AsyncClient):
    """Installed plugins list is empty on a fresh workspace."""
    r = await authed_client.get("/api/plugins")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_install_plugin_not_found(authed_client: AsyncClient):
    """Installing a plugin with a non-existent registry_id returns 404."""
    r = await authed_client.post(
        "/api/plugins/install",
        json={"registry_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_enable_plugin_not_found(authed_client: AsyncClient):
    """Enabling a non-existent plugin returns 404."""
    r = await authed_client.post("/api/plugins/nonexistent-id/enable")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_disable_plugin_not_found(authed_client: AsyncClient):
    """Disabling a non-existent plugin returns 404."""
    r = await authed_client.post("/api/plugins/nonexistent-id/disable")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_uninstall_plugin_not_found(authed_client: AsyncClient):
    """Uninstalling a non-existent plugin returns 404."""
    r = await authed_client.delete("/api/plugins/nonexistent-id")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_install_and_manage_plugin(authed_client: AsyncClient):
    """Full lifecycle: install, disable, enable, uninstall."""
    # Seed a registry entry directly via the DB session
    from app.models.plugin import PluginRegistry
    import uuid

    # We need to insert a registry entry first
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        entry = PluginRegistry(
            id=str(uuid.uuid4()),
            name="test-plugin",
            description="A test plugin",
            version="1.0.0",
            author="Test Author",
            verified=True,
            downloads=0,
        )
        db.add(entry)
        await db.commit()
        registry_id = entry.id

    # Install
    r = await authed_client.post("/api/plugins/install", json={"registry_id": registry_id})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "test-plugin"
    assert data["status"] == "installed"
    plugin_id = data["id"]

    # Appears in installed list
    list_r = await authed_client.get("/api/plugins")
    assert list_r.status_code == 200
    assert any(p["id"] == plugin_id for p in list_r.json())

    # Disable
    dis_r = await authed_client.post(f"/api/plugins/{plugin_id}/disable")
    assert dis_r.status_code == 200
    assert dis_r.json()["status"] == "disabled"

    # Disable again → 409
    dis2 = await authed_client.post(f"/api/plugins/{plugin_id}/disable")
    assert dis2.status_code == 409

    # Enable
    en_r = await authed_client.post(f"/api/plugins/{plugin_id}/enable")
    assert en_r.status_code == 200
    assert en_r.json()["status"] == "installed"

    # Enable again → 409
    en2 = await authed_client.post(f"/api/plugins/{plugin_id}/enable")
    assert en2.status_code == 409

    # Uninstall
    del_r = await authed_client.delete(f"/api/plugins/{plugin_id}")
    assert del_r.status_code == 204

    # Gone from list
    list2 = await authed_client.get("/api/plugins")
    assert not any(p["id"] == plugin_id for p in list2.json())


@pytest.mark.asyncio
async def test_install_duplicate_returns_409(authed_client: AsyncClient):
    """Installing the same plugin twice returns 409 Conflict."""
    from app.models.plugin import PluginRegistry
    from app.core.database import AsyncSessionLocal
    import uuid

    async with AsyncSessionLocal() as db:
        entry = PluginRegistry(
            id=str(uuid.uuid4()),
            name="dup-plugin",
            description="Duplicate test",
            version="1.0.0",
            author="Tester",
            verified=False,
            downloads=0,
        )
        db.add(entry)
        await db.commit()
        registry_id = entry.id

    r1 = await authed_client.post("/api/plugins/install", json={"registry_id": registry_id})
    assert r1.status_code == 201

    r2 = await authed_client.post("/api/plugins/install", json={"registry_id": registry_id})
    assert r2.status_code == 409


# ---------------------------------------------------------------------------
# Manifest validation tests
# ---------------------------------------------------------------------------


def test_validate_manifest_valid():
    """A complete manifest passes validation."""
    from app.services.plugin_service import validate_manifest

    manifest = {
        "name": "my-plugin",
        "version": "1.0.0",
        "author": "Alice",
        "description": "Does stuff",
        "permissions": ["read:agents"],
        "hooks": ["on_agent_created"],
    }
    errors = validate_manifest(manifest)
    assert errors == []


def test_validate_manifest_missing_fields():
    """Missing required fields produce error messages."""
    from app.services.plugin_service import validate_manifest

    errors = validate_manifest({})
    assert any("name" in e for e in errors)
    assert any("version" in e for e in errors)
    assert any("author" in e for e in errors)
    assert any("description" in e for e in errors)


def test_validate_manifest_bad_semver():
    """Non-semver version string produces an error."""
    from app.services.plugin_service import validate_manifest

    errors = validate_manifest(
        {"name": "p", "version": "latest", "author": "a", "description": "d"}
    )
    assert any("semver" in e for e in errors)


def test_validate_manifest_valid_semver():
    """Valid semver passes version check."""
    from app.services.plugin_service import validate_manifest

    errors = validate_manifest(
        {"name": "p", "version": "2.3.10", "author": "a", "description": "d"}
    )
    assert errors == []


# ---------------------------------------------------------------------------
# Hook dispatch tests (mocked)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_execute_hook_not_implemented():
    """execute_hook returns None when the module has no matching function."""
    from app.services.plugin_service import execute_hook, PluginContext

    module = types.ModuleType("dummy")
    ctx = MagicMock(spec=PluginContext)
    result = await execute_hook(module, "on_agent_created", {}, ctx)
    assert result is None


@pytest.mark.asyncio
async def test_execute_hook_calls_function():
    """execute_hook invokes the hook function and returns its result."""
    from app.services.plugin_service import execute_hook, PluginContext

    module = types.ModuleType("my_plugin")
    called_with = {}

    def on_event(payload, context):
        called_with.update(payload)
        return "ok"

    module.on_event = on_event  # type: ignore[attr-defined]

    ctx = MagicMock(spec=PluginContext)
    result = await execute_hook(module, "on_event", {"x": 1}, ctx)
    assert result == "ok"
    assert called_with == {"x": 1}


@pytest.mark.asyncio
async def test_execute_hook_timeout():
    """execute_hook raises asyncio.TimeoutError when hook exceeds 5 seconds."""
    from app.services.plugin_service import execute_hook, PluginContext
    import time

    module = types.ModuleType("slow_plugin")

    def slow_hook(payload, ctx):
        time.sleep(10)  # will be killed by timeout

    module.slow_hook = slow_hook  # type: ignore[attr-defined]

    ctx = MagicMock(spec=PluginContext)
    with patch("app.services.plugin_service._HOOK_TIMEOUT_SECONDS", 0.05):
        with pytest.raises(asyncio.TimeoutError):
            await execute_hook(module, "slow_hook", {}, ctx)


@pytest.mark.asyncio
async def test_dispatch_hook_skips_non_matching():
    """dispatch_hook skips plugins that don't declare the hook."""
    from app.services.plugin_service import dispatch_hook
    from app.models.plugin import Plugin

    plugin = Plugin(
        id="p1",
        workspace_id="ws1",
        name="no-hooks-plugin",
        description="d",
        version="1.0.0",
        author="a",
        manifest={"hooks": [], "module": ""},  # no hooks declared
        status="installed",
        installed_by="u1",
    )

    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [plugin]
    db.execute = AsyncMock(return_value=mock_result)
    db.commit = AsyncMock()

    # Should complete without error — no hooks executed
    await dispatch_hook(db, "ws1", "on_agent_created", {})
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_dispatch_hook_marks_error_on_exception():
    """dispatch_hook sets plugin.status=error when the hook raises an exception."""
    from app.services.plugin_service import dispatch_hook, _loaded_plugins
    from app.models.plugin import Plugin

    plugin = Plugin(
        id="p-err",
        workspace_id="ws1",
        name="bad-plugin",
        description="d",
        version="1.0.0",
        author="a",
        manifest={"hooks": ["on_event"], "module": "bad_module"},
        status="installed",
        installed_by="u1",
    )

    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [plugin]
    db.execute = AsyncMock(return_value=mock_result)
    db.add = MagicMock()
    db.commit = AsyncMock()

    # Inject a broken module
    broken_module = types.ModuleType("bad_module")
    def bad_hook(payload, ctx):
        raise RuntimeError("Plugin crashed")
    broken_module.on_event = bad_hook  # type: ignore[attr-defined]
    _loaded_plugins["p-err"] = broken_module

    try:
        await dispatch_hook(db, "ws1", "on_event", {})
        assert plugin.status == "error"
        db.add.assert_called_once_with(plugin)
    finally:
        _loaded_plugins.pop("p-err", None)
