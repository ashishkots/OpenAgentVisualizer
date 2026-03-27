"""Challenge service — progress aggregation, completion, and expiry checks."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challenge import Challenge, ChallengeProgress
from app.models.agent import Agent, Task
from app.models.event import Event


async def update_progress(db: AsyncSession, challenge: Challenge) -> int:
    """Aggregate progress for a challenge from events/tasks and update current_value.

    Returns the new current_value.
    """
    workspace_id = challenge.workspace_id
    window_start = challenge.start_at
    window_end = challenge.end_at

    if challenge.goal_type == "events":
        current = await db.scalar(
            select(func.count(Event.id)).where(
                Event.workspace_id == workspace_id,
                Event.timestamp >= window_start,
                Event.timestamp <= window_end,
            )
        ) or 0
    elif challenge.goal_type == "tasks":
        current = await db.scalar(
            select(func.count(Task.id)).where(
                Task.workspace_id == workspace_id,
                Task.status == "completed",
                Task.completed_at >= window_start,
                Task.completed_at <= window_end,
            )
        ) or 0
    elif challenge.goal_type == "xp":
        from app.models.gamification import XPTransaction
        current = await db.scalar(
            select(func.coalesce(func.sum(XPTransaction.xp_delta), 0)).where(
                XPTransaction.workspace_id == workspace_id,
                XPTransaction.created_at >= window_start,
                XPTransaction.created_at <= window_end,
            )
        ) or 0
    else:
        current = challenge.current_value

    challenge.current_value = current
    db.add(challenge)
    return current


async def check_completion(db: AsyncSession, challenge: Challenge) -> bool:
    """Mark challenge as completed and distribute rewards if goal is met.

    Returns True if the challenge was just completed.
    """
    if challenge.current_value < challenge.goal_value:
        return False
    if challenge.status != "active":
        return False

    challenge.status = "completed"
    db.add(challenge)

    # Distribute XP rewards to all agents in the workspace
    if challenge.reward_xp > 0:
        from app.models.gamification import XPTransaction
        result = await db.execute(
            select(Agent.id).where(Agent.workspace_id == challenge.workspace_id)
        )
        agent_ids = [row[0] for row in result.all()]
        for agent_id in agent_ids:
            xp_tx = XPTransaction(
                workspace_id=challenge.workspace_id,
                agent_id=agent_id,
                xp_delta=challenge.reward_xp,
                reason=f"challenge_completed:{challenge.id}",
            )
            db.add(xp_tx)
            agent = await db.get(Agent, agent_id)
            if agent:
                agent.xp_total += challenge.reward_xp
                db.add(agent)

    # Distribute token rewards to the workspace wallet
    if challenge.reward_tokens > 0:
        from app.services import wallet_service
        await wallet_service.credit(
            db=db,
            workspace_id=challenge.workspace_id,
            amount=challenge.reward_tokens,
            tx_type="challenge_reward",
            reference_id=challenge.id,
            description=f"Challenge completed: '{challenge.name}'",
        )

    return True


async def check_expiry(db: AsyncSession, challenge: Challenge) -> bool:
    """Mark challenge as failed if end_at has passed and goal was not met.

    Returns True if the challenge was just marked failed.
    """
    if challenge.status != "active":
        return False
    if datetime.utcnow() <= challenge.end_at:
        return False
    if challenge.current_value >= challenge.goal_value:
        return False

    challenge.status = "failed"
    db.add(challenge)
    return True
