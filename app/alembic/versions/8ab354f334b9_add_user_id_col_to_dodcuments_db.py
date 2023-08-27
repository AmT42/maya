"""Add user_id col to dodcuments db

Revision ID: 8ab354f334b9
Revises: 
Create Date: 2023-08-26 00:31:01.597904

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8ab354f334b9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('documents', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'documents', 'user', ['user_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'documents', type_='foreignkey')
    op.drop_column('documents', 'user_id')
    # ### end Alembic commands ###
