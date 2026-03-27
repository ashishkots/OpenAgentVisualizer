# Sprint 5: User Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make OpenAgentVisualizer ready for general-purpose users with onboarding, notifications, data export, collaboration, and mobile polish.

**Architecture:** 5 independent subsystems implemented in parallel groups. Backend tasks create new models/routers/services following existing clean architecture. Frontend tasks add new pages/components/stores following existing Zustand + React Query patterns. Single Alembic migration for all new tables.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Celery, React 18, Zustand, React Query, Tailwind CSS, Lucide React, GSAP, Vitest

---

## File Structure

### New Backend Files

| File | Responsibility |
|------|---------------|
| `src/backend/app/models/notification.py` | Notification SQLAlchemy model |
| `src/backend/app/models/invite.py` | WorkspaceInvite model |
| `src/backend/app/models/activity.py` | ActivityFeed model |
| `src/backend/app/schemas/notification.py` | Notification Pydantic schemas |
| `src/backend/app/schemas/invite.py` | Invite Pydantic schemas |
| `src/backend/app/schemas/activity.py` | Activity Pydantic schemas |
| `src/backend/app/schemas/export.py` | Export query param schemas |
| `src/backend/app/routers/notifications.py` | Notification CRUD endpoints |
| `src/backend/app/routers/export.py` | Data export endpoints (CSV/JSON streaming) |
| `src/backend/app/routers/invites.py` | Workspace invite endpoints |
| `src/backend/app/routers/activity.py` | Activity feed endpoint |
| `src/backend/app/services/notification_service.py` | Notification creation + WebSocket push |
| `src/backend/app/services/activity_service.py` | Activity logging helper |
| `src/backend/app/tasks/notifications.py` | Celery tasks for notification triggers |
| `src/backend/app/tasks/activity.py` | Activity pruning task |
| `src/backend/alembic/versions/006_notifications_and_collaboration.py` | Migration for 3 new tables + schema changes |
| `src/backend/tests/test_notifications.py` | Notification endpoint tests |
| `src/backend/tests/test_export.py` | Export endpoint tests |
| `src/backend/tests/test_invites.py` | Invite endpoint tests |
| `src/backend/tests/test_activity.py` | Activity feed tests |

### New Frontend Files

| File | Responsibility |
|------|---------------|
| `src/frontend/src/components/onboarding/OnboardingWizard.tsx` | 3-step wizard |
| `src/frontend/src/components/onboarding/TourProvider.tsx` | Guided tour context + tooltips |
| `src/frontend/src/components/ui/EmptyState.tsx` | Reusable empty state component |
| `src/frontend/src/components/notifications/NotificationBell.tsx` | Header bell icon + badge |
| `src/frontend/src/components/notifications/NotificationDropdown.tsx` | Dropdown panel |
| `src/frontend/src/components/notifications/NotificationItem.tsx` | Single notification row |
| `src/frontend/src/components/export/ExportButton.tsx` | Export trigger button |
| `src/frontend/src/components/export/ExportDialog.tsx` | Format + date range dialog |
| `src/frontend/src/components/collaboration/InviteModal.tsx` | Invite member modal |
| `src/frontend/src/components/collaboration/MemberList.tsx` | Workspace members list |
| `src/frontend/src/components/collaboration/ActivityFeed.tsx` | Activity sidebar panel |
| `src/frontend/src/components/collaboration/ActivityItem.tsx` | Single activity row |
| `src/frontend/src/components/mobile/BottomNav.tsx` | Mobile bottom navigation |
| `src/frontend/src/components/mobile/BottomSheet.tsx` | Mobile bottom sheet |
| `src/frontend/src/pages/NotificationsPage.tsx` | Full notifications page |
| `src/frontend/src/pages/InviteAcceptPage.tsx` | Invite acceptance page |
| `src/frontend/src/stores/notificationStore.ts` | Notification state |
| `src/frontend/src/stores/collaborationStore.ts` | Invites + activity state |
| `src/frontend/src/hooks/useNotifications.ts` | React Query hooks for notifications |
| `src/frontend/src/hooks/useExport.ts` | Export download hook |
| `src/frontend/src/hooks/useCollaboration.ts` | React Query hooks for invites/activity |
| `src/frontend/src/types/notification.ts` | Notification types |
| `src/frontend/src/types/collaboration.ts` | Invite + activity types |
| `src/frontend/src/types/export.ts` | Export types |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |

