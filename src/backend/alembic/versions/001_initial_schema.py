"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # workspaces (no FK dependencies)
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    # workspace_members
    op.create_table(
        "workspace_members",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=True),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("role", sa.String(20), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "user_id"),
    )
    # api_keys
    op.create_table(
        "api_keys",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=True),
        sa.Column("key_hash", sa.String(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash"),
    )
    # agents
    op.create_table(
        "agents",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("role", sa.String(100), nullable=True),
        sa.Column("framework", sa.String(50), nullable=True),
        sa.Column("avatar_id", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=True),
        sa.Column("level", sa.Integer(), nullable=True),
        sa.Column("xp_total", sa.Integer(), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=True),
        sa.Column("total_cost_usd", sa.Numeric(12, 8), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agents_workspace_id", "agents", ["workspace_id"])
    # tasks
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=True),
        sa.Column("workspace_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=True),
        sa.Column("result", sa.Text(), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("cost_usd", sa.Numeric(12, 8), nullable=True),
        sa.Column("xp_awarded", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["agent_id"], ["agents.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_workspace_id", "tasks", ["workspace_id"])
    # events (will be converted to hypertable in 002)
    op.create_table(
        "events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_events_workspace_ts", "events", ["workspace_id", "timestamp"])
    # spans (will be converted to hypertable in 002)
    op.create_table(
        "spans",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("trace_id", sa.String(64), nullable=False),
        sa.Column("span_id", sa.String(32), nullable=False),
        sa.Column("parent_span_id", sa.String(32), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=True),
        sa.Column("attributes", postgresql.JSONB(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_spans_workspace_ts", "spans", ["workspace_id", "start_time"])
    # sessions
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("agent_ids", postgresql.JSONB(), nullable=True),
        sa.Column("event_count", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sessions_workspace_id", "sessions", ["workspace_id"])
    # metrics_raw (will be converted to hypertable in 002)
    op.create_table(
        "metrics_raw",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=False),
        sa.Column("task_id", sa.String(), nullable=True),
        sa.Column("model", sa.String(100), nullable=True),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("completion_tokens", sa.Integer(), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=True),
        sa.Column("cost_usd", sa.Numeric(12, 8), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_metrics_raw_agent_ts", "metrics_raw", ["agent_id", "timestamp"])
    # metrics_agg (will be converted to hypertable in 002)
    op.create_table(
        "metrics_agg",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=False),
        sa.Column("bucket", sa.DateTime(timezone=True), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=True),
        sa.Column("total_cost_usd", sa.Numeric(12, 8), nullable=True),
        sa.Column("task_count", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_metrics_agg_agent_bucket", "metrics_agg", ["agent_id", "bucket"])
    # xp_transactions
    op.create_table(
        "xp_transactions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=False),
        sa.Column("task_id", sa.String(), nullable=True),
        sa.Column("xp_delta", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_xp_transactions_workspace_id", "xp_transactions", ["workspace_id"])
    # alerts
    op.create_table(
        "alerts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=True),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=True),
        sa.Column("message", sa.String(500), nullable=False),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("resolved", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alerts_workspace_id", "alerts", ["workspace_id"])
    # audit_log
    op.create_table(
        "audit_log",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_log_workspace_id", "audit_log", ["workspace_id"])

def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("alerts")
    op.drop_table("xp_transactions")
    op.drop_table("metrics_agg")
    op.drop_table("metrics_raw")
    op.drop_table("sessions")
    op.drop_table("spans")
    op.drop_table("events")
    op.drop_table("tasks")
    op.drop_table("agents")
    op.drop_table("api_keys")
    op.drop_table("workspace_members")
    op.drop_table("users")
    op.drop_table("workspaces")
