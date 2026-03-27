"""Wallet endpoints — balance, transactions, and token management."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.wallet import Transaction, Wallet
from app.schemas.wallet import TransactionRead, WalletRead
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/api/wallet", tags=["wallet"])
_svc = WalletService()


@router.get("", response_model=WalletRead)
async def get_wallet(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> WalletRead:
    """Return the workspace wallet with the last 10 transactions."""
    wallet = await _svc.get_or_create_wallet(db, workspace_id)
    await db.commit()  # persist wallet if newly created

    recent = (
        await db.execute(
            select(Transaction)
            .where(Transaction.wallet_id == wallet.id)
            .order_by(desc(Transaction.created_at))
            .limit(10)
        )
    ).scalars().all()

    return WalletRead(
        id=wallet.id,
        workspace_id=wallet.workspace_id,
        balance=wallet.balance,
        created_at=wallet.created_at,
        recent_transactions=[TransactionRead.model_validate(t) for t in recent],
    )


@router.get("/transactions", response_model=List[TransactionRead])
async def get_wallet_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[TransactionRead]:
    """Return paginated transaction history for the workspace wallet."""
    wallet = await db.scalar(
        select(Wallet).where(Wallet.workspace_id == workspace_id)
    )
    if wallet is None:
        return []

    transactions = (
        await db.execute(
            select(Transaction)
            .where(Transaction.wallet_id == wallet.id)
            .order_by(desc(Transaction.created_at))
            .limit(limit)
            .offset(offset)
        )
    ).scalars().all()
    return list(transactions)
