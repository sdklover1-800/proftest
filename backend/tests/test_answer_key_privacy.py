from sqlalchemy import select

from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.models.assessment import UserResponse as DBUserResponse
from app.models.question import ModuleEnum, Question, QuestionTypeEnum
from app.models.user import User
from tests.test_api_support import ApiTestCase

SJT_OPTIONS = [
    {"text": "Составлю план", "value": 2},
    {"text": "Начну с простой", "value": 1},
    {"text": "Возьму срочную на глаз", "value": 0},
    {"text": "Как получится", "value": 0},
]
GO_OPTIONS = [{"text": "НАЖАТЬ (PRESS)", "value": 1}, {"text": "ПРОПУСТИТЬ (SKIP)", "value": 0}]
NO_GO_OPTIONS = [{"text": "НАЖАТЬ (PRESS)", "value": 0}, {"text": "ПРОПУСТИТЬ (SKIP)", "value": 1}]
COMPARE_OPTIONS = [{"text": "Совпадают", "value": 1}, {"text": "Не совпадают", "value": 0}]


class AnswerKeyPrivacyTest(ApiTestCase):
    """
    A test of ability stops measuring ability the moment the client can see
    which option is worth a point. Options go out without their weights, the
    client answers with the position it picked, and the server does the rest.
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

            questions = {
                "sjt": Question(
                    code="SJT_001",
                    module=ModuleEnum.SJT,
                    category="self_organization",
                    text_ru="Несколько задач с одним дедлайном",
                    type=QuestionTypeEnum.choice,
                    options=SJT_OPTIONS,
                ),
                "go": Question(
                    code="COG_GO_001",
                    module=ModuleEnum.COGNITIVE,
                    category="attention",
                    text_ru="Стимул: 🟢 (Зеленый)",
                    type=QuestionTypeEnum.choice,
                    options=GO_OPTIONS,
                ),
                "no_go": Question(
                    code="COG_GO_003",
                    module=ModuleEnum.COGNITIVE,
                    category="attention",
                    text_ru="Стимул: 🔴 (Красный)",
                    type=QuestionTypeEnum.choice,
                    options=NO_GO_OPTIONS,
                ),
                "compare": Question(
                    code="COG_A_01",
                    module=ModuleEnum.COGNITIVE,
                    category="attention",
                    text_ru="Сравните символы: ▲ и ▲",
                    type=QuestionTypeEnum.choice,
                    options=COMPARE_OPTIONS,
                ),
            }
            db.add_all(list(questions.values()))

            session = AssessmentSession(
                user_id=owner.id, status=AssessmentStatusEnum.started, raw_scores={}
            )
            db.add(session)
            await db.commit()

            self.owner = owner
            self.session_id = session.id
            self.question_ids = {key: q.id for key, q in questions.items()}

    def _answer(self, key: str, **payload):
        body = {"session_id": self.session_id, "question_id": self.question_ids[key]}
        body.update(payload)
        return self.client.post("/api/v1/assessment/submit", json=body)

    async def _stored_value(self, key: str) -> int:
        async with self.session_factory() as db:
            result = await db.execute(
                select(DBUserResponse.value).where(
                    DBUserResponse.session_id == self.session_id,
                    DBUserResponse.question_id == self.question_ids[key],
                )
            )
            return int(result.scalar_one())

    def test_served_options_carry_no_weights(self) -> None:
        response = self.client.get("/api/v1/assessment/questions")

        self.assertEqual(response.status_code, 200)
        served = [q for q in response.json() if q.get("options")]
        self.assertTrue(served, "expected the fixture's choice questions to be served")
        for question in served:
            for option in question["options"]:
                self.assertNotIn("value", option)
                self.assertIn("text", option)

    def test_chosen_position_is_stored_as_that_option_s_weight(self) -> None:
        self._answer("sjt", value=0)

        self.assertEqual(self.await_(self._stored_value("sjt")), 2)

    def test_a_later_position_scores_what_that_option_is_worth(self) -> None:
        # Position 2 is worth nothing; reading it as a weight would score 2.
        self._answer("sjt", value=2)

        self.assertEqual(self.await_(self._stored_value("sjt")), 0)

    def test_position_past_the_last_option_is_rejected(self) -> None:
        response = self._answer("sjt", value=7)

        self.assertEqual(response.status_code, 422)

    def test_negative_position_is_rejected(self) -> None:
        response = self._answer("sjt", value=-1)

        self.assertEqual(response.status_code, 422)

    def test_running_out_of_time_on_a_no_go_stimulus_counts_as_a_correct_hold(
        self,
    ) -> None:
        self._answer("no_go", value=0, timed_out=True)

        self.assertEqual(self.await_(self._stored_value("no_go")), 1)

    def test_running_out_of_time_on_a_go_stimulus_counts_as_a_missed_press(self) -> None:
        self._answer("go", value=0, timed_out=True)

        self.assertEqual(self.await_(self._stored_value("go")), 0)

    def test_running_out_of_time_elsewhere_earns_nothing(self) -> None:
        self._answer("compare", value=0, timed_out=True)

        self.assertEqual(self.await_(self._stored_value("compare")), 0)

    def test_the_saved_answer_does_not_report_what_it_scored(self) -> None:
        # Echoing the weight back would let a client resubmit a cognitive item
        # until the response confirmed a point — the answer key, one try at a time.
        response = self._answer("compare", value=0)

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("value", response.json())
