"""Add API keys table for public API authentication

Revision ID: 20251211_0002
Revises: 20251204_0001
Create Date: 2025-12-11

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20251211_0002"
down_revision: Union[str, None] = "20251204_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create api_keys table
    op.create_table(
        "api_keys",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("key_prefix", sa.String(length=12), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="active",
        ),
        sa.Column("rate_limit_rpm", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("request_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_used_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("owner_email", sa.String(length=255), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index(op.f("ix_api_keys_id"), "api_keys", ["id"], unique=False)
    op.create_index(op.f("ix_api_keys_key_hash"), "api_keys", ["key_hash"], unique=True)
    op.create_index(op.f("ix_api_keys_status"), "api_keys", ["status"], unique=False)
    op.create_index(op.f("ix_api_keys_owner_email"), "api_keys", ["owner_email"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_api_keys_owner_email"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_status"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_key_hash"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_id"), table_name="api_keys")
    op.drop_table("api_keys")
