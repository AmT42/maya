"""Initial schema (users, documents)

Revision ID: 20260104_0001
Revises:
Create Date: 2026-01-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260104_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "user" not in existing_tables:
        op.create_table(
            "user",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("username", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
            sa.Column("refresh_token", sa.String(), nullable=True),
            sa.Column("refresh_token_expires_at", sa.DateTime(), nullable=True),
            sa.Column("google_sub", sa.String(), nullable=True),
            sa.Column("full_name", sa.String(), nullable=True),
            sa.Column("avatar_url", sa.String(), nullable=True),
            sa.UniqueConstraint("username"),
            sa.UniqueConstraint("email"),
            sa.UniqueConstraint("google_sub"),
        )
        op.create_index(op.f("ix_user_id"), "user", ["id"], unique=False)
        op.create_index(op.f("ix_user_refresh_token"), "user", ["refresh_token"], unique=False)
    else:
        user_columns = {col["name"] for col in inspector.get_columns("user")}

        if "username" in user_columns:
            op.alter_column("user", "username", existing_type=sa.String(), nullable=False)
        if "email" in user_columns:
            op.alter_column("user", "email", existing_type=sa.String(), nullable=False)

        # Ensure nullable password for Google accounts.
        if "hashed_password" in user_columns:
            op.alter_column("user", "hashed_password", existing_type=sa.String(), nullable=True)
        else:
            op.add_column("user", sa.Column("hashed_password", sa.String(), nullable=True))

        for col_name, col in (
            ("refresh_token_expires_at", sa.Column("refresh_token_expires_at", sa.DateTime(), nullable=True)),
            ("google_sub", sa.Column("google_sub", sa.String(), nullable=True)),
            ("full_name", sa.Column("full_name", sa.String(), nullable=True)),
            ("avatar_url", sa.Column("avatar_url", sa.String(), nullable=True)),
        ):
            if col_name not in user_columns:
                op.add_column("user", col)

        user_indexes = {idx["name"] for idx in inspector.get_indexes("user")}
        if op.f("ix_user_refresh_token") not in user_indexes:
            op.create_index(op.f("ix_user_refresh_token"), "user", ["refresh_token"], unique=False)

        # Ensure uniqueness for google_sub without breaking multiple NULLs.
        # SQLAlchemy's unique constraint will create an index automatically on new DBs, but
        # for existing DBs we create a stable unique index name.
        if "ux_user_google_sub" not in user_indexes:
            op.create_index("ux_user_google_sub", "user", ["google_sub"], unique=True)

    if "documents" not in existing_tables:
        op.create_table(
            "documents",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column("file_path", sa.String(), nullable=True),
            sa.Column("doctype", sa.String(), nullable=False),
            sa.Column("date", sa.DateTime(), nullable=False),
            sa.Column("expediteur", sa.String(), nullable=False),
            sa.Column("recapitulatif", sa.String(), nullable=False),
            sa.Column("google_calendar", sa.String(), nullable=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        )
        op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)
        op.create_index(op.f("ix_documents_user_id"), "documents", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_documents_user_id"), table_name="documents")
    op.drop_index(op.f("ix_documents_id"), table_name="documents")
    op.drop_table("documents")

    op.drop_index(op.f("ix_user_refresh_token"), table_name="user")
    op.drop_index(op.f("ix_user_id"), table_name="user")
    op.drop_table("user")
