from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "oav",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks",
        "app.tasks.graph",
        "app.tasks.achievements",
        "app.tasks.integrations",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        # Refresh the agent leaderboard materialized view every 5 minutes
        "refresh-leaderboard": {
            "task": "app.tasks.refresh_leaderboard",
            "schedule": 300.0,  # seconds
        },
        # Sync integration caches for all workspaces every 5 minutes
        "sync-integrations": {
            "task": "app.tasks.sync_integrations_all",
            "schedule": 300.0,  # seconds
        },
        # Apply 1% XP decay to idle agents daily at 00:00 UTC
        "apply-xp-decay": {
            "task": "app.tasks.apply_xp_decay",
            "schedule": 86400.0,  # seconds (24 hours; use crontab for exact time in prod)
        },
    },
)

# Register Celery signal handlers to track task metrics
from celery.signals import task_postrun, task_prerun  # noqa: E402

_task_start_times: dict = {}


@task_prerun.connect
def on_task_prerun(task_id: str, task, **kwargs) -> None:  # type: ignore[no-untyped-def]
    import time
    _task_start_times[task_id] = time.monotonic()


@task_postrun.connect
def on_task_postrun(task_id: str, task, retval, state: str, **kwargs) -> None:  # type: ignore[no-untyped-def]
    import time
    from app.core.metrics import oav_celery_task_duration_seconds, oav_celery_tasks_total

    task_name = task.name.split(".")[-1] if task and task.name else "unknown"
    status = "success" if state == "SUCCESS" else "failure"
    oav_celery_tasks_total.labels(task_name=task_name, status=status).inc()

    start = _task_start_times.pop(task_id, None)
    if start is not None:
        elapsed = time.monotonic() - start
        oav_celery_task_duration_seconds.labels(task_name=task_name).observe(elapsed)
