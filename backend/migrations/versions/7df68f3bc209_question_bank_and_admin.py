"""Add grade and answer formats to the question bank and authorize admins."""
from alembic import op
import sqlalchemy as sa

revision = "7df68f3bc209"
down_revision = "c2d8a4f19e63"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("topics", sa.Column("grade", sa.Integer(), nullable=True))
    op.add_column("questions", sa.Column("open_answer", sa.Text(), nullable=True))
    op.add_column("questions", sa.Column("passage", sa.Text(), nullable=True))
    op.add_column("questions", sa.Column("quiz", sa.Integer(), nullable=True))
    op.add_column("answers", sa.Column("open_response", sa.Text(), nullable=True))
    op.add_column("test_attempts", sa.Column("archived_results", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("test_attempts", "archived_results")
    op.drop_column("answers", "open_response")
    op.drop_column("questions", "quiz")
    op.drop_column("questions", "passage")
    op.drop_column("questions", "open_answer")
    op.drop_column("topics", "grade")
    op.drop_column("users", "is_admin")
