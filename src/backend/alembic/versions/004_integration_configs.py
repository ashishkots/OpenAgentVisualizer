"""Add integration_configs table for per-workspace cross-product integration settings.

API keys are stored Fernet-encrypted at rest. One row per (workspace_id, product_name)
pair enforced by a unique index.

Revision ID: 004
Revises: 003
Create Date: 2026-03-27
"""

import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "integration_configs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("product_name", sa.String(50), nullable=False),
        sa.Column("base_url", sa.String(500), nullable=False),
        sa.Column("api_key_encrypted", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("settings_json", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            ondelete="CASCADE",
        ),
    )

    # Unique index ensures one config per (workspace, product)
    op.create_index(
        "ix_integration_configs_workspace_product",
        "integration_configs",
        ["workspace_id", "product_name"],
        unique=True,
    )

    # Index for workspace-scoped lookups
    op.create_index(
        "ix_integration_configs_workspace_id",
        "integration_configs",
        ["workspace_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_integration_configs_workspace_id", table_name="integration_configs")
    op.drop_index(
        "ix_integration_configs_workspace_product", table_name="integration_configs"
    )
    op.drop_table("integration_configs")