### Modified Files

| File | Changes |
|------|---------|
| `src/backend/app/models/__init__.py` | Add new models |
| `src/backend/app/main.py` | Register new routers |
| `src/backend/app/core/celery_app.py` | Add notification + activity tasks to beat |
| `src/frontend/src/components/layout/AppShell.tsx` | Add NotificationBell, BottomNav, activity panel |
| `src/frontend/src/routes.tsx` | Add NotificationsPage, InviteAcceptPage routes |
| `src/frontend/src/pages/DashboardPage.tsx` | Add onboarding wizard trigger, activity sidebar |
| `src/frontend/src/pages/AgentDetailPage.tsx` | Add empty state |
| `src/frontend/src/pages/AlertsPage.tsx` | Add empty state + export button |
| `src/frontend/src/pages/SettingsPage.tsx` | Add Members tab |
| `src/frontend/src/index.css` | Bottom sheet animations |
| `src/frontend/index.html` | PWA manifest link |
| `src/frontend/src/main.tsx` | Service worker registration |

---

## Group A: Backend Foundation (Tasks 1-4)

### Task 1: Database Migration — New Tables

**Files:**
- Create: `src/backend/alembic/versions/006_notifications_and_collaboration.py`
- Create: `src/backend/app/models/notification.py`
- Create: `src/backend/app/models/invite.py`
- Create: `src/backend/app/models/activity.py`
- Modify: `src/backend/app/models/__init__.py`

- [ ] **Step 1: Create Notification model**

```python
# src/backend/app/models/notification.py
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from uuid7 import uuid7
from app.models.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # achievement, alert, system, collaboration
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    read = Column(Boolean, default=False, nullable=False)
    link = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
```

- [ ] **Step 2: Create WorkspaceInvite model**

```python
# src/backend/app/models/invite.py
import secrets
from datetime import datetime, timedelta
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from uuid7 import uuid7
from app.models.base import Base


def _default_expires():
    return datetime.utcnow() + timedelta(days=7)


def _generate_token():
    return secrets.token_urlsafe(48)


class WorkspaceInvite(Base):
    __tablename__ = "workspace_invites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="member")
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    token = Column(String(64), nullable=False, unique=True, default=_generate_token)
    expires_at = Column(DateTime(timezone=True), default=_default_expires, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
```

- [ ] **Step 3: Create ActivityFeed model**

```python
# src/backend/app/models/activity.py
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from uuid7 import uuid7
from app.models.base import Base


class ActivityFeed(Base):
    __tablename__ = "activity_feed"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(255), nullable=True)
    extra_data = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
```

- [ ] **Step 4: Register models in __init__.py**

Add to `src/backend/app/models/__init__.py`:
```python
from app.models.notification import Notification
from app.models.invite import WorkspaceInvite
from app.models.activity import ActivityFeed
```

- [ ] **Step 5: Create Alembic migration**

```python
# src/backend/alembic/versions/006_notifications_and_collaboration.py
"""Add notifications, invites, activity feed tables.

Revision ID: 006
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("read", sa.Boolean, default=False, nullable=False),
        sa.Column("link", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_read", "notifications", ["user_id", "read"])

    op.create_table(
        "workspace_invites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="member"),
        sa.Column("invited_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("token", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "activity_feed",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", sa.String(255), nullable=True),
        sa.Column("extra_data", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_activity_feed_workspace_created", "activity_feed", ["workspace_id", "created_at"])

    # Add onboarding_completed to workspaces
    op.add_column("workspaces", sa.Column("onboarding_completed", sa.Boolean, server_default="false"))

    # Add role to workspace_members (if not exists)
    try:
        op.add_column("workspace_members", sa.Column("role", sa.String(20), server_default="admin"))
    except Exception:
        pass


def downgrade():
    op.drop_table("activity_feed")
    op.drop_table("workspace_invites")
    op.drop_table("notifications")
    op.drop_column("workspaces", "onboarding_completed")
    try:
        op.drop_column("workspace_members", "role")
    except Exception:
        pass
```

- [ ] **Step 6: Commit**

```bash
git add src/backend/app/models/notification.py src/backend/app/models/invite.py src/backend/app/models/activity.py src/backend/app/models/__init__.py src/backend/alembic/versions/006_notifications_and_collaboration.py
git commit -m "feat: add notification, invite, activity models + migration (006)"
```

