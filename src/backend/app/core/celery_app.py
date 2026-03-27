from celery import Celery
from kombu import Queue
from app.core.config import settings

# ---------------------------------------------------------------------------
# Priority queues
# ---------------------------------------------------------------------------
# Four queues are defined with explicit priorities so the worker can
# preference time-sensitive tasks (achievements) over bulk work
# (integration syncs) without starvation.
#
#   critical    — achievement unlock notifications (user-facing, low latency)
#   default     — graph computation and leaderboard refreshes
#   bulk        — integration syncs and XP decay (background, can lag)
#   dead_letter — tasks that exhausted all retries (manual inspection/retry)

QUEUE_CRITICAL = "critical"
QUEUE_DEFAULT = "default"
QUEUE_BULK = "bulk"
QUEUE_DEAD_LETTER = "dead_letter"

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
    # ---- Reliability settings ----
    # Acknowledge tasks only after the handler returns, so a worker crash
    # before completion causes the broker to redeliver the task.
    task_acks_late=True,
    # Reject (rather than ack) a task when the worker process is killed
    # unexpectedly, ensuring it is requeued by the broker.
    task_reject_on_worker_lost=True,
    # ---- Priority queues ----
    task_queues=(
        Queue(QUEUE_CRITICAL),
        Queue(QUEUE_DEFAULT),
        Queue(QUEUE_BULK),
        Queue(QUEUE_DEAD_LETTER),
    ),
    task_default_queue=QUEUE_DEFAULT,
    # Route specific task modules to appropriate queues
    task_routes={
        "app.tasks.achievements.*": {"queue": QUEUE_CRITICAL},
        "app.tasks.graph.*": {"queue": QUEUE_DEFAULT},
        "app.tasks.integrations.*": {"queue": QUEUE_BULK},
        # Beat tasks routed by explicit task name
        "app.tasks.refresh_leaderboard": {"queue": QUEUE_DEFAULT},
        "app.tasks.sync_integrations_all": {"queue": QUEUE_BULK},
        "app.tasks.apply_xp_decay": {"queue": QUEUE_BULK},
    },
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
