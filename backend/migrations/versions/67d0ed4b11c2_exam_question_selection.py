"""Track the delivered question set and align the user table with the OTP model."""
from alembic import context, op
import sqlalchemy as sa

revision = "67d0ed4b11c2"
down_revision = "d04335046b00"
branch_labels = None
depends_on = None


def upgrade():
    if context.is_offline_mode():
        # Offline SQL is generated for the clean parent revision, whose schema
        # is defined by the preceding migrations. Existing/partially repaired
        # databases must use online migrations so inspection can preserve data.
        op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.true()))
        op.add_column("users", sa.Column("otp_code", sa.String(6), nullable=True))
        op.add_column("users", sa.Column("otp_expires_at", sa.DateTime(timezone=True), nullable=True))
        op.add_column("users", sa.Column("pending_email", sa.String(254), nullable=True))
        op.add_column("test_attempts", sa.Column("question_ids", sa.JSON(), nullable=True))
        return

    inspector = sa.inspect(op.get_bind())
    users = {col["name"] for col in inspector.get_columns("users")}
    if "is_verified" not in users:
        op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.true()))
    if "otp_code" not in users:
        op.add_column("users", sa.Column("otp_code", sa.String(6), nullable=True))
    if "otp_expires_at" not in users:
        op.add_column("users", sa.Column("otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    if "pending_email" not in users:
        op.add_column("users", sa.Column("pending_email", sa.String(254), nullable=True))
    attempts = {col["name"] for col in inspector.get_columns("test_attempts")}
    if "question_ids" not in attempts:
        op.add_column("test_attempts", sa.Column("question_ids", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("test_attempts", "question_ids")
    op.drop_column("users", "pending_email")
    # OTP columns precede this revision in installations created via db.create_all().