---

### Task 2: Notification Backend (Endpoints + Service + WebSocket)

**Files:**
- Create: `src/backend/app/schemas/notification.py`
- Create: `src/backend/app/routers/notifications.py`
- Create: `src/backend/app/services/notification_service.py`
- Create: `src/backend/app/tasks/notifications.py`
- Create: `src/backend/tests/test_notifications.py`
- Modify: `src/backend/app/main.py`
- Modify: `src/backend/app/core/celery_app.py`

- [ ] **Step 1: Create notification schemas**

```python
# src/backend/app/schemas/notification.py
from datetime import datetime
from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: str
    type: str
    title: str
    body: str | None = None
    read: bool
    link: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    count: int
```

- [ ] **Step 2: Create notification service**

```python
# src/backend/app/services/notification_service.py
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from uuid7 import uuid7


async def create_notification(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    type: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> Notification:
    notif = Notification(
        id=uuid7(),
        workspace_id=workspace_id,
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        link=link,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def get_notifications(
    db: AsyncSession, user_id: str, limit: int = 20, offset: int = 0, unread_only: bool = False
) -> list[Notification]:
    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.read == False)
    query = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


async def get_unread_count(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(
        select(func.count()).where(Notification.user_id == user_id, Notification.read == False)
    )
    return result.scalar() or 0


async def mark_read(db: AsyncSession, notification_id: str, user_id: str) -> bool:
    result = await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(read=True)
    )
    await db.commit()
    return result.rowcount > 0


async def mark_all_read(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)
        .values(read=True)
    )
    await db.commit()
    return result.rowcount
```

- [ ] **Step 3: Create notification router**

```python
# src/backend/app/routers/notifications.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.schemas.notification import NotificationRead, UnreadCountResponse
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    unread: bool = Query(default=False),
):
    return await notification_service.get_notifications(db, user_id, limit, offset, unread)


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    count = await notification_service.get_unread_count(db, user_id)
    return UnreadCountResponse(count=count)


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    success = await notification_service.mark_read(db, notification_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_notifications_read(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    count = await notification_service.mark_all_read(db, user_id)
    return {"marked_read": count}
```

- [ ] **Step 4: Create notification Celery tasks**

```python
# src/backend/app/tasks/notifications.py
from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.notifications.send_notification", queue="critical")
def send_notification(workspace_id: str, user_id: str, type: str, title: str, body: str = None, link: str = None):
    """Create notification and push via WebSocket."""
    import asyncio
    from app.core.database import async_session_factory
    from app.services.notification_service import create_notification

    async def _create():
        async with async_session_factory() as db:
            await create_notification(db, workspace_id, user_id, type, title, body, link)

    asyncio.get_event_loop().run_until_complete(_create())
```

- [ ] **Step 5: Register router and tasks in main.py and celery_app.py**

Add to `src/backend/app/main.py`:
```python
from app.routers.notifications import router as notifications_router
app.include_router(notifications_router)
```

Add `"app.tasks.notifications"` to celery_app `include` list.

- [ ] **Step 6: Write tests**

```python
# src/backend/tests/test_notifications.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_list_notifications_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "notif@test.com", "password": "test1234",
            "full_name": "Notif Tester", "workspace_name": "notif-ws",
        })
        login = await client.post("/api/auth/login", json={
            "email": "notif@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        resp = await client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_unread_count_zero():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "notif2@test.com", "password": "test1234",
            "full_name": "Notif Tester 2", "workspace_name": "notif-ws-2",
        })
        login = await client.post("/api/auth/login", json={
            "email": "notif2@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        resp = await client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["count"] == 0


@pytest.mark.asyncio
async def test_mark_all_read():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "notif3@test.com", "password": "test1234",
            "full_name": "Notif Tester 3", "workspace_name": "notif-ws-3",
        })
        login = await client.post("/api/auth/login", json={
            "email": "notif3@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        resp = await client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["marked_read"] == 0
```

- [ ] **Step 7: Commit**

```bash
git add src/backend/app/schemas/notification.py src/backend/app/routers/notifications.py src/backend/app/services/notification_service.py src/backend/app/tasks/notifications.py src/backend/tests/test_notifications.py src/backend/app/main.py src/backend/app/core/celery_app.py
git commit -m "feat: add notification endpoints, service, and Celery tasks"
```

