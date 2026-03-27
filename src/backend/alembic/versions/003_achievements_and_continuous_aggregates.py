"""Add achievements table, indexes for replay, and TimescaleDB continuous aggregates.

Revision ID: 003
Revises: 002
Create Date: 2026-03-27
"""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -----------------------------------------------------------------
    # achievements table
    # -----------------------------------------------------------------
    op.create_table(
        "achievements",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("workspace_id", sa.String(), nullable=False),
        sa.Column("agent_id", sa.String(), nullable=False),
        sa.Column("achievement_id", sa.String(20), nullable=False),
        sa.Column("achievement_name", sa.String(100), nullable=False),
        sa.Column("xp_bonus", sa.Integer(), nullable=False),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id", "agent_id", "achievement_id",
            name="uq_achievement_per_agent",
        ),
    )
    op.create_index(
        "ix_achievements_workspace_agent",
        "achievements",
        ["workspace_id", "agent_id"],
    )

    # -----------------------------------------------------------------
    # Additional indexes to support efficient replay queries
    # -----------------------------------------------------------------
    op.create_index(
        "ix_events_agent_ts",
        "events",
        ["agent_id", "timestamp"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_events_session_ts",
        "events",
        ["session_id", "timestamp"],
        if_not_exists=True,
    )

    # -----------------------------------------------------------------
    # TimescaleDB continuous aggregates (PostgreSQL with TimescaleDB only)
    # Wrapped in try/except so migrations succeed on plain PostgreSQL or SQLite.
    # -----------------------------------------------------------------
    try:
        # Hourly continuous aggregate
        op.execute(
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_hourly
            WITH (timescaledb.continuous) AS
            SELECT
                time_bucket('1 hour', timestamp)       AS hour,
                workspace_id,
                agent_id,
                SUM(total_tokens)::BIGINT              AS total_tokens,
                SUM(cost_usd)                          AS total_cost_usd,
                COUNT(*)::INTEGER                      AS request_count,
                AVG(NULL::DOUBLE PRECISION)            AS avg_latency_ms,
                NULL::DOUBLE PRECISION                 AS p95_latency_ms
            FROM metrics_raw
            GROUP BY hour, workspace_id, agent_id
            WITH NO DATA
            """
        )
        op.execute(
            """
            SELECT add_continuous_aggregate_policy(
                'metrics_hourly',
                start_offset   => INTERVAL '2 hours',
                end_offset     => INTERVAL '30 minutes',
                schedule_interval => INTERVAL '15 minutes',
                if_not_exists  => TRUE
            )
            """
        )

        # Daily continuous aggregate
        op.execute(
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_daily
            WITH (timescaledb.continuous) AS
            SELECT
                time_bucket('1 day', timestamp)        AS day,
                workspace_id,
                agent_id,
                SUM(total_tokens)::BIGINT              AS total_tokens,
                SUM(cost_usd)                          AS total_cost_usd,
                COUNT(*)::INTEGER                      AS request_count,
                AVG(NULL::DOUBLE PRECISION)            AS avg_latency_ms,
                NULL::DOUBLE PRECISION                 AS p95_latency_ms
            FROM metrics_raw
            GROUP BY day, workspace_id, agent_id
            WITH NO DATA
            """
        )
        op.execute(
            """
            SELECT add_continuous_aggregate_policy(
                'metrics_daily',
                start_offset      => INTERVAL '3 days',
                end_offset        => INTERVAL '1 hour',
                schedule_interval => INTERVAL '1 hour',
                if_not_exists     => TRUE
            )
            """
        )

        # Leaderboard materialized view (regular, not continuous aggregate)
        op.execute(
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS agent_leaderboard AS
            SELECT
                a.workspace_id,
                a.id                                              AS agent_id,
                a.name,
                a.level,
                a.xp_total,
                COALESCE(ach.achievement_count, 0)               AS achievement_count,
                RANK() OVER (
                    PARTITION BY a.workspace_id
                    ORDER BY a.xp_total DESC
                )                                                AS rank_xp
            FROM agents a
            LEFT JOIN (
                SELECT agent_id, COUNT(*) AS achievement_count
                FROM achievements
                GROUP BY agent_id
            ) ach ON ach.agent_id = a.id
            """
        )
        op.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS uix_agent_leaderboard_agent "
            "ON agent_leaderboard (workspace_id, agent_id)"
        )

    except Exception:
        # TimescaleDB not available — skip continuous aggregate creation silently.
        # The /api/metrics/aggregates endpoint will return an empty result set with
        # a "view_unavailable" note in non-TimescaleDB environments.
        pass


def downgrade() -> None:
    # Drop continuous aggregates and materialized views first (if they exist)
    try:
        op.execute("DROP MATERIALIZED VIEW IF EXISTS agent_leaderboard")
        op.execute("DROP MATERIALIZED VIEW IF EXISTS metrics_daily")
        op.execute("DROP MATERIALIZED VIEW IF EXISTS metrics_hourly")
    except Exception:
        pass

    op.drop_index("ix_events_session_ts", table_name="events", if_exists=True)
    op.drop_index("ix_events_agent_ts", table_name="events", if_exists=True)
    op.drop_index("ix_achievements_workspace_agent", table_name="achievements")
    op.drop_table("achievements")
