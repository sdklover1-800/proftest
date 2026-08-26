from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.models.assessment import UserResponse as DBUserResponse
from app.models.question import ModuleEnum, Question, QuestionTypeEnum
from app.models.user import User
from tests.test_support import AsyncDatabaseTestCase


class UserResponseSchemaTest(AsyncDatabaseTestCase):
    """
    Scoring reads every row in `user_responses` at face value, so the database
    itself must refuse a second answer to the same question and must let the
    scoring query find a session's rows without a full scan.
    """

    async def _seed_session(self) -> tuple[int, int]:
        async with self.session_factory() as db:
            user = User(email="owner@example.com", hashed_password="x")
            db.add(user)
            await db.flush()

            question = Question(
                code="R_001",
                module=ModuleEnum.RIASEC,
                category="Realistic",
                text_ru="Мне нравится работать руками",
                type=QuestionTypeEnum.scale,
            )
            session = AssessmentSession(
                user_id=user.id,
                status=AssessmentStatusEnum.started,
                raw_scores={},
            )
            db.add_all([question, session])
            await db.commit()
            return session.id, question.id

    async def test_database_refuses_a_second_answer_to_the_same_question(self) -> None:
        session_id, question_id = await self._seed_session()

        async with self.session_factory() as db:
            db.add(
                DBUserResponse(
                    session_id=session_id, question_id=question_id, value=2
                )
            )
            await db.commit()

        with self.assertRaises(IntegrityError):
            async with self.session_factory() as db:
                db.add(
                    DBUserResponse(
                        session_id=session_id, question_id=question_id, value=5
                    )
                )
                await db.commit()

    async def test_answers_are_indexed_by_session(self) -> None:
        async with self.engine.begin() as conn:
            indexed = await conn.run_sync(
                lambda sync_conn: {
                    column
                    for index in inspect(sync_conn).get_indexes("user_responses")
                    for column in index["column_names"]
                }
            )

        self.assertIn("session_id", indexed)

    async def test_sessions_are_indexed_by_user(self) -> None:
        async with self.engine.begin() as conn:
            indexed = await conn.run_sync(
                lambda sync_conn: {
                    column
                    for index in inspect(sync_conn).get_indexes("assessment_sessions")
                    for column in index["column_names"]
                }
            )

        self.assertIn("user_id", indexed)
