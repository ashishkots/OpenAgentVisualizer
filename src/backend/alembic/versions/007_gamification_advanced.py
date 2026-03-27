"""Add 17 advanced gamification tables: quests, skills, wallet, shop, tournaments, seasons, teams, challenges.

Revision ID: 007
Revises: 006
Create Date: 2026-03-27
"""

import sqlalchemy as sa
from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- Progression: quests ----
    op.create_table(
        "quests",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("steps", sa.JSON, nullable=True),
        sa.Column("xp_reward", sa.Integer, server_default="0", nullable=False),
        sa.Column("currency_reward", sa.Integer, server_default="0", nullable=False),
        sa.Column("icon", sa.String(50), server_default="star", nullable=False),
        sa.Column("active", sa.Boolean, server_default="true", nullable=False),
        sa.Column("reset_hours", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quests_workspace_id", "quests", ["workspace_id"])

    # ---- Progression: agent_quest_progress ----
    op.create_table(
        "agent_quest_progress",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "agent_id",
            sa.String,
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "quest_id",
            sa.String,
            sa.ForeignKey("quests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("current_step", sa.Integer, server_default="0", nullable=False),
        sa.Column("completed", sa.Boolean, server_default="false", nullable=False),
        sa.Column("claimed", sa.Boolean, server_default="false", nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_reset_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_agent_quest_progress_agent_id", "agent_quest_progress", ["agent_id"])

    # ---- Progression: skill_trees ----
    op.create_table(
        "skill_trees",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("icon", sa.String(50), server_default="zap", nullable=False),
    )

    # ---- Progression: skill_nodes ----
    op.create_table(
        "skill_nodes",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "tree_id",
            sa.String,
            sa.ForeignKey("skill_trees.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("parent_id", sa.String, sa.ForeignKey("skill_nodes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("level_required", sa.Integer, server_default="1", nullable=False),
        sa.Column("cost", sa.Integer, server_default="50", nullable=False),
        sa.Column("stat_bonus", sa.JSON, nullable=True),
        sa.Column("icon", sa.String(50), server_default="zap", nullable=False),
        sa.Column("tier", sa.Integer, server_default="1", nullable=False),
    )
    op.create_index("ix_skill_nodes_tree_id", "skill_nodes", ["tree_id"])

    # ---- Progression: agent_skills ----
    op.create_table(
        "agent_skills",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "agent_id",
            sa.String,
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "node_id",
            sa.String,
            sa.ForeignKey("skill_nodes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_agent_skills_agent_id", "agent_skills", ["agent_id"])

    # ---- Economy: wallets ----
    op.create_table(
        "wallets",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("balance", sa.Integer, server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("workspace_id", name="uq_wallets_workspace_id"),
    )

    # ---- Economy: transactions ----
    op.create_table(
        "transactions",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "wallet_id",
            sa.String,
            sa.ForeignKey("wallets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount", sa.Integer, nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("reference_id", sa.String(255), nullable=True),
        sa.Column("description", sa.String(500), server_default="", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_transactions_wallet_id", "transactions", ["wallet_id"])

    # ---- Economy: shop_items ----
    op.create_table(
        "shop_items",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("price", sa.Integer, nullable=False),
        sa.Column("icon", sa.String(50), server_default="package", nullable=False),
        sa.Column("rarity", sa.String(20), server_default="common", nullable=False),
        sa.Column("effect_data", sa.JSON, nullable=True),
        sa.Column("active", sa.Boolean, server_default="true", nullable=False),
    )

    # ---- Economy: inventory ----
    op.create_table(
        "inventory",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "item_id",
            sa.String,
            sa.ForeignKey("shop_items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            sa.String,
            sa.ForeignKey("agents.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("equipped", sa.Boolean, server_default="false", nullable=False),
        sa.Column("acquired_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_inventory_workspace_id", "inventory", ["workspace_id"])

    # ---- Competitive: tournaments ----
    op.create_table(
        "tournaments",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("entry_fee", sa.Integer, server_default="0", nullable=False),
        sa.Column("prize_pool", sa.Integer, server_default="0", nullable=False),
        sa.Column("status", sa.String(20), server_default="upcoming", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tournaments_workspace_id", "tournaments", ["workspace_id"])

    # ---- Competitive: tournament_entries ----
    op.create_table(
        "tournament_entries",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "tournament_id",
            sa.String,
            sa.ForeignKey("tournaments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            sa.String,
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("score", sa.Float, server_default="0", nullable=False),
        sa.Column("rank", sa.Integer, nullable=True),
        sa.Column("prize_awarded", sa.Integer, nullable=True),
        sa.Column("entered_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tournament_id", "agent_id", name="uq_tournament_entries_agent"),
    )
    op.create_index("ix_tournament_entries_tournament_id", "tournament_entries", ["tournament_id"])

    # ---- Competitive: seasons ----
    op.create_table(
        "seasons",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("number", sa.Integer, nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_seasons_workspace_id", "seasons", ["workspace_id"])

    # ---- Competitive: seasonal_xp ----
    op.create_table(
        "seasonal_xp",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "season_id",
            sa.String,
            sa.ForeignKey("seasons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            sa.String,
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("xp", sa.Integer, server_default="0", nullable=False),
        sa.UniqueConstraint("season_id", "agent_id", name="uq_seasonal_xp_season_agent"),
    )
    op.create_index("ix_seasonal_xp_season_id", "seasonal_xp", ["season_id"])

    # ---- Social: teams ----
    op.create_table(
        "teams",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(50), server_default="users", nullable=False),
        sa.Column(
            "created_by",
            sa.String,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_teams_workspace_id", "teams", ["workspace_id"])

    # ---- Social: team_members ----
    op.create_table(
        "team_members",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "team_id",
            sa.String,
            sa.ForeignKey("teams.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            sa.String,
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), server_default="member", nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("team_id", "agent_id", name="uq_team_members_team_agent"),
    )
    op.create_index("ix_team_members_team_id", "team_members", ["team_id"])

    # ---- Social: challenges ----
    op.create_table(
        "challenges",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "workspace_id",
            sa.String,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("goal_type", sa.String(50), nullable=False),
        sa.Column("goal_value", sa.Integer, nullable=False),
        sa.Column("current_value", sa.Integer, server_default="0", nullable=False),
        sa.Column("reward_tokens", sa.Integer, server_default="0", nullable=False),
        sa.Column("reward_xp", sa.Integer, server_default="0", nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_challenges_workspace_id", "challenges", ["workspace_id"])

    # ---- Social: challenge_progress ----
    op.create_table(
        "challenge_progress",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column(
            "challenge_id",
            sa.String,
            sa.ForeignKey("challenges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("contributor_id", sa.String(255), nullable=False),
        sa.Column("contribution", sa.Integer, server_default="0", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_challenge_progress_challenge_id", "challenge_progress", ["challenge_id"])


def downgrade() -> None:
    op.drop_index("ix_challenge_progress_challenge_id", table_name="challenge_progress")
    op.drop_table("challenge_progress")
    op.drop_index("ix_challenges_workspace_id", table_name="challenges")
    op.drop_table("challenges")
    op.drop_index("ix_team_members_team_id", table_name="team_members")
    op.drop_table("team_members")
    op.drop_index("ix_teams_workspace_id", table_name="teams")
    op.drop_table("teams")
    op.drop_index("ix_seasonal_xp_season_id", table_name="seasonal_xp")
    op.drop_table("seasonal_xp")
    op.drop_index("ix_seasons_workspace_id", table_name="seasons")
    op.drop_table("seasons")
    op.drop_index("ix_tournament_entries_tournament_id", table_name="tournament_entries")
    op.drop_table("tournament_entries")
    op.drop_index("ix_tournaments_workspace_id", table_name="tournaments")
    op.drop_table("tournaments")
    op.drop_index("ix_inventory_workspace_id", table_name="inventory")
    op.drop_table("inventory")
    op.drop_table("shop_items")
    op.drop_index("ix_transactions_wallet_id", table_name="transactions")
    op.drop_table("transactions")
    op.drop_table("wallets")
    op.drop_index("ix_agent_skills_agent_id", table_name="agent_skills")
    op.drop_table("agent_skills")
    op.drop_index("ix_skill_nodes_tree_id", table_name="skill_nodes")
    op.drop_table("skill_nodes")
    op.drop_table("skill_trees")
    op.drop_index("ix_agent_quest_progress_agent_id", table_name="agent_quest_progress")
    op.drop_table("agent_quest_progress")
    op.drop_index("ix_quests_workspace_id", table_name="quests")
    op.drop_table("quests")
