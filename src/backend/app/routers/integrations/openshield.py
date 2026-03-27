"""OpenShield security proxy endpoints."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.integrations import CircuitBreakerError
from app.schemas.openshield import (
    AgentSecurityView,
    SecurityPostureView,
    ViolationView,
)
from app.services.openshield_service import openshield_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/integrations/openshield",
    tags=["integrations", "openshield"],
)


@router.get("/posture", response_model=SecurityPostureView)
async def get_security_posture(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> SecurityPostureView:
    """Fetch workspace-level security posture from OpenShield."""
    try:
        raw = await openshield_service.get_posture(workspace_id, db)
        return SecurityPostureView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenShield is temporarily unavailable",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("OpenShield posture error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenShield connection unavailable",
        )


@router.get("/agents/{agent_id}", response_model=AgentSecurityView)
async def get_agent_security(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> AgentSecurityView:
    """Fetch per-agent security posture."""
    try:
        raw = await openshield_service.get_agent_posture(workspace_id, agent_id, db)
        return AgentSecurityView(**raw)
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenShield is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenShield agent posture error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenShield connection unavailable",
        )


@router.get("/violations", response_model=list[ViolationView])
async def list_violations(
    start: Optional[str] = Query(None, description="ISO 8601 start timestamp"),
    end: Optional[str] = Query(None, description="ISO 8601 end timestamp"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list[ViolationView]:
    """Fetch security violations within a time window."""
    try:
        raw = await openshield_service.get_violations(workspace_id, start, end, db)
        return [ViolationView(**item) for item in raw]
    except CircuitBreakerError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenShield is temporarily unavailable",
        )
    except Exception as exc:
        logger.error("OpenShield violations error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenShield connection unavailable",
        )
