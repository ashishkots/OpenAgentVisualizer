"""Shop and inventory endpoints — browse, purchase, equip items."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.shop import Inventory, ShopItem
from app.schemas.shop import BuyItemResponse, InventoryRead, ShopItemRead
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/api/shop", tags=["shop"])
_wallet_svc = WalletService()


@router.get("", response_model=List[ShopItemRead])
async def list_shop_items(
    category: Optional[str] = Query(None),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[ShopItemRead]:
    """List all active shop items with an 'owned' flag for the workspace."""
    stmt = select(ShopItem).where(ShopItem.active == True).order_by(ShopItem.price.asc())  # noqa: E712
    if category:
        stmt = stmt.where(ShopItem.category == category)
    items = (await db.execute(stmt)).scalars().all()

    owned_ids: set[str] = set(
        (
            await db.execute(
                select(Inventory.item_id).where(Inventory.workspace_id == workspace_id)
            )
        ).scalars().all()
    )

    result: list[ShopItemRead] = []
    for item in items:
        result.append(
            ShopItemRead(
                id=item.id,
                name=item.name,
                description=item.description,
                category=item.category,
                price=item.price,
                icon=item.icon,
                rarity=item.rarity,
                effect_data=item.effect_data,
                active=item.active,
                owned=item.id in owned_ids,
            )
        )
    return result


@router.post("/{item_id}/buy", status_code=201, response_model=BuyItemResponse)
async def buy_item(
    item_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> BuyItemResponse:
    """Purchase a shop item, deducting tokens from the workspace wallet.

    Raises 404 if item not found or inactive.
    Raises 409 if item already owned (non-consumables).
    Raises 400 if insufficient wallet balance.
    """
    item = await db.scalar(
        select(ShopItem).where(ShopItem.id == item_id, ShopItem.active == True)  # noqa: E712
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found or inactive")

    # Boosts are consumable — check uniqueness only for cosmetics and titles
    if item.category in ("cosmetic", "title"):
        existing = await db.scalar(
            select(Inventory).where(
                Inventory.workspace_id == workspace_id,
                Inventory.item_id == item_id,
            )
        )
        if existing:
            raise HTTPException(status_code=409, detail="Item already owned")

    # Debit wallet
    wallet = await _wallet_svc.get_or_create_wallet(db, workspace_id)
    try:
        await _wallet_svc.debit(
            db,
            wallet_id=wallet.id,
            amount=item.price,
            tx_type="purchase",
            reference_id=item_id,
            description=f"Purchased: {item.name}",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    inv = Inventory(workspace_id=workspace_id, item_id=item_id)
    db.add(inv)
    await db.flush()
    await db.refresh(wallet)
    await db.commit()

    return BuyItemResponse(
        inventory_id=inv.id,
        item_id=item_id,
        tokens_spent=item.price,
        new_wallet_balance=wallet.balance,
    )


@router.get("/inventory", response_model=List[InventoryRead])
async def get_inventory(
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> List[InventoryRead]:
    """Return all owned inventory items for the workspace."""
    rows = (
        await db.execute(
            select(Inventory, ShopItem)
            .join(ShopItem, ShopItem.id == Inventory.item_id)
            .where(Inventory.workspace_id == workspace_id)
            .order_by(Inventory.acquired_at.desc())
        )
    ).all()

    result: list[InventoryRead] = []
    for inv, item in rows:
        result.append(
            InventoryRead(
                id=inv.id,
                workspace_id=inv.workspace_id,
                item_id=inv.item_id,
                agent_id=inv.agent_id,
                equipped=inv.equipped,
                acquired_at=inv.acquired_at,
                item=ShopItemRead(
                    id=item.id,
                    name=item.name,
                    description=item.description,
                    category=item.category,
                    price=item.price,
                    icon=item.icon,
                    rarity=item.rarity,
                    effect_data=item.effect_data,
                    active=item.active,
                    owned=True,
                ),
            )
        )
    return result


@router.post("/inventory/{inventory_id}/equip")
async def equip_item(
    inventory_id: str,
    agent_id: str = Body(..., embed=True),
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Equip a cosmetic or title inventory item on an agent."""
    inv = await db.scalar(
        select(Inventory).where(
            Inventory.id == inventory_id,
            Inventory.workspace_id == workspace_id,
        )
    )
    if inv is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    inv.agent_id = agent_id
    inv.equipped = True
    await db.commit()
    return {"inventory_id": inventory_id, "agent_id": agent_id, "equipped": True}


@router.post("/inventory/{inventory_id}/unequip")
async def unequip_item(
    inventory_id: str,
    workspace_id: str = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Remove an inventory item from the agent it is equipped on."""
    inv = await db.scalar(
        select(Inventory).where(
            Inventory.id == inventory_id,
            Inventory.workspace_id == workspace_id,
        )
    )
    if inv is None:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    inv.agent_id = None
    inv.equipped = False
    await db.commit()
    return {"inventory_id": inventory_id, "equipped": False}
