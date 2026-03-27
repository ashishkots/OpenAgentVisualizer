"""Tests for the webhook system — CRUD, HMAC signing, and delivery dispatch."""

import hashlib
import hmac
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# CRUD tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_webhooks_empty(authed_client: AsyncClient):
    """List webhooks returns empty list on a fresh workspace."""
    r = await authed_client.get("/api/webhooks")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_webhook_returns_secret(authed_client: AsyncClient):
    """Creating a webhook returns the signing secret exactly once."""
    payload = {
        "name": "Test Hook",
        "url": "https://example.com/hook",
        "events": ["agent.created"],
    }
    r = await authed_client.post("/api/webhooks", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Test Hook"
    assert data["url"] == "https://example.com/hook"
    assert data["active"] is True
    # Secret must be present in creation response
    assert "secret" in data
    assert len(data["secret"]) == 64  # 32 bytes hex = 64 chars
    assert data["events"] == ["agent.created"]


@pytest.mark.asyncio
async def test_get_webhook_list_after_create(authed_client: AsyncClient):
    """Created webhook appears in list; secret is NOT included in list response."""
    create_payload = {
        "name": "Hook A",
        "url": "https://example.com/a",
        "events": ["task.completed"],
    }
    create_r = await authed_client.post("/api/webhooks", json=create_payload)
    assert create_r.status_code == 201

    list_r = await authed_client.get("/api/webhooks")
    assert list_r.status_code == 200
    hooks = list_r.json()
    assert len(hooks) == 1
    assert hooks[0]["name"] == "Hook A"
    # Secret should NOT be exposed in list
    assert "secret" not in hooks[0]


@pytest.mark.asyncio
async def test_update_webhook(authed_client: AsyncClient):
    """Updating a webhook changes the specified fields only."""
    r = await authed_client.post(
        "/api/webhooks",
        json={"name": "Original", "url": "https://example.com/orig", "events": ["level_up"]},
    )
    webhook_id = r.json()["id"]

    upd = await authed_client.put(
        f"/api/webhooks/{webhook_id}",
        json={"name": "Updated", "active": False},
    )
    assert upd.status_code == 200
    data = upd.json()
    assert data["name"] == "Updated"
    assert data["active"] is False
    assert data["url"] == "https://example.com/orig"  # unchanged


@pytest.mark.asyncio
async def test_delete_webhook(authed_client: AsyncClient):
    """Deleting a webhook removes it from the list."""
    r = await authed_client.post(
        "/api/webhooks",
        json={"name": "ToDelete", "url": "https://example.com/del", "events": ["alert.triggered"]},
    )
    webhook_id = r.json()["id"]

    del_r = await authed_client.delete(f"/api/webhooks/{webhook_id}")
    assert del_r.status_code == 204

    list_r = await authed_client.get("/api/webhooks")
    assert list_r.json() == []


@pytest.mark.asyncio
async def test_get_deliveries_empty(authed_client: AsyncClient):
    """Delivery log is empty for a newly created webhook."""
    r = await authed_client.post(
        "/api/webhooks",
        json={"name": "Delivery Test", "url": "https://example.com/d", "events": ["agent.created"]},
    )
    webhook_id = r.json()["id"]

    dl_r = await authed_client.get(f"/api/webhooks/{webhook_id}/deliveries")
    assert dl_r.status_code == 200
    assert dl_r.json() == []


@pytest.mark.asyncio
async def test_create_webhook_invalid_event(authed_client: AsyncClient):
    """Creating a webhook with an unknown event type returns 422."""
    r = await authed_client.post(
        "/api/webhooks",
        json={"name": "Bad", "url": "https://example.com/bad", "events": ["unknown.event"]},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_create_webhook_empty_events(authed_client: AsyncClient):
    """Creating a webhook with no events returns 422."""
    r = await authed_client.post(
        "/api/webhooks",
        json={"name": "Empty", "url": "https://example.com/empty", "events": []},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_update_webhook_not_found(authed_client: AsyncClient):
    """Updating a non-existent webhook returns 404."""
    r = await authed_client.put(
        "/api/webhooks/nonexistent-id",
        json={"name": "Ghost"},
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# HMAC signature verification
# ---------------------------------------------------------------------------


def test_sign_payload_produces_valid_hmac():
    """sign_payload returns a sha256= prefixed HMAC that can be verified."""
    from app.services.webhook_service import sign_payload

    secret = "mysecret"
    payload = {"event_type": "agent.created", "data": {"id": "agent-1"}}
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    expected_digest = hmac.new(
        secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()

    sig = sign_payload(secret, payload)
    assert sig == f"sha256={expected_digest}"


def test_sign_payload_different_secrets_differ():
    """Different secrets produce different signatures for the same payload."""
    from app.services.webhook_service import sign_payload

    payload = {"event": "test"}
    sig1 = sign_payload("secret1", payload)
    sig2 = sign_payload("secret2", payload)
    assert sig1 != sig2


def test_sign_payload_order_independent():
    """Key order in payload dict does not affect signature (canonical JSON)."""
    from app.services.webhook_service import sign_payload

    secret = "stable"
    p1 = {"b": 2, "a": 1}
    p2 = {"a": 1, "b": 2}
    assert sign_payload(secret, p1) == sign_payload(secret, p2)


def test_generate_secret_length():
    """generate_secret produces a 64-character hex string."""
    from app.services.webhook_service import generate_secret

    s = generate_secret()
    assert len(s) == 64
    assert all(c in "0123456789abcdef" for c in s)


def test_generate_secret_unique():
    """Successive calls to generate_secret produce unique secrets."""
    from app.services.webhook_service import generate_secret

    secrets = {generate_secret() for _ in range(10)}
    assert len(secrets) == 10


# ---------------------------------------------------------------------------
# Dispatch service tests (mocked DB)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dispatch_to_matching_webhooks_no_match():
    """dispatch_to_matching_webhooks returns empty list when no webhooks match."""
    from app.services.webhook_service import dispatch_to_matching_webhooks

    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_result)

    ids = await dispatch_to_matching_webhooks(db, "ws-1", "agent.created", {"data": {}})
    assert ids == []


@pytest.mark.asyncio
async def test_dispatch_skips_unsubscribed_events():
    """Webhooks not subscribed to the event type are skipped."""
    from app.services.webhook_service import dispatch_to_matching_webhooks
    from app.models.webhook import Webhook

    hook = Webhook(
        id="h1",
        workspace_id="ws1",
        name="H",
        url="https://example.com",
        secret="sec",
        events=["task.completed"],  # NOT agent.created
        active=True,
    )
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [hook]
    db.execute = AsyncMock(return_value=mock_result)

    ids = await dispatch_to_matching_webhooks(db, "ws1", "agent.created", {})
    assert ids == []
