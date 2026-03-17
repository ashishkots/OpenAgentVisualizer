from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.core.utils import utcnow
from app.models.event import AgentSession, Event
from app.schemas.session import SessionCreate, SessionRead
import uuid

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", status_code=201, response_model=SessionRead)
async def create_session(
    req: SessionCreate,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
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
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
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
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> list:
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
