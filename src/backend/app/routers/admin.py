"""Admin router for DLQ inspection and task retry operations.

The dead letter queue is implemented as a Redis list named
``celery:dead_letter``.  Each entry is a JSON-encoded dict that Celery
writes when a task is rejected after exhausting all retries (because
``task_acks_late=True`` and ``task_reject_on_worker_lost=True`` are set).

These endpoints are intentionally NOT behind workspace-scoped auth — they
are operations-level endpoints that should be placed behind a network
policy or separate admin JWT in production.  For now they require a valid
JWT (get_workspace_id dependency omitted; standard Bearer token required
via the global auth middleware when one is added).
"""

from typing import List
import json

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.redis_client import get_redis as _get_redis
from app.core.celery_app import celery_app, QUEUE_DEAD_LETTER
from app.core.metrics import oav_celery_dlq_depth
from app.schemas.admin import DLQTask

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Redis key where Celery stores dead-lettered tasks
_DLQ_REDIS_KEY = f"celery:{QUEUE_DEAD_LETTER}"


async def get_redis() -> aioredis.Redis:
    """Dependency wrapper — can be overridden in tests."""
    return await _get_redis()


@router.get("/dlq", response_model=List[DLQTask])
async def list_dlq_tasks(
    redis: aioredis.Redis = Depends(get_redis),
) -> List[DLQTask]:
    """Return all tasks currently in the dead letter queue.

    Reads the Redis list backing the ``dead_letter`` Celery queue and
    updates the ``oav_celery_dlq_depth`` gauge.
    """
    raw_tasks = await redis.lrange(_DLQ_REDIS_KEY, 0, -1)
    tasks: List[DLQTask] = []
    for raw in raw_tasks:
        try:
            payload = json.loads(raw)
            # Celery AMQP-style message envelope: body is base64-encoded JSON
            # when using the json serialiser.  We support both the raw dict
            # format (used by kombu Redis transport) and a minimal flat format.
            headers = payload.get("headers", {})
            body = payload.get("body", {})
            if isinstance(body, str):
                import base64
                try:
                    body = json.loads(base64.b64decode(body))
                except Exception:
                    body = {}
            tasks.append(
                DLQTask(
                    task_id=headers.get("id") or payload.get("task_id", "unknown"),
                    task_name=headers.get("task") or payload.get("task_name", "unknown"),
                    args=body[0] if isinstance(body, list) and len(body) > 0 else [],
                    kwargs=body[1] if isinstance(body, list) and len(body) > 1 else {},
                    retries=headers.get("retries", 0),
                    error=payload.get("error"),
                    traceback=payload.get("traceback"),
                    timestamp=headers.get("timelimit") or payload.get("timestamp"),
                    queue=QUEUE_DEAD_LETTER,
                )
            )
        except Exception:
            # Skip malformed entries — they can be cleared manually
            continue

    oav_celery_dlq_depth.set(len(tasks))
    return tasks


@router.post(
    "/dlq/{task_id}/retry",
    status_code=status.HTTP_202_ACCEPTED,
)
async def retry_dlq_task(
    task_id: str,
    redis: aioredis.Redis = Depends(get_redis),
) -> dict:
    """Re-queue a specific task from the dead letter queue.

    Searches the DLQ Redis list for a task matching ``task_id``, removes
    it from the list, and re-publishes it to its original queue via
    ``celery_app.send_task``.

    Returns 404 if no matching task is found.
    """
    raw_tasks = await redis.lrange(_DLQ_REDIS_KEY, 0, -1)
    target_raw: str | None = None
    target_payload: dict | None = None

    for raw in raw_tasks:
        try:
            payload = json.loads(raw)
            headers = payload.get("headers", {})
            found_id = headers.get("id") or payload.get("task_id")
            if found_id == task_id:
                target_raw = raw
                target_payload = payload
                break
        except Exception:
            continue

    if target_raw is None or target_payload is None:
        raise HTTPException(status_code=404, detail="Task not found in DLQ")

    # Remove the task from the DLQ list (remove first occurrence only)
    await redis.lrem(_DLQ_REDIS_KEY, 1, target_raw)

    # Re-publish to the default queue using send_task so it goes through
    # normal Celery routing (task_routes apply).
    headers = target_payload.get("headers", {})
    body = target_payload.get("body", {})
    if isinstance(body, str):
        import base64
        try:
            body = json.loads(base64.b64decode(body))
        except Exception:
            body = {}

    task_name = headers.get("task") or target_payload.get("task_name", "unknown")
    args = body[0] if isinstance(body, list) and len(body) > 0 else []
    kwargs = body[1] if isinstance(body, list) and len(body) > 1 else {}

    celery_app.send_task(task_name, args=args, kwargs=kwargs)

    # Update the DLQ depth gauge
    remaining = await redis.llen(_DLQ_REDIS_KEY)
    oav_celery_dlq_depth.set(remaining)

    return {"status": "requeued", "task_id": task_id, "task_name": task_name}
