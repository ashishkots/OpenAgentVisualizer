from fastapi import APIRouter, Depends, BackgroundTasks
from app.core.dependencies import get_workspace_id
from app.services.event_pipeline import normalise_event, EventPipeline

# Import both for type hinting and actual dependency
import redis.asyncio as aioredis
from app.core.redis_client import get_redis as _get_redis_connection

router = APIRouter(prefix="/api/events", tags=["events"])


async def get_redis() -> aioredis.Redis:
    """Dependency wrapper for Redis - can be mocked in tests."""
    return await _get_redis_connection()


@router.post("", status_code=202)
async def ingest_event(
    payload: dict,
    background_tasks: BackgroundTasks,
    workspace_id: str = Depends(get_workspace_id),
    redis: aioredis.Redis = Depends(get_redis),
):
    event = normalise_event(payload, workspace_id=workspace_id)
    pipeline = EventPipeline(redis)
    background_tasks.add_task(pipeline.publish, event)
    return {"status": "accepted"}