---

### Task 3: Data Export Backend

**Files:**
- Create: `src/backend/app/schemas/export.py`
- Create: `src/backend/app/routers/export.py`
- Create: `src/backend/tests/test_export.py`
- Modify: `src/backend/app/main.py`

- [ ] **Step 1: Create export schemas**

```python
# src/backend/app/schemas/export.py
from enum import Enum


class ExportFormat(str, Enum):
    csv = "csv"
    json = "json"
```

- [ ] **Step 2: Create export router with streaming responses**

```python
# src/backend/app/routers/export.py
import csv
import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import orjson
from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.agent import Agent
from app.models.event import Event
from app.schemas.export import ExportFormat

router = APIRouter(prefix="/api/export", tags=["export"])

MAX_EXPORT_DAYS = 30


def _csv_stream(rows, columns):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    yield buf.getvalue()
    buf.seek(0)
    buf.truncate(0)
    for row in rows:
        writer.writerow(row)
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)


@router.get("/agents")
async def export_agents(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
    format: ExportFormat = Query(default=ExportFormat.csv),
):
    result = await db.execute(
        select(Agent).where(Agent.workspace_id == workspace_id).order_by(Agent.created_at.desc())
    )
    agents = result.scalars().all()

    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    if format == ExportFormat.csv:
        columns = ["id", "name", "type", "framework", "status", "level", "xp", "created_at"]
        rows = [[str(a.id), a.name, a.type, a.framework, a.status, a.level, a.xp, str(a.created_at)] for a in agents]
        return StreamingResponse(
            _csv_stream(rows, columns),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="agents-{ts}.csv"'},
        )
    else:
        data = [{"id": str(a.id), "name": a.name, "type": a.type, "framework": a.framework,
                 "status": a.status, "level": a.level, "xp": a.xp, "created_at": str(a.created_at)} for a in agents]
        return StreamingResponse(
            iter([orjson.dumps(data)]),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="agents-{ts}.json"'},
        )


@router.get("/events")
async def export_events(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
    format: ExportFormat = Query(default=ExportFormat.csv),
    start: datetime = Query(...),
    end: datetime = Query(...),
):
    if (end - start).days > MAX_EXPORT_DAYS:
        raise HTTPException(status_code=400, detail=f"Max export range is {MAX_EXPORT_DAYS} days")

    result = await db.execute(
        select(Event)
        .where(Event.workspace_id == workspace_id, Event.timestamp >= start, Event.timestamp <= end)
        .order_by(Event.timestamp.desc())
        .limit(100000)
    )
    events = result.scalars().all()

    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    if format == ExportFormat.csv:
        columns = ["id", "agent_id", "event_type", "timestamp", "extra_data"]
        rows = [[str(e.id), str(e.agent_id), e.event_type, str(e.timestamp),
                 orjson.dumps(e.extra_data).decode() if e.extra_data else ""] for e in events]
        return StreamingResponse(
            _csv_stream(rows, columns),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="events-{ts}.csv"'},
        )
    else:
        data = [{"id": str(e.id), "agent_id": str(e.agent_id), "event_type": e.event_type,
                 "timestamp": str(e.timestamp), "extra_data": e.extra_data} for e in events]
        return StreamingResponse(
            iter([orjson.dumps(data)]),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="events-{ts}.json"'},
        )
```

- [ ] **Step 3: Register in main.py**

```python
from app.routers.export import router as export_router
app.include_router(export_router)
```

- [ ] **Step 4: Write tests**

```python
# src/backend/tests/test_export.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_export_agents_csv():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "export@test.com", "password": "test1234",
            "full_name": "Export Tester", "workspace_name": "export-ws",
        })
        login = await client.post("/api/auth/login", json={
            "email": "export@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        resp = await client.get("/api/export/agents?format=csv", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "id,name" in resp.text


@pytest.mark.asyncio
async def test_export_agents_json():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "export2@test.com", "password": "test1234",
            "full_name": "Export Tester 2", "workspace_name": "export-ws-2",
        })
        login = await client.post("/api/auth/login", json={
            "email": "export2@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        resp = await client.get("/api/export/agents?format=json", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert "application/json" in resp.headers["content-type"]


@pytest.mark.asyncio
async def test_export_events_exceeds_max_range():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "export3@test.com", "password": "test1234",
            "full_name": "Export Tester 3", "workspace_name": "export-ws-3",
        })
        login = await client.post("/api/auth/login", json={
            "email": "export3@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        resp = await client.get(
            "/api/export/events?format=csv&start=2025-01-01T00:00:00Z&end=2025-06-01T00:00:00Z",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 400
```

