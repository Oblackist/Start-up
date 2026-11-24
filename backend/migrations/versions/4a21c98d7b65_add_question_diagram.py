"""Store diagrams for the question bank."""
from alembic import op
import sqlalchemy as sa

revision = "4a21c98d7b65"
down_revision = "7df68f3bc209"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("questions", sa.Column("image_svg", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("questions", "image_svg")
