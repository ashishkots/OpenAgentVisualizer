"""OpenMesh proxy endpoints.

Proxies mesh topology and stats queries to the OpenMesh product API.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.integrations import CircuitBreakerError
from app.schemas.openmesh import MeshNodeView, MeshStatsView, MeshTopologyView
from app.services.openmesh_service import openmesh_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/integrations/openmesh",
    tags=["integrations", "openmesh"],
)


@router.get("/topology", response_model=MeshTopologyView)
async def get_mesh_topology(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> MeshTopologyView:
    """Fetch the current agent mesh topology from OpenMesh."""
    try:
        raw = await openmesh_service.get_topology(workspace_id, db)
        return MeshTopologyView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMesh is temporarily unavailable",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("OpenMesh topology error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMesh connection unavailable",
        )


@router.get("/nodes/{node_id}", response_model=MeshNodeView)
async def get_mesh_node(
    node_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> MeshNodeView:
    """Fetch detail for a single mesh node (agent)."""
    try:
        raw = await openmesh_service.get_node(workspace_id, node_id, db)
        return MeshNodeView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMesh is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenMesh node error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMesh connection unavailable",
        )


@router.get("/stats", response_model=MeshStatsView)
async def get_mesh_stats(
    period: str = Query("1h", description="Time period: 1h | 6h | 24h | 7d"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> MeshStatsView:
    """Fetch aggregate mesh network statistics."""
    try:
        raw = await openmesh_service.get_stats(workspace_id, period, db)
        return MeshStatsView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMesh is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenMesh stats error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMesh connection unavailable",
        )
