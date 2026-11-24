"""Replace low-entropy plaintext email codes with keyed hashes."""
from alembic import context, op
import sqlalchemy as sa

revision = "b81e2e6c5f20"
down_revision = "67d0ed4b11c2"
branch_labels = None
depends_on = None


def upgrade():
    if context.is_offline_mode():
        # The offline path follows revision 67 from a clean schema; all three
        # legacy columns exist. Existing installations use the online path.
        op.execute("UPDATE users SET otp_expires_at = NULL, pending_email = NULL")
        with op.batch_alter_table("users") as batch_op:
            batch_op.drop_column("otp_code")
            batch_op.add_column(sa.Column("otp_hash", sa.String(length=64), nullable=True))
        return

    # Invalidate pending codes before dropping their plaintext values. Users
    # can request a fresh code through the resend endpoint after deployment.
    user_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("users")}
    clear_columns = [name for name in ("otp_expires_at", "pending_email") if name in user_columns]
    if clear_columns:
        assignments = ", ".join(f"{name} = NULL" for name in clear_columns)
        op.execute(f"UPDATE users SET {assignments}")
    # Some databases were stamped at revision 67d0ed4b11c2 before the
    # pending_email addition shipped. Restore the model column here so these
    # installations can continue upgrading without losing user records.
    if "pending_email" not in user_columns:
        op.add_column("users", sa.Column("pending_email", sa.String(length=254), nullable=True))
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("otp_code")
        batch_op.add_column(sa.Column("otp_hash", sa.String(length=64), nullable=True))


def downgrade():
    # Existing challenges cannot be recovered from their one-way hashes.
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("otp_code", sa.String(length=6), nullable=True))
        batch_op.drop_column("otp_hash")
