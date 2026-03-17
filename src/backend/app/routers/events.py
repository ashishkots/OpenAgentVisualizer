from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, WorkspaceMember
from app.services.event_pipeline import normalise_event, EventPipeline

# Import both for type hinting and actual dependency
import redis.asyncio as aioredis
from app.core.redis_client import get_redis as _get_redis_connection

router = APIRouter(prefix="/api/events", tags=["events"])


async def get_redis() -> aioredis.Redis:
    """Dependency wrapper for Redis - can be mocked in tests."""
    return await _get_redis_connection()


async def _get_workspace_id(user: User, db: AsyncSession) -> str:
    member = await db.scalar(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .order_by(asc(WorkspaceMember.id))
    )
    return member.workspace_id if member else "unknown"


@router.post("", status_code=202)
async def ingest_event(
    payload: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    workspace_id = await _get_workspace_id(current_user, db)
    event = normalise_event(payload, workspace_id=workspace_id)
    pipeline = EventPipeline(redis)
    background_tasks.add_task(pipeline.publish, event)
    return {"status": "accepted"}
