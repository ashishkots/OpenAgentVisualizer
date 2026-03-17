"""Convert tables to TimescaleDB hypertables

Revision ID: 002
Revises: 001
Create Date: 2026-03-17
"""
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute("SELECT create_hypertable('events', 'timestamp', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('spans', 'start_time', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('metrics_raw', 'timestamp', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('metrics_agg', 'bucket', if_not_exists => TRUE)")

def downgrade() -> None:
    # TimescaleDB hypertable conversion cannot be undone; drop and recreate if needed
    pass
