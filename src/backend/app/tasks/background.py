from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.noop")
def noop():
    """Placeholder background task."""
    return "ok"
