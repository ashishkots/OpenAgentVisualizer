"""Quest endpoints — list quests, agent progress, and reward claims."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.agent import Agent
from app.models.quest import AgentQuestProgress, Quest
from app.schemas.quest import AgentQuestProgressRead, QuestRead, QuestWithProgressRead
from app.services.quest_service import QuestService

router = APIRouter(prefix="/api/quests", tags=["quests"])
_svc = QuestService()


@router.get("", response_model=List[QuestWithProgressRead])
async def list_quests(
    agent_id: Optional[str] = Query(None, description="Include agent's progress if provided"),
    quest_type: Optional[str] = Query(None, pattern="^(daily|weekly|epic)$"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[QuestWithProgressRead]:
    """List all active quests for the workspace. Optionally include agent progress."""
    stmt = select(Quest).where(
        Quest.workspace_id == workspace_id,
        Quest.active == True,  # noqa: E712
    )
    if quest_type:
        stmt = stmt.where(Quest.type == quest_type)
    quests = (await db.execute(stmt)).scalars().all()

    progress_map: dict[str, AgentQuestProgress] = {}
    if agent_id:
        progress_rows = (
            await db.execute(
                select(AgentQuestProgress).where(
                    AgentQuestProgress.agent_id == agent_id,
                    AgentQuestProgress.quest_id.in_([q.id for q in quests]),
                )
            )
        ).scalars().all()
        progress_map = {p.quest_id: p for p in progress_rows}

    result: list[QuestWithProgressRead] = []
    for q in quests:
        prog = progress_map.get(q.id)
        result.append(
            QuestWithProgressRead(
                id=q.id,
                workspace_id=q.workspace_id,
                name=q.name,
                description=q.description,
                type=q.type,
                steps=q.steps,
                xp_reward=q.xp_reward,
                currency_reward=q.currency_reward,
                icon=q.icon,
                active=q.active,
                reset_hours=q.reset_hours,
                created_at=q.created_at,
                progress=AgentQuestProgressRead.model_validate(prog) if prog else None,
            )
        )
    return result


@router.get("/agents/{agent_id}", response_model=List[AgentQuestProgressRead])
async def get_agent_quest_progress(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[AgentQuestProgressRead]:
    """Return all quest progress records for a specific agent."""
    agent = await db.scalar(
        select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
    )
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    progress_rows = (
        await db.execute(
            select(AgentQuestProgress).where(
                AgentQuestProgress.agent_id == agent_id
            )
        )
    ).scalars().all()
    return list(progress_rows)


@router.post("/{quest_id}/claim")
async def claim_quest_rewards(
    quest_id: str,
    agent_id: str = Query(..., description="Agent claiming the reward"),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Claim XP and token rewards for a completed quest."""
    try:
        result = await _svc.claim_quest_rewards(db, workspace_id, agent_id, quest_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return result
