"""Team endpoints — create teams, manage members, get stats.

Constraints:
  - Max 10 members per team
  - Max 5 teams per workspace
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, get_current_user
from app.models.team import Team, TeamMember
from app.models.agent import Agent, Task
from app.models.user import User
from app.schemas.team import TeamCreate, TeamRead, TeamMemberRead, TeamStats, AddMemberRequest
from app.services.gamification_service import LEVEL_THRESHOLDS, LEVEL_NAMES

MAX_MEMBERS_PER_TEAM = 10
MAX_TEAMS_PER_WORKSPACE = 5

router = APIRouter(prefix="/api/teams", tags=["teams"])


def _derive_team_level(total_xp: int) -> tuple[int, str]:
    """Return (level, level_name) from team's aggregate XP."""
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_xp >= threshold:
            level = i + 1
    name = LEVEL_NAMES[max(0, min(level - 1, len(LEVEL_NAMES) - 1))]
    return level, name


@router.get("", response_model=List[TeamRead])
async def list_teams(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[TeamRead]:
    """List all teams in the workspace."""
    result = await db.execute(
        select(Team)
        .where(Team.workspace_id == workspace_id)
        .order_by(Team.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=TeamRead, status_code=201)
async def create_team(
    body: TeamCreate,
    workspace_id: str = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamRead:
    """Create a new team. Maximum 5 teams per workspace."""
    team_count: int = await db.scalar(
        select(func.count(Team.id)).where(Team.workspace_id == workspace_id)
    ) or 0
    if team_count >= MAX_TEAMS_PER_WORKSPACE:
        raise HTTPException(
            status_code=400,
            detail=f"Workspace already has the maximum of {MAX_TEAMS_PER_WORKSPACE} teams",
        )
    team = Team(
        workspace_id=workspace_id,
        name=body.name,
        description=body.description,
        icon=body.icon,
        created_by=current_user.id,
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


@router.get("/{team_id}", response_model=TeamRead)
async def get_team(
    team_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TeamRead:
    """Get team detail with members."""
    team = await db.scalar(
        select(Team).where(
            Team.id == team_id,
            Team.workspace_id == workspace_id,
        )
    )
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.post("/{team_id}/members", response_model=TeamMemberRead, status_code=201)
async def add_team_member(
    team_id: str,
    body: AddMemberRequest,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TeamMemberRead:
    """Add an agent to a team. Maximum 10 members per team."""
    team = await db.scalar(
        select(Team).where(
            Team.id == team_id,
            Team.workspace_id == workspace_id,
        )
    )
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Verify agent belongs to this workspace
    agent = await db.scalar(
        select(Agent).where(
            Agent.id == body.agent_id,
            Agent.workspace_id == workspace_id,
        )
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found in this workspace")

    # Check membership limit
    member_count: int = await db.scalar(
        select(func.count(TeamMember.id)).where(TeamMember.team_id == team_id)
    ) or 0
    if member_count >= MAX_MEMBERS_PER_TEAM:
        raise HTTPException(
            status_code=400,
            detail=f"Team already has the maximum of {MAX_MEMBERS_PER_TEAM} members",
        )

    # Prevent duplicate membership
    existing = await db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.agent_id == body.agent_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Agent is already a member of this team")

    member = TeamMember(
        team_id=team_id,
        agent_id=body.agent_id,
        role=body.role,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/{team_id}/members/{agent_id}", status_code=204)
async def remove_team_member(
    team_id: str,
    agent_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove an agent from a team."""
    team = await db.scalar(
        select(Team).where(
            Team.id == team_id,
            Team.workspace_id == workspace_id,
        )
    )
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    member = await db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.agent_id == agent_id,
        )
    )
    if not member:
        raise HTTPException(status_code=404, detail="Agent is not a member of this team")

    await db.delete(member)
    await db.commit()


@router.get("/{team_id}/stats", response_model=TeamStats)
async def get_team_stats(
    team_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> TeamStats:
    """Return aggregated team stats: total XP, total tasks, derived level."""
    team = await db.scalar(
        select(Team).where(
            Team.id == team_id,
            Team.workspace_id == workspace_id,
        )
    )
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Get all member agent IDs
    result = await db.execute(
        select(TeamMember.agent_id).where(TeamMember.team_id == team_id)
    )
    agent_ids = [row[0] for row in result.all()]

    total_xp = 0
    total_tasks = 0
    member_count = len(agent_ids)

    if agent_ids:
        total_xp = await db.scalar(
            select(func.coalesce(func.sum(Agent.xp_total), 0)).where(
                Agent.id.in_(agent_ids)
            )
        ) or 0

        total_tasks = await db.scalar(
            select(func.count(Task.id)).where(
                Task.agent_id.in_(agent_ids),
                Task.status == "completed",
            )
        ) or 0

    level, level_name = _derive_team_level(total_xp)

    return TeamStats(
        team_id=team_id,
        team_name=team.name,
        member_count=member_count,
        total_xp=total_xp,
        total_tasks=total_tasks,
        level=level,
        level_name=level_name,
    )
