from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid
from typing import Optional, Dict, Any
from app.core.database import Base
from app.core.utils import utcnow


class ShopItem(Base):
    __tablename__ = "shop_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # cosmetic, boost, title
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="package")
    rarity: Mapped[str] = mapped_column(String(20), default="common")  # common, rare, epic, legendary
    effect_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (Index("ix_inventory_workspace_id", "workspace_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    item_id: Mapped[str] = mapped_column(
        ForeignKey("shop_items.id", ondelete="CASCADE"), nullable=False
    )
    agent_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    equipped: Mapped[bool] = mapped_column(Boolean, default=False)
    acquired_at: Mapped[datetime] = mapped_column(default=utcnow)
