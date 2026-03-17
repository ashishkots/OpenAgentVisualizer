from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.utils import utcnow
from app.models.user import User, WorkspaceMember
from app.models.event import AgentSession, Event
from app.schemas.session import SessionCreate, SessionRead
import uuid

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


async def _get_workspace_id(user: User, db: AsyncSession) -> str:
    member = await db.scalar(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(asc(WorkspaceMember.id))
    )
    return member.workspace_id if member else "unknown"


@router.post("", status_code=201, response_model=SessionRead)
async def create_session(
    req: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    session = AgentSession(
        id=str(uuid.uuid4()),
        workspace_id=workspace_id,
        name=req.name,
        agent_ids=req.agent_ids,
        started_at=utcnow(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.patch("/{session_id}/end", response_model=SessionRead)
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    session = await db.scalar(
        select(AgentSession).where(
            AgentSession.id == session_id,
            AgentSession.workspace_id == workspace_id,
        )
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.ended_at = utcnow()
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}/replay")
async def get_replay_events(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list:
    workspace_id = await _get_workspace_id(current_user, db)
    # Verify session exists and belongs to workspace
    session = await db.scalar(
        select(AgentSession).where(
            AgentSession.id == session_id,
            AgentSession.workspace_id == workspace_id,
        )
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    # Fetch events for this session ordered by timestamp
    result = await db.execute(
        select(Event).where(
            Event.session_id == session_id,
            Event.workspace_id == workspace_id,
        ).order_by(asc(Event.timestamp))
    )
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "agent_id": e.agent_id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "extra_data": e.extra_data,
        }
        for e in events
    ]
