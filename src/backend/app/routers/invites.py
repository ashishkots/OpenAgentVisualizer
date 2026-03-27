"""Workspace invite endpoints.

POST   /api/workspaces/invite          — create an invite link
GET    /api/workspaces/invites         — list pending invites
DELETE /api/workspaces/invites/{id}    — revoke a pending invite
POST   /api/workspaces/invites/{token}/accept — accept an invite
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id, get_workspace_id
from app.models.invite import WorkspaceInvite
from app.schemas.invite import InviteAcceptResponse, InviteCreate, InviteRead
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/workspaces", tags=["collaboration"])


@router.post("/invite", response_model=InviteRead, status_code=201)
async def create_invite(
    body: InviteCreate,
    workspace_id: str = Depends(get_workspace_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> InviteRead:
    """Create a workspace invite and log the activity."""
    invite = WorkspaceInvite(
        workspace_id=workspace_id,
        email=body.email,
        role=body.role,
        invited_by=user_id,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    await log_activity(
        db,
        workspace_id=workspace_id,
        user_id=user_id,
        action="member_invited",
        target_type="invite",
        target_id=invite.id,
        extra_data={"email": body.email, "role": body.role},
    )
    return invite


@router.get("/invites", response_model=list[InviteRead])
async def list_invites(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list[InviteRead]:
    """List all pending invites for the workspace."""
    result = await db.execute(
        select(WorkspaceInvite)
        .where(
            WorkspaceInvite.workspace_id == workspace_id,
            WorkspaceInvite.status == "pending",
        )
        .order_by(WorkspaceInvite.created_at.desc())
    )
    return list(result.scalars().all())


@router.delete("/invites/{invite_id}")
async def revoke_invite(
    invite_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Revoke (delete) a pending invite by ID."""
    result = await db.execute(
        select(WorkspaceInvite).where(
            WorkspaceInvite.id == invite_id,
            WorkspaceInvite.workspace_id == workspace_id,
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    await db.delete(invite)
    await db.commit()
    return {"status": "revoked"}


@router.post("/invites/{token}/accept", response_model=InviteAcceptResponse)
async def accept_invite(
    token: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> InviteAcceptResponse:
    """Accept a workspace invite by token.

    Validates that the invite exists, is still pending, and has not expired.
    """
    result = await db.execute(
        select(WorkspaceInvite).where(
            WorkspaceInvite.token == token,
            WorkspaceInvite.status == "pending",
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already used")

    # Compare consistently — expires_at is timezone-aware
    now = datetime.now(tz=timezone.utc)
    expires = invite.expires_at
    if expires.tzinfo is None:
        # Fallback for naive datetimes stored by older data
        expires = expires.replace(tzinfo=timezone.utc)
    if now > expires:
        raise HTTPException(status_code=410, detail="Invite has expired")

    invite.status = "accepted"
    await db.commit()
    await log_activity(
        db,
        workspace_id=invite.workspace_id,
        user_id=user_id,
        action="member_joined",
        target_type="workspace",
        target_id=invite.workspace_id,
    )
    return InviteAcceptResponse(workspace_id=invite.workspace_id, role=invite.role)