- [ ] **Step 5: Commit**

```bash
git add src/backend/app/schemas/export.py src/backend/app/routers/export.py src/backend/tests/test_export.py src/backend/app/main.py
git commit -m "feat: add data export endpoints (CSV/JSON streaming)"
```

---

### Task 4: Collaboration Backend (Invites + Activity)

**Files:**
- Create: `src/backend/app/schemas/invite.py`
- Create: `src/backend/app/schemas/activity.py`
- Create: `src/backend/app/routers/invites.py`
- Create: `src/backend/app/routers/activity.py`
- Create: `src/backend/app/services/activity_service.py`
- Create: `src/backend/app/tasks/activity.py`
- Create: `src/backend/tests/test_invites.py`
- Create: `src/backend/tests/test_activity.py`
- Modify: `src/backend/app/main.py`
- Modify: `src/backend/app/core/celery_app.py`

- [ ] **Step 1: Create invite and activity schemas**

```python
# src/backend/app/schemas/invite.py
from datetime import datetime
from pydantic import BaseModel, EmailStr


class InviteCreate(BaseModel):
    email: EmailStr
    role: str = "member"


class InviteRead(BaseModel):
    id: str
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class InviteAcceptResponse(BaseModel):
    workspace_id: str
    role: str
```

```python
# src/backend/app/schemas/activity.py
from datetime import datetime
from pydantic import BaseModel


class ActivityRead(BaseModel):
    id: str
    user_id: str | None = None
    action: str
    target_type: str | None = None
    target_id: str | None = None
    extra_data: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True
```

- [ ] **Step 2: Create activity service**

```python
# src/backend/app/services/activity_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity import ActivityFeed
from uuid7 import uuid7


async def log_activity(
    db: AsyncSession,
    workspace_id: str,
    user_id: str | None,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    extra_data: dict | None = None,
) -> None:
    entry = ActivityFeed(
        id=uuid7(),
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        extra_data=extra_data,
    )
    db.add(entry)
    await db.commit()
```

- [ ] **Step 3: Create invite router**

```python
# src/backend/app/routers/invites.py
import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_workspace_id, get_current_user_id
from app.models.invite import WorkspaceInvite
from app.schemas.invite import InviteCreate, InviteRead, InviteAcceptResponse
from app.services.activity_service import log_activity

router = APIRouter(prefix="/api/workspaces", tags=["collaboration"])


@router.post("/invite", response_model=InviteRead, status_code=201)
async def create_invite(
    body: InviteCreate,
    workspace_id: str = Depends(get_workspace_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    invite = WorkspaceInvite(
        workspace_id=workspace_id,
        email=body.email,
        role=body.role,
        invited_by=user_id,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    await log_activity(db, workspace_id, user_id, "member_invited", "invite", str(invite.id), {"email": body.email, "role": body.role})
    return invite


@router.get("/invites", response_model=list[InviteRead])
async def list_invites(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceInvite)
        .where(WorkspaceInvite.workspace_id == workspace_id, WorkspaceInvite.status == "pending")
        .order_by(WorkspaceInvite.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/invites/{invite_id}")
async def revoke_invite(
    invite_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceInvite).where(WorkspaceInvite.id == invite_id, WorkspaceInvite.workspace_id == workspace_id)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    await db.delete(invite)
    await db.commit()
    return {"status": "revoked"}


@router.post("/invites/{token}/accept", response_model=InviteAcceptResponse)
async def accept_invite(
    token: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceInvite).where(WorkspaceInvite.token == token, WorkspaceInvite.status == "pending")
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Invite has expired")

    invite.status = "accepted"
    await db.commit()
    await log_activity(db, str(invite.workspace_id), user_id, "member_joined", "workspace", str(invite.workspace_id))
    return InviteAcceptResponse(workspace_id=str(invite.workspace_id), role=invite.role)
```

- [ ] **Step 4: Create activity router**

