"""Skill tree endpoints — browse trees and unlock skills for agents."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.agent import Agent
from app.models.skill import AgentSkill, SkillNode, SkillTree
from app.schemas.skill import (
    AgentSkillRead,
    SkillNodeRead,
    SkillTreeRead,
    UnlockSkillResponse,
)
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/api/skill-trees", tags=["skills"])
_wallet_svc = WalletService()


@router.get("", response_model=List[SkillTreeRead])
async def list_skill_trees(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[SkillTreeRead]:
    """Return all skill trees with their nodes."""
    trees = (await db.execute(select(SkillTree))).scalars().all()
    result: list[SkillTreeRead] = []
    for tree in trees:
        nodes = (
            await db.execute(
                select(SkillNode).where(SkillNode.tree_id == tree.id).order_by(SkillNode.tier)
            )
        ).scalars().all()
        result.append(
            SkillTreeRead(
                id=tree.id,
                name=tree.name,
                description=tree.description,
                category=tree.category,
                icon=tree.icon,
                nodes=[SkillNodeRead.model_validate(n) for n in nodes],
            )
        )
    return result


@router.get("/agents/{agent_id}/skills", response_model=List[AgentSkillRead])
async def get_agent_skills(
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[AgentSkillRead]:
    """Return all skill nodes unlocked by a specific agent."""
    agent = await db.scalar(
        select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
    )
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent_skills = (
        await db.execute(
            select(AgentSkill).where(AgentSkill.agent_id == agent_id)
        )
    ).scalars().all()

    result: list[AgentSkillRead] = []
    for skill in agent_skills:
        node = await db.get(SkillNode, skill.node_id)
        result.append(
            AgentSkillRead(
                id=skill.id,
                agent_id=skill.agent_id,
                node_id=skill.node_id,
                unlocked_at=skill.unlocked_at,
                node=SkillNodeRead.model_validate(node) if node else None,
            )
        )
    return result


@router.post("/agents/{agent_id}/skills/{node_id}/unlock", response_model=UnlockSkillResponse)
async def unlock_skill(
    agent_id: str,
    node_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> UnlockSkillResponse:
    """Unlock a skill node for an agent.

    Validates:
    - Agent level >= node level_required
    - Parent node is already unlocked (if node has a parent)
    - Wallet balance >= node cost
    Deducts tokens from workspace wallet on success.
    """
    agent = await db.scalar(
        select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
    )
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    node = await db.get(SkillNode, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Skill node not found")

    # Check: already unlocked
    existing = await db.scalar(
        select(AgentSkill).where(
            AgentSkill.agent_id == agent_id,
            AgentSkill.node_id == node_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Skill already unlocked")

    # Check: agent level requirement
    if agent.level < node.level_required:
        raise HTTPException(
            status_code=400,
            detail=f"Agent level {agent.level} < required level {node.level_required}",
        )

    # Check: parent unlocked
    if node.parent_id:
        parent_unlocked = await db.scalar(
            select(AgentSkill).where(
                AgentSkill.agent_id == agent_id,
                AgentSkill.node_id == node.parent_id,
            )
        )
        if not parent_unlocked:
            raise HTTPException(status_code=400, detail="Parent skill node must be unlocked first")

    # Deduct tokens from wallet
    wallet = await _wallet_svc.get_or_create_wallet(db, workspace_id)
    try:
        await _wallet_svc.debit(
            db,
            wallet_id=wallet.id,
            amount=node.cost,
            tx_type="skill_unlock",
            reference_id=node_id,
            description=f"Unlock skill: {node.name}",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Create skill record
    skill = AgentSkill(agent_id=agent_id, node_id=node_id)
    db.add(skill)
    await db.flush()
    await db.refresh(wallet)
    await db.commit()

    return UnlockSkillResponse(
        agent_skill_id=skill.id,
        node_id=node_id,
        tokens_spent=node.cost,
        new_wallet_balance=wallet.balance,
    )
