"""Tests for the wallet system (Sprint 6 Task 4)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_wallet_autocreates(authed_client: AsyncClient) -> None:
    """GET /api/wallet auto-creates a wallet and returns balance of 0."""
    r = await authed_client.get("/api/wallet")
    assert r.status_code == 200
    data = r.json()
    assert data["balance"] == 0
    assert "id" in data
    assert "workspace_id" in data
    assert "recent_transactions" in data
    assert isinstance(data["recent_transactions"], list)


@pytest.mark.asyncio
async def test_get_wallet_transactions_empty(authed_client: AsyncClient) -> None:
    """GET /api/wallet/transactions returns an empty list for a new wallet."""
    # Ensure wallet exists first
    await authed_client.get("/api/wallet")

    r = await authed_client.get("/api/wallet/transactions")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_get_wallet_transactions_pagination(authed_client: AsyncClient) -> None:
    """GET /api/wallet/transactions respects limit and offset query params."""
    r = await authed_client.get("/api/wallet/transactions?limit=10&offset=0")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_wallet_service_credit(authed_client: AsyncClient) -> None:
    """WalletService.credit increases balance and records transaction."""
    from app.services.wallet_service import WalletService
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.wallet import Wallet, Transaction

    svc = WalletService()

    async with AsyncSessionLocal() as db:
        # Need a workspace — use the one from the authed test user
        r = await authed_client.get("/api/wallet")
        ws_id = r.json()["workspace_id"]

        wallet = await svc.get_or_create_wallet(db, ws_id)
        initial_balance = wallet.balance
        await svc.credit(db, wallet.id, 100, "test_credit", description="test")
        await db.commit()
        await db.refresh(wallet)

        assert wallet.balance == initial_balance + 100
        tx = await db.scalar(
            select(Transaction)
            .where(Transaction.wallet_id == wallet.id)
            .order_by(Transaction.created_at.desc())
            .limit(1)
        )
        assert tx is not None
        assert tx.amount == 100


@pytest.mark.asyncio
async def test_wallet_service_debit_insufficient_balance(authed_client: AsyncClient) -> None:
    """WalletService.debit raises ValueError for insufficient balance."""
    from app.services.wallet_service import WalletService
    from app.core.database import AsyncSessionLocal

    svc = WalletService()

    async with AsyncSessionLocal() as db:
        r = await authed_client.get("/api/wallet")
        ws_id = r.json()["workspace_id"]

        wallet = await svc.get_or_create_wallet(db, ws_id)
        # Ensure balance is 0
        wallet.balance = 0
        await db.commit()
        await db.refresh(wallet)

        with pytest.raises(ValueError, match="Insufficient balance"):
            await svc.debit(db, wallet.id, 999, "test_debit", description="should fail")
