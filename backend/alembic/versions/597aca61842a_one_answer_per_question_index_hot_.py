"""one answer per question, index hot lookups

Scoring reads every row of `user_responses` at face value, so a question
answered twice in the same session counts twice and skews the result. This
collapses any existing duplicates to the most recent answer, then lets the
database enforce the rule.

The same table is read per session on every score calculation and per user on
every history request, so both lookups get an index. Deleting a session now
takes its answers with it instead of leaving orphans behind.

Revision ID: 597aca61842a
Revises: 42b3db3ee8f8
Create Date: 2026-08-26 17:03:39.752678

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '597aca61842a'
down_revision: str | Sequence[str] | None = '42b3db3ee8f8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SESSION_FK = "user_responses_session_id_fkey"


def upgrade() -> None:
    # Keep the latest answer per (session, question); drop earlier attempts.
    op.execute(
        sa.text(
            """
            DELETE FROM user_responses
            WHERE id NOT IN (
                SELECT MAX(id) FROM user_responses GROUP BY session_id, question_id
            )
            """
        )
    )

    op.create_unique_constraint(
        "uq_user_responses_session_question",
        "user_responses",
        ["session_id", "question_id"],
    )
    op.create_index(
        op.f("ix_user_responses_session_id"), "user_responses", ["session_id"]
    )
    op.create_index(
        op.f("ix_user_responses_question_id"), "user_responses", ["question_id"]
    )
    op.create_index(
        op.f("ix_assessment_sessions_user_id"), "assessment_sessions", ["user_id"]
    )

    op.drop_constraint(SESSION_FK, "user_responses", type_="foreignkey")
    op.create_foreign_key(
        SESSION_FK,
        "user_responses",
        "assessment_sessions",
        ["session_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(SESSION_FK, "user_responses", type_="foreignkey")
    op.create_foreign_key(
        SESSION_FK,
        "user_responses",
        "assessment_sessions",
        ["session_id"],
        ["id"],
    )

    op.drop_index(
        op.f("ix_assessment_sessions_user_id"), table_name="assessment_sessions"
    )
    op.drop_index(op.f("ix_user_responses_question_id"), table_name="user_responses")
    op.drop_index(op.f("ix_user_responses_session_id"), table_name="user_responses")
    op.drop_constraint(
        "uq_user_responses_session_question", "user_responses", type_="unique"
    )
