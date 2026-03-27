"""Webhook endpoints — CRUD, delivery log, and test fire.

Endpoints:
    GET    /api/webhooks           — list workspace webhooks
    POST   /api/webhooks           — create webhook (secret returned once)
    PUT    /api/webhooks/{id}      — update webhook
    DELETE /api/webhooks/{id}      — delete webhook + deliveries
    GET    /api/webhooks/{id}/deliveries — delivery log (last 50)
    POST   /api/webhooks/{id}/test — send a test payload
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.webhook import Webhook, WebhookDelivery
from app.schemas.webhook import (
    WebhookCreate,
    WebhookUpdate,
    WebhookRead,
    WebhookCreatedRead,
    WebhookDeliveryRead,
)
from app.services.webhook_service import (
    generate_secret,
    dispatch_to_matching_webhooks,
)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.get("", response_model=List[WebhookRead])
async def list_webhooks(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[WebhookRead]:
    """List all webhooks for the current workspace."""
    result = await db.execute(
        select(Webhook).where(Webhook.workspace_id == workspace_id).order_by(Webhook.created_at.desc())
    )
    webhooks = result.scalars().all()
    return [WebhookRead.model_validate(w) for w in webhooks]


@router.post("", response_model=WebhookCreatedRead, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    body: WebhookCreate,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> WebhookCreatedRead:
    """Create a new webhook. The signing secret is returned only in this response."""
    secret = generate_secret()
    webhook = Webhook(
        workspace_id=workspace_id,
        name=body.name,
        url=body.url,
        secret=secret,
        events=body.events,
        active=body.active,
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return WebhookCreatedRead.model_validate(webhook)


@router.put("/{webhook_id}", response_model=WebhookRead)
async def update_webhook(
    webhook_id: str,
    body: WebhookUpdate,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> WebhookRead:
    """Update an existing webhook."""
    webhook = await _get_webhook_or_404(db, webhook_id, workspace_id)

    if body.name is not None:
        webhook.name = body.name
    if body.url is not None:
        webhook.url = body.url
    if body.events is not None:
        webhook.events = body.events
    if body.active is not None:
        webhook.active = body.active

    await db.commit()
    await db.refresh(webhook)
    return WebhookRead.model_validate(webhook)


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a webhook and all its delivery records."""
    webhook = await _get_webhook_or_404(db, webhook_id, workspace_id)
    await db.delete(webhook)
    await db.commit()


@router.get("/{webhook_id}/deliveries", response_model=List[WebhookDeliveryRead])
async def list_deliveries(
    webhook_id: str,
    limit: int = 50,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[WebhookDeliveryRead]:
    """Return recent delivery records for a webhook (newest first)."""
    await _get_webhook_or_404(db, webhook_id, workspace_id)
    result = await db.execute(
        select(WebhookDelivery)
        .where(WebhookDelivery.webhook_id == webhook_id)
        .order_by(WebhookDelivery.created_at.desc())
        .limit(min(limit, 200))
    )
    deliveries = result.scalars().all()
    return [WebhookDeliveryRead.model_validate(d) for d in deliveries]


@router.post("/{webhook_id}/test", response_model=WebhookDeliveryRead)
async def test_webhook(
    webhook_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> WebhookDeliveryRead:
    """Fire a test payload to verify the webhook endpoint is reachable."""
    test_payload = {
        "event_type": "test",
        "workspace_id": workspace_id,
        "data": {"message": "This is a test delivery from OpenAgentVisualizer"},
    }
    delivery_ids = await dispatch_to_matching_webhooks(
        db=db,
        workspace_id=workspace_id,
        event_type="test",
        payload=test_payload,
    )

    if not delivery_ids:
        # Webhook exists but may not be active — dispatch directly
        webhook = await _get_webhook_or_404(db, webhook_id, workspace_id)
        from app.services.webhook_service import create_delivery
        from app.tasks.webhooks import deliver_webhook

        delivery = await create_delivery(db, webhook, "test", test_payload)
        await db.commit()
        deliver_webhook.apply_async(args=[delivery.id], queue="critical")
        await db.refresh(delivery)
        return WebhookDeliveryRead.model_validate(delivery)

    # Return the first delivery (test fires one)
    result = await db.execute(
        select(WebhookDelivery).where(WebhookDelivery.id == delivery_ids[0])
    )
    delivery = result.scalar_one()
    return WebhookDeliveryRead.model_validate(delivery)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _get_webhook_or_404(
    db: AsyncSession, webhook_id: str, workspace_id: str
) -> Webhook:
    """Fetch a webhook by ID, verifying workspace ownership."""
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.workspace_id == workspace_id,
        )
    )
    webhook = result.scalar_one_or_none()
    if webhook is None:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook
