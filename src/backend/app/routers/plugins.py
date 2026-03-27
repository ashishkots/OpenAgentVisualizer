"""Plugin endpoints — registry browse, install, manage.

Endpoints:
    GET    /api/plugins/registry          — browse available plugins (search + paginate)
    POST   /api/plugins/install           — install from registry
    GET    /api/plugins                   — list installed plugins
    POST   /api/plugins/{id}/enable       — enable a disabled plugin
    POST   /api/plugins/{id}/disable      — disable an installed plugin
    DELETE /api/plugins/{id}              — uninstall a plugin
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, get_current_user
from app.models.plugin import Plugin, PluginRegistry
from app.models.user import User
from app.schemas.plugin import (
    PluginRegistryRead,
    PluginRead,
    PluginInstallRequest,
)
from app.services.plugin_service import validate_manifest

router = APIRouter(prefix="/api/plugins", tags=["plugins"])


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------


@router.get("/registry", response_model=List[PluginRegistryRead])
async def browse_registry(
    search: Optional[str] = Query(None, description="Filter by name or description"),
    verified_only: bool = Query(False, description="Only show verified plugins"),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[PluginRegistryRead]:
    """Browse the global plugin registry with optional search and pagination."""
    query = select(PluginRegistry)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            (PluginRegistry.name.ilike(pattern))
            | (PluginRegistry.description.ilike(pattern))
        )

    if verified_only:
        query = query.where(PluginRegistry.verified == True)  # noqa: E712

    query = query.order_by(PluginRegistry.downloads.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    entries = result.scalars().all()
    return [PluginRegistryRead.model_validate(e) for e in entries]


# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------


@router.post("/install", response_model=PluginRead, status_code=status.HTTP_201_CREATED)
async def install_plugin(
    body: PluginInstallRequest,
    workspace_id: str = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PluginRead:
    """Install a plugin from the registry into the current workspace.

    The registry entry's metadata is used to populate the plugin record.
    A minimal manifest is auto-generated since download/manifest_url may
    be None in the registry (for built-in plugins).
    """
    # Verify registry entry exists
    registry_entry = await db.get(PluginRegistry, body.registry_id)
    if registry_entry is None:
        raise HTTPException(status_code=404, detail="Registry entry not found")

    # Check not already installed
    existing = await db.scalar(
        select(Plugin).where(
            Plugin.workspace_id == workspace_id,
            Plugin.name == registry_entry.name,
        )
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="Plugin already installed in this workspace"
        )

    # Build a default manifest
    manifest: dict = {
        "name": registry_entry.name,
        "version": registry_entry.version,
        "author": registry_entry.author,
        "description": registry_entry.description,
        "permissions": [],
        "hooks": [],
        "routes": [],
        "module": "",  # populated when a real download_url is provided
    }

    errors = validate_manifest(manifest)
    if errors:
        raise HTTPException(
            status_code=422,
            detail=f"Manifest validation failed: {'; '.join(errors)}",
        )

    plugin = Plugin(
        workspace_id=workspace_id,
        name=registry_entry.name,
        description=registry_entry.description,
        version=registry_entry.version,
        author=registry_entry.author,
        manifest=manifest,
        status="installed",
        installed_by=current_user.id,
    )
    db.add(plugin)

    # Increment download counter on registry entry
    registry_entry.downloads += 1

    await db.commit()
    await db.refresh(plugin)
    return PluginRead.model_validate(plugin)


# ---------------------------------------------------------------------------
# Installed plugins
# ---------------------------------------------------------------------------


@router.get("", response_model=List[PluginRead])
async def list_installed(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[PluginRead]:
    """List all plugins installed in the current workspace."""
    result = await db.execute(
        select(Plugin)
        .where(Plugin.workspace_id == workspace_id)
        .order_by(Plugin.installed_at.desc())
    )
    plugins = result.scalars().all()
    return [PluginRead.model_validate(p) for p in plugins]


@router.post("/{plugin_id}/enable", response_model=PluginRead)
async def enable_plugin(
    plugin_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> PluginRead:
    """Enable a previously disabled plugin."""
    plugin = await _get_plugin_or_404(db, plugin_id, workspace_id)
    if plugin.status == "installed":
        raise HTTPException(status_code=409, detail="Plugin is already enabled")
    plugin.status = "installed"
    await db.commit()
    await db.refresh(plugin)
    return PluginRead.model_validate(plugin)


@router.post("/{plugin_id}/disable", response_model=PluginRead)
async def disable_plugin(
    plugin_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> PluginRead:
    """Disable an installed plugin without uninstalling it."""
    plugin = await _get_plugin_or_404(db, plugin_id, workspace_id)
    if plugin.status == "disabled":
        raise HTTPException(status_code=409, detail="Plugin is already disabled")
    plugin.status = "disabled"
    # Remove from module cache so it is not invoked on hooks
    from app.services.plugin_service import unload_plugin
    unload_plugin(plugin_id)
    await db.commit()
    await db.refresh(plugin)
    return PluginRead.model_validate(plugin)


@router.delete("/{plugin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def uninstall_plugin(
    plugin_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Uninstall a plugin and remove it from the module cache."""
    plugin = await _get_plugin_or_404(db, plugin_id, workspace_id)
    from app.services.plugin_service import unload_plugin
    unload_plugin(plugin_id)
    await db.delete(plugin)
    await db.commit()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _get_plugin_or_404(
    db: AsyncSession, plugin_id: str, workspace_id: str
) -> Plugin:
    """Fetch a plugin by ID, verifying workspace ownership."""
    result = await db.execute(
        select(Plugin).where(
            Plugin.id == plugin_id,
            Plugin.workspace_id == workspace_id,
        )
    )
    plugin = result.scalar_one_or_none()
    if plugin is None:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return plugin
