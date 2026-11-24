"""Add a sliding idle timeout while preserving the absolute session limit."""
from alembic import op
import sqlalchemy as sa

revision = "c2d8a4f19e63"
down_revision = "f710ae9c2841"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.add_column(
            sa.Column("absolute_expires_at", sa.DateTime(timezone=True), nullable=True)
        )

    # Existing expires_at values represented the old absolute deadline. Keep
    # those users' current maximum lifetime unchanged during the migration.
    op.execute("UPDATE sessions SET absolute_expires_at = expires_at")

    with op.batch_alter_table("sessions") as batch_op:
        batch_op.alter_column(
            "absolute_expires_at",
            existing_type=sa.DateTime(timezone=True),
            nullable=False,
        )


def downgrade():
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.drop_column("absolute_expires_at")
