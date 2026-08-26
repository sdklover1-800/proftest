from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.models.question import ModuleEnum, Question, QuestionTypeEnum
from app.models.user import User
from tests.test_api_support import ApiTestCase


class AssessmentAuthorizationTest(ApiTestCase):
    """
    Answers and results belong to the user who produced them.
    Anonymous callers must not be able to read or write them.
    """

    def setUp(self) -> None:
        super().setUp()
        self.await_(self._seed())

    async def _seed(self) -> None:
        async with self.session_factory() as db:
            owner = User(email="owner@example.com", hashed_password="x")
            stranger = User(email="stranger@example.com", hashed_password="x")
            db.add_all([owner, stranger])
            await db.flush()

            question = Question(
                code="R_001",
                module=ModuleEnum.RIASEC,
                category="Realistic",
                text_ru="Мне нравится работать руками",
                type=QuestionTypeEnum.scale,
            )
            db.add(question)

            session = AssessmentSession(
                user_id=owner.id,
                status=AssessmentStatusEnum.started,
                raw_scores={},
            )
            db.add(session)
            await db.commit()

            self.owner = owner
            self.stranger = stranger
            self.question_id = question.id
            self.session_id = session.id

    def _answer(self, **overrides) -> dict:
        payload = {
            "session_id": self.session_id,
            "question_id": self.question_id,
            "value": 4,
            "reaction_time_ms": 1200,
        }
        payload.update(overrides)
        return payload

    def test_submit_rejects_anonymous_caller(self) -> None:
        self.authenticate_as_nobody()

        response = self.client.post("/api/v1/assessment/submit", json=self._answer())

        self.assertEqual(response.status_code, 401)

    def test_submit_rejects_answer_into_someone_elses_session(self) -> None:
        self.authenticate_as(self.stranger)

        response = self.client.post("/api/v1/assessment/submit", json=self._answer())

        self.assertEqual(response.status_code, 403)

    def test_submit_accepts_answer_from_session_owner(self) -> None:
        self.authenticate_as(self.owner)

        response = self.client.post("/api/v1/assessment/submit", json=self._answer())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["value"], 4)

    def test_finish_rejects_anonymous_caller(self) -> None:
        self.authenticate_as_nobody()

        response = self.client.post(f"/api/v1/assessment/{self.session_id}/finish")

        self.assertEqual(response.status_code, 401)

    def test_finish_rejects_someone_elses_session(self) -> None:
        self.authenticate_as(self.stranger)

        response = self.client.post(f"/api/v1/assessment/{self.session_id}/finish")

        self.assertEqual(response.status_code, 403)


class QuestionBankExposureTest(ApiTestCase):
    """The item bank is the product; anonymous callers must not be able to read it."""

    def test_full_question_bank_rejects_anonymous_caller(self) -> None:
        self.authenticate_as_nobody()

        response = self.client.get("/questions")

        self.assertEqual(response.status_code, 401)

    def test_assessment_questions_reject_anonymous_caller(self) -> None:
        self.authenticate_as_nobody()

        response = self.client.get("/api/v1/assessment/questions")

        self.assertEqual(response.status_code, 401)
