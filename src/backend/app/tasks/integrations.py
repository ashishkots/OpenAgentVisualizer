"""Celery tasks for periodic cross-product integration data synchronization.

Each sync task refreshes the Redis cache for its respective product so that
API endpoints serve fresh data on the next request without a cold-cache latency hit.
"""

import asyncio
import logging
import time

from app.core.celery_app import celery_app
from app.core.metrics import oav_celery_task_duration_seconds, oav_celery_tasks_total

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine synchronously from a Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _task_wrapper(task_name: str, workspace_id: str, coro_factory):
    """Execute an async integration sync with metrics instrumentation."""
    start = time.monotonic()
    try:
        result = _run_async(coro_factory())
        elapsed = time.monotonic() - start
        oav_celery_tasks_total.labels(task_name=task_name, status="success").inc()
        oav_celery_task_duration_seconds.labels(task_name=task_name).observe(elapsed)
        logger.info("Task %s for workspace %s completed in %.2fs", task_name, workspace_id, elapsed)
        return result
    except Exception as exc:
        elapsed = time.monotonic() - start
        oav_celery_tasks_total.labels(task_name=task_name, status="failure").inc()
        oav_celery_task_duration_seconds.labels(task_name=task_name).observe(elapsed)
        logger.error("Task %s for workspace %s failed: %s", task_name, workspace_id, exc)
        raise


@celery_app.task(name="app.tasks.sync_opentrace", bind=True, max_retries=2)
def sync_opentrace(self, workspace_id: str) -> None:
    """Refresh the OpenTrace trace cache for active agents in a workspace.

    Fetches recent traces for each active agent and warm-loads the Redis cache.
    On failure, retries up to 2 times with exponential backoff.
    """
    async def _sync():
        from sqlalchemy import select

        from app.core.database import AsyncSessionLocal
        from app.models.agent import Agent
        from app.services.opentrace_service import opentrace_service

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Agent)
                .where(
                    Agent.workspace_id == workspace_id,
                    Agent.status != "idle",
                )
                .limit(20)
            )
            agents = result.scalars().all()

        for agent in agents:
            try:
                await opentrace_service.get_traces(workspace_id, agent.id, db=None)
            except Exception as exc:
                logger.warning("sync_opentrace: failed for agent %s: %s", agent.id, exc)

    try:
        _task_wrapper("sync_opentrace", workspace_id, lambda: _sync())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.sync_openmesh", bind=True, max_retries=2)
def sync_openmesh(self, workspace_id: str) -> None:
    """Refresh the OpenMesh topology cache for a workspace."""
    async def _sync():
        from app.services.openmesh_service import openmesh_service
        await openmesh_service.get_topology(workspace_id, db=None)
        await openmesh_service.get_stats(workspace_id, period="1h", db=None)

    try:
        _task_wrapper("sync_openmesh", workspace_id, lambda: _sync())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.sync_openmind", bind=True, max_retries=2)
def sync_openmind(self, workspace_id: str) -> None:
    """Refresh the OpenMind knowledge graph cache for a workspace."""
    async def _sync():
        from app.services.openmind_service import openmind_service
        await openmind_service.get_graph(workspace_id, limit=200, offset=0, db=None)

    try:
        _task_wrapper("sync_openmind", workspace_id, lambda: _sync())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.sync_openshield", bind=True, max_retries=2)
def sync_openshield(self, workspace_id: str) -> None:
    """Refresh the OpenShield security posture cache for a workspace."""
    async def _sync():
        from app.services.openshield_service import openshield_service
        await openshield_service.get_posture(workspace_id, db=None)

    try:
        _task_wrapper("sync_openshield", workspace_id, lambda: _sync())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.sync_integrations_all")
def sync_integrations_all() -> None:
    """Trigger integration sync for all active workspaces.

    This is the beat-scheduled entry point that discovers workspaces and
    dispatches per-workspace sync subtasks.
    """
    async def _get_workspaces():
        from sqlalchemy import select

        from app.core.database import AsyncSessionLocal
        from app.models.user import Workspace

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Workspace.id))
            return [row[0] for row in result.all()]

    workspace_ids = _run_async(_get_workspaces())
    for wid in workspace_ids:
        sync_opentrace.delay(wid)
        sync_openmesh.delay(wid)
        sync_openmind.delay(wid)
        sync_openshield.delay(wid)

    logger.info("sync_integrations_all: dispatched tasks for %d workspaces", len(workspace_ids))


@celery_app.task(name="app.tasks.apply_xp_decay")
def apply_xp_decay() -> None:
    """Daily task: apply 1% XP decay to agents that have been idle for > 7 days."""
    async def _decay():
        from datetime import datetime, timedelta, timezone

        from sqlalchemy import select

        from app.core.database import AsyncSessionLocal
        from app.models.agent import Agent

        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Agent).where(
                    Agent.status == "idle",
                    Agent.updated_at <= cutoff,
                    Agent.xp_total > 0,
                )
            )
            agents = result.scalars().all()

            for agent in agents:
                decay_amount = max(1, int(agent.xp_total * 0.01))
                agent.xp_total = max(0, agent.xp_total - decay_amount)

            if agents:
                await db.commit()
                logger.info("apply_xp_decay: applied decay to %d agents", len(agents))

    start = time.monotonic()
    try:
        _run_async(_decay())
        oav_celery_tasks_total.labels(task_name="apply_xp_decay", status="success").inc()
        oav_celery_task_duration_seconds.labels(task_name="apply_xp_decay").observe(
            time.monotonic() - start
        )
    except Exception as exc:
        oav_celery_tasks_total.labels(task_name="apply_xp_decay", status="failure").inc()
        logger.error("apply_xp_decay failed: %s", exc)
        raise
