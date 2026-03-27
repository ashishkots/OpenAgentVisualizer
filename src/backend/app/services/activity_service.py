"""Helper for recording workspace activity feed entries.

Call ``log_activity`` from route handlers that perform significant mutations:
agent creation/deletion, configuration changes, member join/leave, exports,
and invite events.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityFeed


async def log_activity(
    db: AsyncSession,
    workspace_id: str,
    user_id: Optional[str],
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None,
) -> None:
    """Append a single activity entry to the feed.

    This is fire-and-forget from the caller's perspective — errors here
    should not abort the primary operation, so callers may catch exceptions
    if needed.
    """
    entry = ActivityFeed(
        id=str(uuid.uuid4()),
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        extra_data=extra_data,
    )
    db.add(entry)
    await db.commit()
