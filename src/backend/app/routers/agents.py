from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, WorkspaceMember
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentRead, AgentStats
import uuid

router = APIRouter(prefix="/api/agents", tags=["agents"])


async def _get_workspace_id(current_user: User, db: AsyncSession) -> str:
    member = await db.scalar(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == current_user.id)
        .order_by(asc(WorkspaceMember.id))
    )
    if not member:
        raise HTTPException(status_code=400, detail="No workspace found")
    return member.workspace_id


@router.post("", status_code=201, response_model=AgentRead)
async def create_agent(
    req: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    agent = Agent(
        id=str(uuid.uuid4()),
        workspace_id=workspace_id,
        name=req.name,
        role=req.role,
        framework=req.framework,
        avatar_id=req.avatar_id,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("", response_model=List[AgentRead])
async def list_agents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    result = await db.execute(
        select(Agent).where(Agent.workspace_id == workspace_id)
    )
    return result.scalars().all()


@router.get("/{agent_id}/stats", response_model=AgentStats)
async def get_agent_stats(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_id = await _get_workspace_id(current_user, db)
    agent = await db.scalar(
        select(Agent)
        .where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
