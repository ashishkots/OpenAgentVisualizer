"""Organizations router: CRUD, member management, workspace listing, analytics."""
from __future__ import annotations

import re
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.organization import Organization, OrgMember
from app.models.user import User, Workspace
from app.models.agent import Agent
from app.models.event import Event
from app.models.gamification import XPTransaction
from app.schemas.organization import (
    OrgCreate,
    OrgUpdate,
    OrgRead,
    OrgMemberAdd,
    OrgMemberRead,
    WorkspaceRead,
    OrgAnalytics,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/orgs", tags=["organizations"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "org"


def _require_org_role(
    member: OrgMember | None, min_role: str = "member"
) -> None:
    """Raise 403 if member does not meet the required role."""
    if member is None:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    role_rank = {"member": 1, "admin": 2, "owner": 3}
    if role_rank.get(member.role, 0) < role_rank.get(min_role, 1):
        raise HTTPException(status_code=403, detail="Insufficient organization role")


# ---------------------------------------------------------------------------
# Org CRUD
# ---------------------------------------------------------------------------


@router.post("", response_model=OrgRead, status_code=201, summary="Create an organization")
async def create_org(
    body: OrgCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    import uuid

    slug = body.slug or f"{_slugify(body.name)}-{uuid.uuid4().hex[:6]}"

    # Check slug uniqueness
    existing = await db.scalar(select(Organization).where(Organization.slug == slug))
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already taken")

    org = Organization(
        name=body.name,
        slug=slug,
        logo_url=body.logo_url,
        plan=body.plan,
        created_by=current_user.id,
    )
    db.add(org)
    await db.flush()

    # Add creator as owner
    member = OrgMember(org_id=org.id, user_id=current_user.id, role="owner")
    db.add(member)
    await db.commit()
    await db.refresh(org)

    logger.info("org.created", org_id=org.id, user_id=current_user.id)
    return org


@router.get("", response_model=List[OrgRead], summary="List organizations current user belongs to")
async def list_orgs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Organization]:
    result = await db.execute(
        select(Organization)
        .join(OrgMember, OrgMember.org_id == Organization.id)
        .where(OrgMember.user_id == current_user.id)
    )
    return list(result.scalars().all())


@router.get("/{org_id}", response_model=OrgRead, summary="Get organization detail")
async def get_org(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == current_user.id,
        )
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return org


@router.put("/{org_id}", response_model=OrgRead, summary="Update organization")
async def update_org(
    org_id: str,
    body: OrgUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == current_user.id,
        )
    )
    _require_org_role(member, min_role="admin")

    if body.name is not None:
        org.name = body.name
    if body.logo_url is not None:
        org.logo_url = body.logo_url

    await db.commit()
    await db.refresh(org)
    return org


# ---------------------------------------------------------------------------
# Member management
# ---------------------------------------------------------------------------


@router.get(
    "/{org_id}/members",
    response_model=List[OrgMemberRead],
    summary="List organization members",
)
async def list_org_members(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[OrgMember]:
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == current_user.id,
        )
    )
    _require_org_role(member)

    result = await db.execute(select(OrgMember).where(OrgMember.org_id == org_id))
    return list(result.scalars().all())


@router.post(
    "/{org_id}/members",
    response_model=OrgMemberRead,
    status_code=201,
    summary="Add a member to the organization",
)
async def add_org_member(
    org_id: str,
    body: OrgMemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrgMember:
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    requester = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == current_user.id,
        )
    )
    _require_org_role(requester, min_role="admin")

    # Resolve user by email
    target_user = await db.scalar(select(User).where(User.email == body.email))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check not already a member
    existing = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == target_user.id,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    new_member = OrgMember(org_id=org_id, user_id=target_user.id, role=body.role)
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)
    logger.info("org.member_added", org_id=org_id, user_id=target_user.id, role=body.role)
    return new_member


@router.delete(
    "/{org_id}/members/{user_id}",
    status_code=204,
    response_class=Response,
    summary="Remove a member from the organization",
)
async def remove_org_member(
    org_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    requester = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == current_user.id,
        )
    )
    _require_org_role(requester, min_role="admin")

    target = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == user_id,
        )
    )
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    # Cannot remove the last owner
    if target.role == "owner":
        owner_count = await db.scalar(
            select(func.count(OrgMember.id)).where(
                OrgMember.org_id == org_id,
                OrgMember.role == "owner",
            )
        )
        if owner_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last owner")

    await db.delete(target)
    await db.commit()


# ---------------------------------------------------------------------------
# Workspaces
# ---------------------------------------------------------------------------


@router.get(
    "/{org_id}/workspaces",
    response_model=List[WorkspaceRead],
    summary="List workspaces belonging to an organization",
)
async def list_org_workspaces(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Workspace]:
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == current_user.id,
        )
    )
    _require_org_role(member)

    result = await db.execute(
        select(Workspace).where(Workspace.org_id == org_id)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------


@router.get(
    "/{org_id}/analytics",
    response_model=OrgAnalytics,
    summary="Cross-workspace analytics for an organization",
)
async def org_analytics(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrgAnalytics:
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == current_user.id,
        )
    )
    _require_org_role(member)

    # Collect workspace IDs for this org
    ws_result = await db.execute(
        select(Workspace.id).where(Workspace.org_id == org_id)
    )
    workspace_ids = [row[0] for row in ws_result.all()]
    total_workspaces = len(workspace_ids)

    if not workspace_ids:
        return OrgAnalytics(
            org_id=org_id,
            total_workspaces=0,
            total_agents=0,
            total_events=0,
            total_xp=0,
        )

    # Aggregate agents
    total_agents = await db.scalar(
        select(func.count(Agent.id)).where(Agent.workspace_id.in_(workspace_ids))
    ) or 0

    # Aggregate events
    total_events = await db.scalar(
        select(func.count(Event.id)).where(Event.workspace_id.in_(workspace_ids))
    ) or 0

    # Aggregate XP (xp_delta column name in XPTransaction)
    total_xp = await db.scalar(
        select(func.coalesce(func.sum(XPTransaction.xp_delta), 0)).where(
            XPTransaction.workspace_id.in_(workspace_ids)
        )
    ) or 0

    return OrgAnalytics(
        org_id=org_id,
        total_workspaces=total_workspaces,
        total_agents=int(total_agents),
        total_events=int(total_events),
        total_xp=int(total_xp),
    )
