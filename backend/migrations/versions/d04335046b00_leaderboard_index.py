"""leaderboard index

Adds `ix_attempts_subject_submitted (subject_id, submitted_at)` on
`test_attempts` — covers the WHERE clause of the public leaderboard
aggregate (docs/CONTRACT.md §8). Additive only: no tables or columns are
touched and existing data is preserved.

Revision ID: d04335046b00
Revises: 27cf5891ddb9
Create Date: 2026-10-26 23:12:36.893338

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd04335046b00'
down_revision = '27cf5891ddb9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('test_attempts', schema=None) as batch_op:
        batch_op.create_index(
            'ix_attempts_subject_submitted',
            ['subject_id', 'submitted_at'],
            unique=False,
        )


def downgrade():
    with op.batch_alter_table('test_attempts', schema=None) as batch_op:
        batch_op.drop_index('ix_attempts_subject_submitted')
