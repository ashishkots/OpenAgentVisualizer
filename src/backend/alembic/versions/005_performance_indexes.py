"""Add composite performance indexes and connection pool documentation.

Creates three composite indexes that cover the most common multi-column
query patterns observed in the agents, events, and achievements tables.
These are additive — no existing indexes are removed.

Revision ID: 005
Revises: 004
Create Date: 2026-03-27
"""

import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Composite index on events(session_id, event_type, timestamp).
    # Covers replay queries that filter by session_id + event_type and
    # order/range-scan by timestamp, avoiding a full hypertable seq-scan.
    op.create_index(
        "ix_events_session_type_ts",
        "events",
        ["session_id", "event_type", "timestamp"],
    )

    # Composite index on agents(workspace_id, status).
    # Covers the common "list active agents in workspace" query pattern used
    # by both the agents list endpoint and the oav_agents_active Prometheus gauge.
    op.create_index(
        "ix_agents_workspace_status",
        "agents",
        ["workspace_id", "status"],
    )

    # Composite index on achievements(workspace_id, agent_id).
    # The SQLAlchemy model already declares this as an ORM-level Index, but
    # earlier migrations did not emit it explicitly.  op.create_index with
    # if_not_exists ensures idempotency if it was created via create_all.
    op.create_index(
        "ix_achievements_workspace_agent",
        "achievements",
        ["workspace_id", "agent_id"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index("ix_achievements_workspace_agent", table_name="achievements")
    op.drop_index("ix_agents_workspace_status", table_name="agents")
    op.drop_index("ix_events_session_type_ts", table_name="events")
