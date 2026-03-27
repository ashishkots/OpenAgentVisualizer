"""Celery tasks for webhook delivery and housekeeping.

Tasks:
    deliver_webhook — POST the payload to the target URL with HMAC header.
                      Retries up to 3 times at 10s / 60s / 300s back-off.
    cleanup_deliveries — Daily beat task that deletes successful deliveries
                         older than 30 days to keep the table lean.
"""

import json
from datetime import datetime, timedelta, timezone

import httpx

from app.core.celery_app import celery_app
from app.core.logging import get_logger
from app.services.webhook_service import sign_payload

_logger = get_logger(__name__)

# Retry countdown values in seconds: attempt 1 -> 10s, 2 -> 60s, 3 -> 300s
_RETRY_COUNTDOWNS = [10, 60, 300]
_MAX_RETRIES = 3


@celery_app.task(
    name="app.tasks.webhooks.deliver_webhook",
    bind=True,
    max_retries=_MAX_RETRIES,
    queue="critical",
)
def deliver_webhook(self, delivery_id: str) -> None:  # type: ignore[misc]
    """POST a webhook delivery payload to its target URL.

    Uses synchronous httpx (Celery workers are sync) with a 15-second timeout.
    On non-2xx response or network error the delivery is retried with
    exponential back-off up to _MAX_RETRIES times; after that the delivery
    record is marked "failed".

    Args:
        delivery_id: Primary key of the WebhookDelivery record.
    """
    import asyncio

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import settings
    from app.models.webhook import WebhookDelivery, Webhook

    # Use synchronous SQLAlchemy for Celery tasks
    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(sync_url)

    with Session(engine) as db:
        delivery = db.get(WebhookDelivery, delivery_id)
        if delivery is None:
            _logger.warning("webhook.delivery_not_found", delivery_id=delivery_id)
            return

        webhook = db.get(Webhook, delivery.webhook_id)
        if webhook is None or not webhook.active:
            delivery.status = "failed"
            db.commit()
            return

        payload = delivery.payload
        signature = sign_payload(webhook.secret, payload)
        body = json.dumps(payload, sort_keys=True, separators=(",", ":"))

        delivery.attempts += 1
        attempt = delivery.attempts

        try:
            resp = httpx.post(
                webhook.url,
                content=body.encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "X-OAV-Signature": signature,
                    "X-OAV-Event": delivery.event_type,
                    "X-OAV-Delivery": delivery.id,
                },
                timeout=15.0,
            )
            resp.raise_for_status()
            delivery.status = "success"
            delivery.response_code = resp.status_code
            db.commit()
            _logger.info(
                "webhook.delivered",
                delivery_id=delivery_id,
                status_code=resp.status_code,
                attempt=attempt,
            )

        except Exception as exc:
            response_code = None
            if isinstance(exc, httpx.HTTPStatusError):
                response_code = exc.response.status_code

            delivery.response_code = response_code
            _logger.warning(
                "webhook.delivery_failed",
                delivery_id=delivery_id,
                attempt=attempt,
                error=str(exc),
            )

            if attempt < _MAX_RETRIES:
                countdown = _RETRY_COUNTDOWNS[attempt - 1]
                delivery.status = "pending"
                delivery.next_retry_at = datetime.now(tz=timezone.utc) + timedelta(
                    seconds=countdown
                )
                db.commit()
                raise self.retry(exc=exc, countdown=countdown)
            else:
                delivery.status = "failed"
                delivery.next_retry_at = None
                db.commit()


@celery_app.task(
    name="app.tasks.webhooks.cleanup_deliveries",
    queue="bulk",
)
def cleanup_deliveries() -> None:
    """Delete successful webhook deliveries older than 30 days.

    Runs daily via Celery beat. Keeps the webhook_deliveries table small
    by pruning old successful records while retaining failed ones for
    operator inspection.
    """
    from sqlalchemy import create_engine, delete
    from sqlalchemy.orm import Session

    from app.core.config import settings
    from app.models.webhook import WebhookDelivery

    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=30)
    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(sync_url)

    with Session(engine) as db:
        result = db.execute(
            delete(WebhookDelivery).where(
                WebhookDelivery.status == "success",
                WebhookDelivery.created_at < cutoff,
            )
        )
        db.commit()
        _logger.info("webhook.cleanup", deleted=result.rowcount)
