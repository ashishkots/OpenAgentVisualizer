"""Pydantic schemas for the shop and inventory system."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ShopItemRead(BaseModel):
    id: str
    name: str
    description: str
    category: str
    price: int
    icon: str
    rarity: str
    effect_data: Optional[Any] = None
    active: bool
    owned: bool = False  # populated at query time

    model_config = {"from_attributes": True}


class InventoryRead(BaseModel):
    id: str
    workspace_id: str
    item_id: str
    agent_id: Optional[str] = None
    equipped: bool
    acquired_at: datetime
    item: Optional[ShopItemRead] = None

    model_config = {"from_attributes": True}


class BuyItemResponse(BaseModel):
    inventory_id: str
    item_id: str
    tokens_spent: int
    new_wallet_balance: int
