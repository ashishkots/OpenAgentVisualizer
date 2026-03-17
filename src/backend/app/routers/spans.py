from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.event import Span

router = APIRouter(prefix="/api/spans", tags=["spans"])


@router.get("", response_model=List[dict])
async def list_spans(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List spans for the authenticated user's workspace."""
    result = await db.execute(
        select(Span)
        .where(Span.workspace_id == workspace_id)
        .order_by(Span.start_time.desc())
        .limit(limit)
        .offset(offset)
    )
    spans = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "trace_id": s.trace_id,
            "span_id": s.span_id,
            "name": s.name,
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "status": s.status,
            "workspace_id": str(s.workspace_id),
        }
        for s in spans
    ]
