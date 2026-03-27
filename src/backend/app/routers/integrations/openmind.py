"""OpenMind knowledge graph proxy endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.integrations import CircuitBreakerError
from app.schemas.openmind import (
    EntityDetailView,
    KnowledgeGraphView,
    KnowledgeNodeView,
)
from app.services.openmind_service import openmind_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/integrations/openmind",
    tags=["integrations", "openmind"],
)


@router.get("/graph", response_model=KnowledgeGraphView)
async def get_knowledge_graph(
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> KnowledgeGraphView:
    """Fetch a paginated knowledge graph snapshot from OpenMind."""
    try:
        raw = await openmind_service.get_graph(workspace_id, limit, offset, db)
        return KnowledgeGraphView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMind is temporarily unavailable",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("OpenMind graph error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMind connection unavailable",
        )


@router.get("/entities/{entity_id}", response_model=EntityDetailView)
async def get_entity_detail(
    entity_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> EntityDetailView:
    """Fetch full detail for a knowledge graph entity."""
    try:
        raw = await openmind_service.get_entity(workspace_id, entity_id, db)
        return EntityDetailView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMind is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenMind entity error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMind connection unavailable",
        )


@router.get("/search", response_model=list[KnowledgeNodeView])
async def search_knowledge(
    q: str = Query(..., description="Search query string", min_length=1),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list[KnowledgeNodeView]:
    """Search knowledge graph entities by name or content."""
    try:
        raw = await openmind_service.search_entities(workspace_id, q, db)
        return [KnowledgeNodeView(**item) for item in raw]
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMind is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenMind search error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenMind connection unavailable",
        )
