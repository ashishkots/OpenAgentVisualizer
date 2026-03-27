"""Wallet service — token credit/debit with transaction logging.

Auto-creates a wallet for the workspace on first access if none exists.
Debit raises ValueError (400) if balance is insufficient.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.wallet import Wallet, Transaction


class WalletService:
    """Class-based wallet service for use in routers and other services."""

    async def get_or_create_wallet(self, db: AsyncSession, workspace_id: str) -> Wallet:
        """Return the workspace wallet, creating it if it does not yet exist."""
        wallet = await db.scalar(
            select(Wallet).where(Wallet.workspace_id == workspace_id)
        )
        if wallet is None:
            wallet = Wallet(workspace_id=workspace_id, balance=0)
            db.add(wallet)
            await db.flush()
        return wallet

    async def credit(
        self,
        db: AsyncSession,
        wallet_id: str,
        amount: int,
        tx_type: str,
        reference_id: Optional[str] = None,
        description: str = "",
    ) -> Wallet:
        """Credit tokens to a wallet by wallet_id.

        Args:
            db: Async DB session (caller must commit).
            wallet_id: Target wallet ID.
            amount: Positive integer number of tokens to credit.
            tx_type: Transaction type label.
            reference_id: Optional ID of the originating object.
            description: Human-readable description.

        Returns:
            Updated Wallet instance (not yet committed).
        """
        if amount <= 0:
            raise ValueError(f"Credit amount must be positive, got {amount}")
        wallet = await db.get(Wallet, wallet_id)
        if wallet is None:
            raise ValueError(f"Wallet {wallet_id} not found")
        wallet.balance += amount
        tx = Transaction(
            wallet_id=wallet.id,
            amount=amount,
            type=tx_type,
            reference_id=reference_id,
            description=description or f"Credit {amount} tokens",
        )
        db.add(tx)
        return wallet

    async def debit(
        self,
        db: AsyncSession,
        wallet_id: str,
        amount: int,
        tx_type: str,
        reference_id: Optional[str] = None,
        description: str = "",
    ) -> Wallet:
        """Debit tokens from a wallet by wallet_id.

        Args:
            db: Async DB session (caller must commit).
            wallet_id: Target wallet ID.
            amount: Positive integer number of tokens to debit.
            tx_type: Transaction type label.
            reference_id: Optional ID of the originating object.
            description: Human-readable description.

        Returns:
            Updated Wallet instance (not yet committed).

        Raises:
            ValueError: Insufficient balance.
        """
        if amount <= 0:
            raise ValueError(f"Debit amount must be positive, got {amount}")
        wallet = await db.get(Wallet, wallet_id)
        if wallet is None:
            raise ValueError(f"Wallet {wallet_id} not found")
        if wallet.balance < amount:
            raise ValueError(
                f"Insufficient balance: have {wallet.balance}, need {amount}"
            )
        wallet.balance -= amount
        tx = Transaction(
            wallet_id=wallet.id,
            amount=-amount,
            type=tx_type,
            reference_id=reference_id,
            description=description or f"Debit {amount} tokens",
        )
        db.add(tx)
        return wallet

    async def credit_workspace(
        self,
        db: AsyncSession,
        workspace_id: str,
        amount: int,
        tx_type: str,
        reference_id: Optional[str] = None,
        description: str = "",
    ) -> Wallet:
        """Convenience: credit by workspace_id (auto-creates wallet if needed)."""
        wallet = await self.get_or_create_wallet(db, workspace_id)
        return await self.credit(db, wallet.id, amount, tx_type, reference_id, description)

    async def debit_workspace(
        self,
        db: AsyncSession,
        workspace_id: str,
        amount: int,
        tx_type: str,
        reference_id: Optional[str] = None,
        description: str = "",
    ) -> Wallet:
        """Convenience: debit by workspace_id (auto-creates wallet if needed)."""
        wallet = await self.get_or_create_wallet(db, workspace_id)
        return await self.debit(db, wallet.id, amount, tx_type, reference_id, description)


# ---------------------------------------------------------------------------
# Module-level convenience functions (used by pre-existing code)
# ---------------------------------------------------------------------------

_default_svc = WalletService()


async def _get_or_create_wallet(db: AsyncSession, workspace_id: str) -> Wallet:
    """Return the workspace wallet, creating it if it does not yet exist."""
    return await _default_svc.get_or_create_wallet(db, workspace_id)


async def credit(
    db: AsyncSession,
    workspace_id: str,
    amount: int,
    tx_type: str,
    reference_id: Optional[str] = None,
    description: str = "",
) -> Wallet:
    """Credit tokens to a workspace wallet (module-level convenience)."""
    return await _default_svc.credit_workspace(
        db, workspace_id, amount, tx_type, reference_id, description
    )


async def debit(
    db: AsyncSession,
    workspace_id: str,
    amount: int,
    tx_type: str,
    reference_id: Optional[str] = None,
    description: str = "",
) -> Wallet:
    """Debit tokens from a workspace wallet (module-level convenience).

    Raises:
        ValueError: Insufficient balance (callers that need HTTP 400 should catch and re-raise).
    """
    return await _default_svc.debit_workspace(
        db, workspace_id, amount, tx_type, reference_id, description
    )
