from sqlalchemy import func, select

from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.models.assessment import UserResponse as DBUserResponse
from app.models.question import ModuleEnum, Question, QuestionTypeEnum
from app.models.user import User
from tests.test_api_support import ApiTestCase


class AnswerValidationTest(ApiTestCase):
    """
    An answer is only meaningful if it belongs to a live session, points at a
    real question, and carries a value that question can actually take.
    """

    def setUp(self) -> None:
        super().setUp()
        self.await_(self._seed())
        self.authenticate_as(self.owner)

    async def _seed(self) -> None:
        async with self.session_factory() as db:
            owner = User(email="owner@example.com", hashed_password="x")
            db.add(owner)
            await db.flush()

            scale_question = Question(
                code="R_001",
                module=ModuleEnum.RIASEC,
                category="Realistic",
                text_ru="Мне нравится работать руками",
                type=QuestionTypeEnum.scale,
            )
            choice_question = Question(
                code="SJT_001",
                module=ModuleEnum.SJT,
                category="self_organization",
                text_ru="Несколько задач с одним дедлайном",
                type=QuestionTypeEnum.choice,
                options=[
                    {"text": "Составлю план", "value": 2},
                    {"text": "Начну с простой", "value": 1},
                    {"text": "Наугад", "value": 0},
                ],
            )
            db.add_all([scale_question, choice_question])

            open_session = AssessmentSession(
                user_id=owner.id, status=AssessmentStatusEnum.started, raw_scores={}
            )
            done_session = AssessmentSession(
                user_id=owner.id,
                status=AssessmentStatusEnum.completed,
                raw_scores={"RIASEC": {"Realistic": 60}},
            )
            db.add_all([open_session, done_session])
            await db.commit()

            self.owner = owner
            self.scale_question_id = scale_question.id
            self.choice_question_id = choice_question.id
            self.session_id = open_session.id
            self.completed_session_id = done_session.id

    def _post(self, **overrides):
        payload = {
            "session_id": self.session_id,
            "question_id": self.scale_question_id,
            "value": 4,
        }
        payload.update(overrides)
        return self.client.post("/api/v1/assessment/submit", json=payload)

    async def _stored_answers(self, question_id: int) -> list[DBUserResponse]:
        async with self.session_factory() as db:
            result = await db.execute(
                select(DBUserResponse).where(
                    DBUserResponse.session_id == self.session_id,
                    DBUserResponse.question_id == question_id,
                )
            )
            return list(result.scalars().all())

    async def _answer_count(self) -> int:
        async with self.session_factory() as db:
            result = await db.execute(select(func.count(DBUserResponse.id)))
            return int(result.scalar_one())

    def test_resubmitting_a_question_overwrites_the_previous_answer(self) -> None:
        self._post(value=2)
        self._post(value=5)

        answers = self.await_(self._stored_answers(self.scale_question_id))

        self.assertEqual(len(answers), 1)
        self.assertEqual(answers[0].value, 5)

    def test_scale_answer_above_range_is_rejected(self) -> None:
        response = self._post(value=9999)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.await_(self._answer_count()), 0)

    def test_scale_answer_below_range_is_rejected(self) -> None:
        response = self._post(value=0)

        self.assertEqual(response.status_code, 422)

    def test_choice_answer_outside_declared_options_is_rejected(self) -> None:
        response = self._post(question_id=self.choice_question_id, value=7)

        self.assertEqual(response.status_code, 422)

    def test_choice_answer_matching_a_declared_option_is_accepted(self) -> None:
        response = self._post(question_id=self.choice_question_id, value=2)

        self.assertEqual(response.status_code, 200)

    def test_answer_for_unknown_question_is_rejected(self) -> None:
        response = self._post(question_id=999999)

        self.assertEqual(response.status_code, 404)

    def test_answers_are_refused_once_the_session_is_completed(self) -> None:
        response = self._post(session_id=self.completed_session_id)

        self.assertEqual(response.status_code, 409)

    def test_negative_reaction_time_is_rejected(self) -> None:
        response = self._post(reaction_time_ms=-5)

        self.assertEqual(response.status_code, 422)
