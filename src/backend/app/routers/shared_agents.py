"""Shared agents router: cross-workspace agent sharing within the same organization."""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_id
from app.models.agent import Agent
from app.models.organization import OrgMember, Organization, SharedAgent
from app.models.user import User, Workspace

logger = logging.getLogger(__name__)

router = APIRouter(tags=["shared-agents"])


# ---------------------------------------------------------------------------
# Schemas (inline — small surface area)
# ---------------------------------------------------------------------------


class ShareAgentRequest(BaseModel):
    target_workspace_id: str
    permissions: str = Field("read", description="read or write")


class SharedAgentRead(BaseModel):
    id: str
    agent_id: str
    source_workspace_id: str
    target_workspace_id: str
    permissions: str
    shared_by: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_workspace_org_id(db: AsyncSession, workspace_id: str) -> str | None:
    """Return the org_id for a workspace, or None if not assigned to an org."""
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        return None
    return ws.org_id


async def _assert_same_org(
    db: AsyncSession, workspace_a: str, workspace_b: str
) -> None:
    """Raise 403 if the two workspaces do not belong to the same organization."""
    org_a = await _get_workspace_org_id(db, workspace_a)
    org_b = await _get_workspace_org_id(db, workspace_b)

    if not org_a or not org_b:
        raise HTTPException(
            status_code=403,
            detail="Both workspaces must belong to the same organization to share agents",
        )
    if org_a != org_b:
        raise HTTPException(
            status_code=403,
            detail="Cannot share agents across different organizations",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/api/v1/agents/{agent_id}/share",
    response_model=SharedAgentRead,
    status_code=201,
    summary="Share an agent with another workspace",
)
async def share_agent(
    agent_id: str,
    body: ShareAgentRequest,
    current_user: User = Depends(get_current_user),
    current_workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> SharedAgent:
    # Verify agent belongs to current workspace
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.workspace_id != current_workspace_id:
        raise HTTPException(status_code=403, detail="Agent does not belong to your workspace")

    # Verify target workspace exists
    target_ws = await db.get(Workspace, body.target_workspace_id)
    if not target_ws:
        raise HTTPException(status_code=404, detail="Target workspace not found")

    # Cannot share with own workspace
    if body.target_workspace_id == current_workspace_id:
        raise HTTPException(status_code=400, detail="Cannot share agent with the same workspace")

    # Both workspaces must be in the same org
    await _assert_same_org(db, current_workspace_id, body.target_workspace_id)

    # Check not already shared
    existing = await db.scalar(
        select(SharedAgent).where(
            SharedAgent.agent_id == agent_id,
            SharedAgent.target_workspace_id == body.target_workspace_id,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Agent is already shared with that workspace")

    # Validate permissions value
    if body.permissions not in ("read", "write"):
        raise HTTPException(status_code=400, detail="permissions must be 'read' or 'write'")

    shared = SharedAgent(
        agent_id=agent_id,
        source_workspace_id=current_workspace_id,
        target_workspace_id=body.target_workspace_id,
        permissions=body.permissions,
        shared_by=current_user.id,
    )
    db.add(shared)
    await db.commit()
    await db.refresh(shared)
    logger.info(
        "agent.shared",
        agent_id=agent_id,
        source=current_workspace_id,
        target=body.target_workspace_id,
    )
    return shared


@router.get(
    "/api/v1/shared-agents",
    response_model=List[SharedAgentRead],
    summary="List agents shared with the current workspace",
)
async def list_shared_agents(
    current_workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[SharedAgent]:
    result = await db.execute(
        select(SharedAgent).where(
            SharedAgent.target_workspace_id == current_workspace_id
        )
    )
    return list(result.scalars().all())


@router.delete(
    "/api/v1/shared-agents/{share_id}",
    status_code=204,
    response_class=Response,
    summary="Revoke agent sharing",
)
async def revoke_shared_agent(
    share_id: str,
    current_user: User = Depends(get_current_user),
    current_workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    shared = await db.get(SharedAgent, share_id)
    if not shared:
        raise HTTPException(status_code=404, detail="Shared agent record not found")

    # Only the source workspace owner can revoke
    if shared.source_workspace_id != current_workspace_id:
        raise HTTPException(
            status_code=403,
            detail="Only the source workspace can revoke sharing",
        )

    await db.delete(shared)
    await db.commit()
    logger.info("agent.share_revoked", share_id=share_id, agent_id=shared.agent_id)
