"""Quest evaluation and reward service."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.event import Event
from app.models.quest import AgentQuestProgress, Quest


class QuestService:
    """Evaluates quest conditions and claims rewards for agents."""

    async def get_or_create_progress(
        self,
        db: AsyncSession,
        agent_id: str,
        quest_id: str,
    ) -> AgentQuestProgress:
        """Return existing progress record or create a new one."""
        progress = await db.scalar(
            select(AgentQuestProgress).where(
                AgentQuestProgress.agent_id == agent_id,
                AgentQuestProgress.quest_id == quest_id,
            )
        )
        if progress is None:
            progress = AgentQuestProgress(agent_id=agent_id, quest_id=quest_id)
            db.add(progress)
            await db.flush()
        return progress

    async def evaluate_quest_progress(
        self,
        db: AsyncSession,
        workspace_id: str,
        agent_id: str,
    ) -> list[str]:
        """Evaluate all active quests for an agent and advance steps where conditions are met.

        Returns list of quest IDs that were newly completed.
        """
        agent = await db.scalar(
            select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
        )
        if agent is None:
            return []

        quests = (
            await db.execute(
                select(Quest).where(
                    Quest.workspace_id == workspace_id,
                    Quest.active == True,  # noqa: E712
                )
            )
        ).scalars().all()

        newly_completed: list[str] = []
        stats = await self._compute_stats(db, workspace_id, agent_id)

        for quest in quests:
            progress = await self.get_or_create_progress(db, agent_id, quest.id)
            if progress.completed:
                continue

            steps = quest.steps or []
            if not steps:
                continue

            # Advance through steps whose conditions are satisfied
            for idx, step in enumerate(steps):
                if idx < progress.current_step:
                    continue
                condition_type: str = step.get("condition_type", "")
                condition_value: int = int(step.get("condition_value", 0))
                if self._condition_met(stats, agent, condition_type, condition_value):
                    progress.current_step = idx + 1
                else:
                    break  # Must complete steps in order

            # Check if all steps are now completed
            if progress.current_step >= len(steps) and not progress.completed:
                progress.completed = True
                progress.completed_at = datetime.now(timezone.utc)
                newly_completed.append(quest.id)

        await db.commit()
        return newly_completed

    async def claim_quest_rewards(
        self,
        db: AsyncSession,
        workspace_id: str,
        agent_id: str,
        quest_id: str,
    ) -> dict:
        """Claim XP and currency rewards for a completed quest.

        Raises ValueError if quest not found, not completed, or already claimed.
        """
        quest = await db.scalar(
            select(Quest).where(Quest.id == quest_id, Quest.workspace_id == workspace_id)
        )
        if quest is None:
            raise ValueError("Quest not found")

        progress = await db.scalar(
            select(AgentQuestProgress).where(
                AgentQuestProgress.agent_id == agent_id,
                AgentQuestProgress.quest_id == quest_id,
            )
        )
        if progress is None or not progress.completed:
            raise ValueError("Quest not completed")
        if progress.claimed:
            raise ValueError("Rewards already claimed")

        # Award XP to agent
        agent = await db.scalar(
            select(Agent).where(Agent.id == agent_id, Agent.workspace_id == workspace_id)
        )
        if agent is None:
            raise ValueError("Agent not found")

        agent.xp_total += quest.xp_reward
        progress.claimed = True

        # Credit tokens via wallet service if there is a currency reward
        if quest.currency_reward > 0:
            from app.services.wallet_service import WalletService
            wallet_svc = WalletService()
            wallet = await wallet_svc.get_or_create_wallet(db, workspace_id)
            await wallet_svc.credit(
                db,
                wallet_id=wallet.id,
                amount=quest.currency_reward,
                tx_type="quest_reward",
                reference_id=quest.id,
                description=f"Quest reward: {quest.name}",
            )

        await db.commit()
        return {"xp_awarded": quest.xp_reward, "tokens_awarded": quest.currency_reward}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _condition_met(
        self,
        stats: dict,
        agent: Agent,
        condition_type: str,
        condition_value: int,
    ) -> bool:
        """Return True when the agent meets the condition for a quest step."""
        match condition_type:
            case "events_ingested":
                return stats.get("events_ingested", 0) >= condition_value
            case "tasks_completed":
                return stats.get("tasks_completed", 0) >= condition_value
            case "xp_earned":
                return stats.get("xp_earned", 0) >= condition_value
            case "total_xp":
                return agent.xp_total >= condition_value
            case "agent_level":
                return agent.level >= condition_value
            case "error_free_tasks":
                return stats.get("error_free_tasks", 0) >= condition_value
            case "error_free_hours":
                return stats.get("error_free_hours", 0) >= condition_value
            case "uptime_minutes":
                return stats.get("uptime_minutes", 0) >= condition_value
            case "leaderboard_rank":
                rank = stats.get("leaderboard_rank")
                if rank is None:
                    return False
                return rank <= condition_value
            case "integrations_used":
                return stats.get("integrations_used", 0) >= condition_value
            case "achievements_unlocked":
                return stats.get("achievements_unlocked", 0) >= condition_value
            case "quests_completed":
                return stats.get("quests_completed", 0) >= condition_value
            case _:
                return False

    async def _compute_stats(
        self,
        db: AsyncSession,
        workspace_id: str,
        agent_id: str,
    ) -> dict:
        """Compute event-based statistics for quest condition evaluation."""
        # Events ingested
        events_ingested = await db.scalar(
            select(func.count(Event.id)).where(
                Event.workspace_id == workspace_id,
                Event.agent_id == agent_id,
            )
        ) or 0

        # Tasks completed
        tasks_completed = await db.scalar(
            select(func.count(Event.id)).where(
                Event.workspace_id == workspace_id,
                Event.agent_id == agent_id,
                Event.event_type == "task_completed",
            )
        ) or 0

        # XP earned this period (using agent total as proxy for session)
        agent = await db.scalar(
            select(Agent).where(Agent.id == agent_id)
        )
        xp_earned = agent.xp_total if agent else 0

        # Completed quests count
        quests_completed = await db.scalar(
            select(func.count(AgentQuestProgress.id)).where(
                AgentQuestProgress.agent_id == agent_id,
                AgentQuestProgress.completed == True,  # noqa: E712
            )
        ) or 0

        # Achievements unlocked
        from app.models.achievement import Achievement
        achievements_unlocked = await db.scalar(
            select(func.count(Achievement.id)).where(
                Achievement.workspace_id == workspace_id,
                Achievement.agent_id == agent_id,
            )
        ) or 0

        return {
            "events_ingested": events_ingested,
            "tasks_completed": tasks_completed,
            "xp_earned": xp_earned,
            "quests_completed": quests_completed,
            "achievements_unlocked": achievements_unlocked,
        }
