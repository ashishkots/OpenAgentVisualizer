"""Pydantic schemas for the wallet and transaction system."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TransactionRead(BaseModel):
    id: str
    wallet_id: str
    amount: int
    type: str
    reference_id: Optional[str] = None
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletRead(BaseModel):
    id: str
    workspace_id: str
    balance: int
    created_at: datetime
    recent_transactions: List[TransactionRead] = []

    model_config = {"from_attributes": True}