```python
# src/backend/app/routers/activity.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.activity import ActivityFeed
from app.schemas.activity import ActivityRead

router = APIRouter(prefix="/api/workspaces", tags=["collaboration"])


@router.get("/activity", response_model=list[ActivityRead])
async def list_activity(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    result = await db.execute(
        select(ActivityFeed)
        .where(ActivityFeed.workspace_id == workspace_id)
        .order_by(ActivityFeed.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
```

- [ ] **Step 5: Create activity pruning task**

```python
# src/backend/app/tasks/activity.py
from datetime import datetime, timedelta
from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.activity.prune_activity", queue="bulk")
def prune_activity():
    """Delete activity entries older than 90 days."""
    import asyncio
    from sqlalchemy import delete
    from app.core.database import async_session_factory
    from app.models.activity import ActivityFeed

    async def _prune():
        cutoff = datetime.utcnow() - timedelta(days=90)
        async with async_session_factory() as db:
            await db.execute(delete(ActivityFeed).where(ActivityFeed.created_at < cutoff))
            await db.commit()

    asyncio.get_event_loop().run_until_complete(_prune())
```

- [ ] **Step 6: Register routers and tasks**

Add to `src/backend/app/main.py`:
```python
from app.routers.invites import router as invites_router
from app.routers.activity import router as activity_router
app.include_router(invites_router)
app.include_router(activity_router)
```

Add to celery beat schedule:
```python
"prune-activity": {"task": "app.tasks.activity.prune_activity", "schedule": 86400.0}
```

Add to include: `"app.tasks.activity"`

- [ ] **Step 7: Write tests**

```python
# src/backend/tests/test_invites.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_create_and_list_invite():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "invite@test.com", "password": "test1234",
            "full_name": "Invite Tester", "workspace_name": "invite-ws",
        })
        login = await client.post("/api/auth/login", json={
            "email": "invite@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        create_resp = await client.post("/api/workspaces/invite", headers=headers, json={
            "email": "newmember@test.com", "role": "member",
        })
        assert create_resp.status_code == 201
        list_resp = await client.get("/api/workspaces/invites", headers=headers)
        assert len(list_resp.json()) == 1
```

```python
# src/backend/tests/test_activity.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_activity_feed_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/api/auth/register", json={
            "email": "activity@test.com", "password": "test1234",
            "full_name": "Activity Tester", "workspace_name": "activity-ws",
        })
        login = await client.post("/api/auth/login", json={
            "email": "activity@test.com", "password": "test1234",
        })
        token = login.json()["access_token"]
        resp = await client.get("/api/workspaces/activity", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
```

- [ ] **Step 8: Commit**

```bash
git add src/backend/app/schemas/invite.py src/backend/app/schemas/activity.py src/backend/app/routers/invites.py src/backend/app/routers/activity.py src/backend/app/services/activity_service.py src/backend/app/tasks/activity.py src/backend/tests/test_invites.py src/backend/tests/test_activity.py src/backend/app/main.py src/backend/app/core/celery_app.py
git commit -m "feat: add collaboration backend — invites, activity feed, pruning"
```

---

## Group B: Frontend — Onboarding + Notifications + Export (Tasks 5-8)

### Task 5: Onboarding Wizard + Empty States

**Files:**
- Create: `src/frontend/src/components/onboarding/OnboardingWizard.tsx`
- Create: `src/frontend/src/components/ui/EmptyState.tsx`
- Create: `src/frontend/src/components/onboarding/TourProvider.tsx`
- Modify: `src/frontend/src/pages/DashboardPage.tsx`

Implement the 3-step wizard (Welcome → Connect → Verify), EmptyState reusable component, and TourProvider with 6-stop tooltip tour. Wizard shown when workspace has zero agents. Tour triggered after wizard completion. EmptyState applied to AgentsPage, EventsPage, AlertsPage, SessionsPage.

- [ ] **Commit:** `feat: add onboarding wizard, guided tour, and empty states`

---

### Task 6: Notification Frontend

