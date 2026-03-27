"""Pydantic schemas for admin endpoints (DLQ management, etc.)."""

from typing import Any, Dict, Optional
from pydantic import BaseModel


class DLQTask(BaseModel):
    """Represents a single task sitting in the Celery dead letter queue."""

    task_id: str
    task_name: str
    args: list
    kwargs: Dict[str, Any]
    retries: int
    error: Optional[str] = None
    traceback: Optional[str] = None
    timestamp: Optional[str] = None
    queue: str = "dead_letter"
