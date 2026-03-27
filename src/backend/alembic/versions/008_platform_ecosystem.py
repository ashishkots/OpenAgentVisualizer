"""Add 9 platform ecosystem tables: webhooks, webhook_deliveries, plugins, plugin_registry,
sso_configs, sso_sessions, organizations, org_members, shared_agents.
Also adds org_id to workspaces for multi-org tenancy.

Revision ID: 008
Revises: 007
Create Date: 2026-03-27
"""

import sqlalchemy as sa
from alembic import op

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- Webhook tables ----
    op.create_table(
        "webhooks",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("url", sa.String(2000), nullable=False),
        sa.Column("secret", sa.String(64), nullable=False),
        sa.Column("events", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("active", sa.Boolean, server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_webhooks_workspace_id", "webhooks", ["workspace_id"])

    op.create_table(
        "webhook_deliveries",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "webhook_id",
            sa.String,
            sa.ForeignKey("webhooks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("payload", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("response_code", sa.Integer, nullable=True),
        sa.Column("attempts", sa.Integer, server_default="0", nullable=False),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_webhook_deliveries_webhook_id", "webhook_deliveries", ["webhook_id"])
    op.create_index("ix_webhook_deliveries_status", "webhook_deliveries", ["status"])

    # ---- Plugin tables ----
    op.create_table(
        "plugin_registry",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("version", sa.String(50), nullable=False),
        sa.Column("author", sa.String(255), nullable=False),
        sa.Column("manifest_url", sa.String(2000), nullable=True),
        sa.Column("download_url", sa.String(2000), nullable=True),
        sa.Column("verified", sa.Boolean, server_default="false", nullable=False),
        sa.Column("downloads", sa.Integer, server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_plugin_registry_name", "plugin_registry", ["name"])

    op.create_table(
        "plugins",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("version", sa.String(50), nullable=False),
        sa.Column("author", sa.String(255), nullable=False),
        sa.Column("manifest", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("status", sa.String(20), server_default="installed", nullable=False),
        sa.Column(
            "installed_by",
            sa.String,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "installed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_plugins_workspace_id", "plugins", ["workspace_id"])

    # ---- SSO tables ----
    op.create_table(
        "sso_configs",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider_type", sa.String(20), nullable=False),
        sa.Column("entity_id", sa.String(500), nullable=True),
        sa.Column("sso_url", sa.String(2000), nullable=True),
        sa.Column("certificate", sa.Text, nullable=True),
        sa.Column("metadata_url", sa.String(2000), nullable=True),
        sa.Column("client_id", sa.String(255), nullable=True),
        sa.Column("client_secret_encrypted", sa.Text, nullable=True),
        sa.Column("issuer", sa.String(500), nullable=True),
        sa.Column("enabled", sa.Boolean, server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("workspace_id", name="uq_sso_configs_workspace_id"),
    )
    op.create_index("ix_sso_configs_workspace_id", "sso_configs", ["workspace_id"])

    op.create_table(
        "sso_sessions",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "user_id",
            sa.String,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider_type", sa.String(20), nullable=False),
        sa.Column("external_id", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sso_sessions_user_id", "sso_sessions", ["user_id"])

    # ---- Organization tables ----
    op.create_table(
        "organizations",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("plan", sa.String(20), server_default="free", nullable=False),
        sa.Column(
            "created_by",
            sa.String,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])

    op.create_table(
        "org_members",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "org_id",
            sa.String,
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), server_default="member", nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("org_id", "user_id", name="uq_org_members_org_user"),
    )
    op.create_index("ix_org_members_org_id", "org_members", ["org_id"])
    op.create_index("ix_org_members_user_id", "org_members", ["user_id"])

    op.create_table(
        "shared_agents",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "agent_id",
            sa.String,
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "source_workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "target_workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("permissions", sa.String(20), server_default="read", nullable=False),
        sa.Column(
            "shared_by",
            sa.String,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("agent_id", "target_workspace_id", name="uq_shared_agents_agent_target"),
    )
    op.create_index("ix_shared_agents_source_workspace_id", "shared_agents", ["source_workspace_id"])
    op.create_index("ix_shared_agents_target_workspace_id", "shared_agents", ["target_workspace_id"])

    # ---- Add org_id to workspaces ----
    op.add_column(
        "workspaces",
        sa.Column(
            "org_id",
            sa.String,
            sa.ForeignKey("organizations.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_workspaces_org_id", "workspaces", ["org_id"])


def downgrade() -> None:
    op.drop_index("ix_workspaces_org_id", table_name="workspaces")
    op.drop_column("workspaces", "org_id")

    op.drop_index("ix_shared_agents_target_workspace_id", table_name="shared_agents")
    op.drop_index("ix_shared_agents_source_workspace_id", table_name="shared_agents")
    op.drop_table("shared_agents")

    op.drop_index("ix_org_members_user_id", table_name="org_members")
    op.drop_index("ix_org_members_org_id", table_name="org_members")
    op.drop_table("org_members")

    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_table("organizations")

    op.drop_index("ix_sso_sessions_user_id", table_name="sso_sessions")
    op.drop_table("sso_sessions")

    op.drop_index("ix_sso_configs_workspace_id", table_name="sso_configs")
    op.drop_table("sso_configs")

    op.drop_index("ix_plugins_workspace_id", table_name="plugins")
    op.drop_table("plugins")

    op.drop_index("ix_plugin_registry_name", table_name="plugin_registry")
    op.drop_table("plugin_registry")

    op.drop_index("ix_webhook_deliveries_status", table_name="webhook_deliveries")
    op.drop_index("ix_webhook_deliveries_webhook_id", table_name="webhook_deliveries")
    op.drop_table("webhook_deliveries")

    op.drop_index("ix_webhooks_workspace_id", table_name="webhooks")
    op.drop_table("webhooks")