**Files:**
- Create: `src/frontend/src/types/notification.ts`
- Create: `src/frontend/src/stores/notificationStore.ts`
- Create: `src/frontend/src/hooks/useNotifications.ts`
- Create: `src/frontend/src/components/notifications/NotificationBell.tsx`
- Create: `src/frontend/src/components/notifications/NotificationDropdown.tsx`
- Create: `src/frontend/src/components/notifications/NotificationItem.tsx`
- Create: `src/frontend/src/pages/NotificationsPage.tsx`
- Modify: `src/frontend/src/components/layout/AppShell.tsx`
- Modify: `src/frontend/src/routes.tsx`

Implement NotificationBell with unread badge in header, NotificationDropdown panel, NotificationItem component with type-based icons (Trophy, AlertTriangle, Info, Users from lucide), NotificationsPage with infinite scroll and filter tabs, Zustand store with WebSocket subscription for real-time push.

- [ ] **Commit:** `feat: add notification center — bell, dropdown, full page, real-time push`

---

### Task 7: Export Frontend

**Files:**
- Create: `src/frontend/src/types/export.ts`
- Create: `src/frontend/src/hooks/useExport.ts`
- Create: `src/frontend/src/components/export/ExportButton.tsx`
- Create: `src/frontend/src/components/export/ExportDialog.tsx`

ExportButton triggers ExportDialog with format selector (CSV/JSON) and optional date range picker. Download via fetch → blob → URL.createObjectURL → anchor click. Place on AgentsPage, EventsPage, AnalyticsPage headers.

- [ ] **Commit:** `feat: add data export UI — format selector, date range, download`

---

### Task 8: Collaboration Frontend

**Files:**
- Create: `src/frontend/src/types/collaboration.ts`
- Create: `src/frontend/src/stores/collaborationStore.ts`
- Create: `src/frontend/src/hooks/useCollaboration.ts`
- Create: `src/frontend/src/components/collaboration/InviteModal.tsx`
- Create: `src/frontend/src/components/collaboration/MemberList.tsx`
- Create: `src/frontend/src/components/collaboration/ActivityFeed.tsx`
- Create: `src/frontend/src/components/collaboration/ActivityItem.tsx`
- Create: `src/frontend/src/pages/InviteAcceptPage.tsx`
- Modify: `src/frontend/src/pages/SettingsPage.tsx`
- Modify: `src/frontend/src/pages/DashboardPage.tsx`
- Modify: `src/frontend/src/routes.tsx`

Settings → Members tab with MemberList and InviteModal (email + role + generate link). ActivityFeed sidebar on Dashboard. InviteAcceptPage at /invite/:token. Viewer role: hide mutation buttons based on role from auth store.

- [ ] **Commit:** `feat: add collaboration UI — members, invites, activity feed`

---

## Group C: Mobile + PWA (Tasks 9-10)

### Task 9: Mobile Navigation + Touch + Bottom Sheets

**Files:**
- Create: `src/frontend/src/components/mobile/BottomNav.tsx`
- Create: `src/frontend/src/components/mobile/BottomSheet.tsx`
- Modify: `src/frontend/src/components/layout/AppShell.tsx`
- Modify: `src/frontend/src/canvas/world/WorldRenderer.ts`
- Modify: `src/frontend/src/index.css`

BottomNav: 5 tabs (Dashboard, Canvas, Agents, Alerts, More), shown below md: breakpoint. BottomSheet: slides up, drag-to-dismiss, 75vh max. Touch canvas: pinch-to-zoom via pointer events, tap-to-select, long-press context menu. All interactive elements: min-h-[44px].

- [ ] **Commit:** `feat: add mobile bottom nav, bottom sheets, and touch canvas interactions`

---

### Task 10: PWA Support

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `src/frontend/index.html`
- Modify: `src/frontend/src/main.tsx`

PWA manifest with app name, icons, standalone display. Service worker caching app shell. Register SW in main.tsx. Offline banner component. Add-to-home-screen prompt after 3rd visit.

- [ ] **Commit:** `feat: add PWA support — manifest, service worker, offline banner`

---

## Group D: Integration + Final (Tasks 11-12)

### Task 11: Code Review + Fixes

- [ ] Review all Sprint 5 code against spec
- [ ] Fix any issues found
- [ ] **Commit:** `fix: Sprint 5 code review fixes`

### Task 12: Sprint Backlog Update + Push

- [ ] Update docs/sprint-backlog.md with Sprint 5 completion
- [ ] Update memory/pipeline tracker
- [ ] **Commit:** `docs: update sprint backlog with Sprint 5 completion`
- [ ] Push to GitHub
