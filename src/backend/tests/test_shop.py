"""Tests for the shop + inventory system (Sprint 6 Task 5)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_shop_items_empty(authed_client: AsyncClient) -> None:
    """GET /api/shop returns empty list when no items are seeded."""
    r = await authed_client.get("/api/shop")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_get_inventory_empty(authed_client: AsyncClient) -> None:
    """GET /api/shop/inventory returns empty list for a new workspace."""
    r = await authed_client.get("/api/shop/inventory")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_buy_item_not_found(authed_client: AsyncClient) -> None:
    """POST /api/shop/{id}/buy returns 404 for a nonexistent item."""
    r = await authed_client.post("/api/shop/nonexistent-item-id/buy")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_buy_item_insufficient_balance(authed_client: AsyncClient) -> None:
    """POST /api/shop/{id}/buy returns 400 when wallet balance is too low."""
    from app.core.database import AsyncSessionLocal
    from app.models.shop import ShopItem
    from sqlalchemy import select

    # Insert a test shop item directly
    async with AsyncSessionLocal() as db:
        item = ShopItem(
            name="Test Ring",
            description="A test item",
            category="cosmetic",
            price=9999,
            icon="circle",
            rarity="common",
            active=True,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        item_id = item.id

    # Wallet should be empty (0 tokens), so purchase should fail
    r = await authed_client.post(f"/api/shop/{item_id}/buy")
    assert r.status_code == 400
    assert "Insufficient balance" in r.json()["detail"]


@pytest.mark.asyncio
async def test_buy_item_success_and_appears_in_inventory(authed_client: AsyncClient) -> None:
    """POST /api/shop/{id}/buy succeeds when balance is sufficient."""
    from app.core.database import AsyncSessionLocal
    from app.models.shop import ShopItem
    from app.services.wallet_service import WalletService
    from sqlalchemy import select

    svc = WalletService()

    # Insert a cheap test item
    async with AsyncSessionLocal() as db:
        item = ShopItem(
            name="Cheap Title",
            description="An affordable title",
            category="title",
            price=50,
            icon="star",
            rarity="common",
            active=True,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        item_id = item.id

    # Fund the wallet first
    r_w = await authed_client.get("/api/wallet")
    ws_id = r_w.json()["workspace_id"]
    async with AsyncSessionLocal() as db:
        wallet = await svc.get_or_create_wallet(db, ws_id)
        await svc.credit(db, wallet.id, 500, "test_top_up", description="test funds")
        await db.commit()

    # Buy the item
    r = await authed_client.post(f"/api/shop/{item_id}/buy")
    assert r.status_code == 201
    data = r.json()
    assert data["item_id"] == item_id
    assert data["tokens_spent"] == 50

    # Confirm it appears in inventory
    r_inv = await authed_client.get("/api/shop/inventory")
    assert r_inv.status_code == 200
    item_ids = [entry["item_id"] for entry in r_inv.json()]
    assert item_id in item_ids


@pytest.mark.asyncio
async def test_buy_item_already_owned(authed_client: AsyncClient) -> None:
    """POST /api/shop/{id}/buy returns 409 when a non-consumable is already owned."""
    from app.core.database import AsyncSessionLocal
    from app.models.shop import ShopItem
    from app.services.wallet_service import WalletService

    svc = WalletService()

    # Insert a cosmetic item
    async with AsyncSessionLocal() as db:
        item = ShopItem(
            name="Unique Cosmetic",
            description="One per workspace",
            category="cosmetic",
            price=50,
            icon="circle",
            rarity="common",
            active=True,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        item_id = item.id

    # Fund wallet
    r_w = await authed_client.get("/api/wallet")
    ws_id = r_w.json()["workspace_id"]
    async with AsyncSessionLocal() as db:
        wallet = await svc.get_or_create_wallet(db, ws_id)
        await svc.credit(db, wallet.id, 500, "test_top_up", description="test funds")
        await db.commit()

    # Buy once
    r1 = await authed_client.post(f"/api/shop/{item_id}/buy")
    assert r1.status_code == 201

    # Buy again — should conflict
    r2 = await authed_client.post(f"/api/shop/{item_id}/buy")
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_equip_and_unequip_item(authed_client: AsyncClient) -> None:
    """POST /api/shop/inventory/{id}/equip and /unequip work correctly."""
    from app.core.database import AsyncSessionLocal
    from app.models.shop import ShopItem, Inventory
    from app.services.wallet_service import WalletService

    svc = WalletService()

    # Create agent + inventory item
    r_a = await authed_client.post(
        "/api/agents",
        json={"name": "EquipBot", "role": "tester", "framework": "custom"},
    )
    assert r_a.status_code == 201
    agent_id = r_a.json()["id"]

    async with AsyncSessionLocal() as db:
        item = ShopItem(
            name="Equip Ring",
            description="Equipable ring",
            category="cosmetic",
            price=50,
            icon="circle",
            rarity="common",
            active=True,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        item_id = item.id

    # Fund and buy
    r_w = await authed_client.get("/api/wallet")
    ws_id = r_w.json()["workspace_id"]
    async with AsyncSessionLocal() as db:
        wallet = await svc.get_or_create_wallet(db, ws_id)
        await svc.credit(db, wallet.id, 500, "test_top_up", description="test funds")
        await db.commit()

    r_buy = await authed_client.post(f"/api/shop/{item_id}/buy")
    assert r_buy.status_code == 201
    inventory_id = r_buy.json()["inventory_id"]

    # Equip
    r_equip = await authed_client.post(
        f"/api/shop/inventory/{inventory_id}/equip",
        json={"agent_id": agent_id},
    )
    assert r_equip.status_code == 200
    assert r_equip.json()["equipped"] is True

    # Unequip
    r_unequip = await authed_client.post(f"/api/shop/inventory/{inventory_id}/unequip")
    assert r_unequip.status_code == 200
    assert r_unequip.json()["equipped"] is False
