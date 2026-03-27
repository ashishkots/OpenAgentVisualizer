"""Webhook service — HMAC signing, delivery creation, and dispatch.

Delivery flow:
  1. Application event fires (achievement unlock, status change, etc.)
  2. dispatch_to_matching_webhooks() queries active webhooks subscribed to that event.
  3. For each match: a WebhookDelivery record is inserted and the
     deliver_webhook Celery task is queued on the critical queue.
  4. The task POSTs the payload with an HMAC-SHA256 signature header and
     retries up to 3 times (10s / 60s / 300s back-off).
"""

import hashlib
import hmac
import json
import secrets
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import Webhook, WebhookDelivery
from app.core.logging import get_logger

_logger = get_logger(__name__)

SECRET_LENGTH = 32  # bytes → 64 hex chars


def generate_secret() -> str:
    """Generate a cryptographically random hex secret for a new webhook."""
    return secrets.token_hex(SECRET_LENGTH)


def sign_payload(secret: str, payload: dict[str, Any]) -> str:
    """Return HMAC-SHA256 hex digest of the JSON-serialised payload.

    The signature is computed over the canonical JSON bytes (sorted keys,
    no extra whitespace) so the receiver can reproduce it deterministically.

    Args:
        secret: The webhook's signing secret (hex string).
        payload: The event payload dict.

    Returns:
        Hex-encoded HMAC-SHA256 digest prefixed with ``sha256=``.
    """
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


async def create_delivery(
    db: AsyncSession,
    webhook: Webhook,
    event_type: str,
    payload: dict[str, Any],
) -> WebhookDelivery:
    """Insert a pending WebhookDelivery record and return it.

    The Celery task is dispatched by the caller after this returns so
    we always have a DB record before the worker starts.
    """
    delivery = WebhookDelivery(
        webhook_id=webhook.id,
        event_type=event_type,
        payload=payload,
        status="pending",
        attempts=0,
    )
    db.add(delivery)
    await db.flush()
    await db.refresh(delivery)
    return delivery


async def dispatch_to_matching_webhooks(
    db: AsyncSession,
    workspace_id: str,
    event_type: str,
    payload: dict[str, Any],
) -> list[str]:
    """Find all active webhooks subscribed to event_type and enqueue delivery.

    Args:
        db: Async DB session.
        workspace_id: Workspace that owns the webhooks.
        event_type: The event type string (e.g. "agent.status_changed").
        payload: The event payload to deliver.

    Returns:
        List of delivery IDs created.
    """
    from app.tasks.webhooks import deliver_webhook  # avoid circular import

    result = await db.execute(
        select(Webhook).where(
            Webhook.workspace_id == workspace_id,
            Webhook.active == True,  # noqa: E712
        )
    )
    webhooks = result.scalars().all()

    delivery_ids: list[str] = []
    for webhook in webhooks:
        subscribed_events: list[str] = webhook.events or []
        if event_type not in subscribed_events:
            continue

        delivery = await create_delivery(db, webhook, event_type, payload)
        await db.commit()

        # Enqueue Celery task (critical queue, 3 retries)
        deliver_webhook.apply_async(
            args=[delivery.id],
            queue="critical",
        )
        delivery_ids.append(delivery.id)
        _logger.info(
            "webhook.dispatch",
            webhook_id=webhook.id,
            delivery_id=delivery.id,
            event_type=event_type,
        )

    return delivery_ids
