"""Integration configuration CRUD endpoints.

Allows per-workspace management of cross-product integration settings.
API keys are encrypted before storage and never returned in responses.
"""

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.integrations import (
    CircuitBreakerError,
    encrypt_api_key,
)
from app.models.integration import IntegrationConfig
from app.schemas.integration import (
    IntegrationConfigCreate,
    IntegrationConfigResponse,
    IntegrationConfigUpdate,
    IntegrationHealthResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

ALLOWED_PRODUCTS = {"opentrace", "openmesh", "openmind", "openshield"}


def _config_to_response(obj: IntegrationConfig) -> IntegrationConfigResponse:
    settings_dict = None
    if obj.settings_json:
        try:
            settings_dict = json.loads(obj.settings_json)
        except (ValueError, TypeError):
            settings_dict = None
    return IntegrationConfigResponse(
        id=obj.id,
        workspace_id=obj.workspace_id,
        product_name=obj.product_name,
        base_url=obj.base_url,
        enabled=obj.enabled,
        settings=settings_dict,
        created_at=obj.created_at,
        updated_at=obj.updated_at,
    )


@router.get("/config", response_model=list[IntegrationConfigResponse])
async def list_integration_configs(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list[IntegrationConfigResponse]:
    """Return all integration configurations for the authenticated workspace."""
    result = await db.execute(
        select(IntegrationConfig).where(IntegrationConfig.workspace_id == workspace_id)
    )
    return [_config_to_response(c) for c in result.scalars().all()]


@router.put(
    "/config/{product_name}",
    response_model=IntegrationConfigResponse,
    status_code=status.HTTP_200_OK,
)
async def upsert_integration_config(
    product_name: str,
    body: IntegrationConfigCreate,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> IntegrationConfigResponse:
    """Create or replace an integration configuration for the workspace.

    The API key is encrypted before persistence and is never returned.
    """
    if product_name not in ALLOWED_PRODUCTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown product '{product_name}'. Allowed: {sorted(ALLOWED_PRODUCTS)}",
        )
    if body.product_name != product_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="product_name in body must match URL path parameter",
        )

    encrypted_key = encrypt_api_key(body.api_key)
    settings_json = json.dumps(body.settings) if body.settings else None

    existing = await db.scalar(
        select(IntegrationConfig).where(
            IntegrationConfig.workspace_id == workspace_id,
            IntegrationConfig.product_name == product_name,
        )
    )

    if existing:
        existing.base_url = body.base_url
        existing.api_key_encrypted = encrypted_key
        existing.enabled = body.enabled
        existing.settings_json = settings_json
        await db.commit()
        await db.refresh(existing)
        return _config_to_response(existing)

    config = IntegrationConfig(
        workspace_id=workspace_id,
        product_name=product_name,
        base_url=body.base_url,
        api_key_encrypted=encrypted_key,
        enabled=body.enabled,
        settings_json=settings_json,
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return _config_to_response(config)


@router.patch(
    "/config/{product_name}",
    response_model=IntegrationConfigResponse,
)
async def update_integration_config(
    product_name: str,
    body: IntegrationConfigUpdate,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> IntegrationConfigResponse:
    """Partially update an existing integration configuration."""
    if product_name not in ALLOWED_PRODUCTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown product '{product_name}'",
        )

    config = await db.scalar(
        select(IntegrationConfig).where(
            IntegrationConfig.workspace_id == workspace_id,
            IntegrationConfig.product_name == product_name,
        )
    )
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No configuration found for {product_name}",
        )

    if body.base_url is not None:
        config.base_url = body.base_url
    if body.api_key is not None:
        config.api_key_encrypted = encrypt_api_key(body.api_key)
    if body.enabled is not None:
        config.enabled = body.enabled
    if body.settings is not None:
        config.settings_json = json.dumps(body.settings)

    await db.commit()
    await db.refresh(config)
    return _config_to_response(config)


@router.delete("/config/{product_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration_config(
    product_name: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an integration configuration for the workspace."""
    config = await db.scalar(
        select(IntegrationConfig).where(
            IntegrationConfig.workspace_id == workspace_id,
            IntegrationConfig.product_name == product_name,
        )
    )
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No configuration found for {product_name}",
        )
    await db.delete(config)
    await db.commit()


@router.post(
    "/{product_name}/test",
    response_model=IntegrationHealthResponse,
)
async def test_integration_connection(
    product_name: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> IntegrationHealthResponse:
    """Test connectivity to a specific integration."""
    if product_name not in ALLOWED_PRODUCTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown product '{product_name}'",
        )

    client = _get_client(product_name)
    result = await client.health_check(workspace_id, db)
    return IntegrationHealthResponse(
        product_name=product_name,
        **result,
    )


@router.get("/health", response_model=list[IntegrationHealthResponse])
async def check_all_integration_health(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list[IntegrationHealthResponse]:
    """Check connectivity to all configured integrations."""
    import asyncio

    results = await asyncio.gather(
        *[
            _check_one(product_name, workspace_id, db)
            for product_name in sorted(ALLOWED_PRODUCTS)
        ]
    )
    return list(results)


async def _check_one(
    product_name: str, workspace_id: str, db: Any
) -> IntegrationHealthResponse:
    client = _get_client(product_name)
    result = await client.health_check(workspace_id, db)
    return IntegrationHealthResponse(product_name=product_name, **result)


def _get_client(product_name: str):  # type: ignore[return]
    from app.services.openmesh_service import openmesh_service
    from app.services.openmind_service import openmind_service
    from app.services.openshield_service import openshield_service
    from app.services.opentrace_service import opentrace_service

    mapping = {
        "opentrace": opentrace_service,
        "openmesh": openmesh_service,
        "openmind": openmind_service,
        "openshield": openshield_service,
    }
    return mapping[product_name]
