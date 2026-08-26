from sqlalchemy import select

from app.api.deps import get_current_superuser
from app.models.question import ModuleEnum, Question, QuestionTypeEnum
from app.models.user import User
from main import app
from tests.test_api_support import ApiTestCase

SJT_OPTIONS = [
    {"text": "Составлю план", "value": 2},
    {"text": "Начну с простой", "value": 1},
    {"text": "Возьму срочную на глаз", "value": 0},
]


class AdminQuestionEditingTest(ApiTestCase):
    """
    Option weights are the answer key and the admin panel is the only place
    they can be edited by hand — so an edit must never silently drop them.
    """

    def setUp(self) -> None:
        super().setUp()
        self.await_(self._seed())

        async def override_superuser() -> User:
            return self.admin

        app.dependency_overrides[get_current_superuser] = override_superuser

    async def _seed(self) -> None:
        async with self.session_factory() as db:
            admin = User(email="admin@example.com", hashed_password="x", is_superuser=True)
            question = Question(
                code="SJT_001",
                module=ModuleEnum.SJT,
                category="self_organization",
                text_ru="Несколько задач с одним дедлайном",
                type=QuestionTypeEnum.choice,
                options=SJT_OPTIONS,
            )
            db.add_all([admin, question])
            await db.commit()

            self.admin = admin
            self.question_id = question.id

    async def _stored_options(self) -> list | None:
        async with self.session_factory() as db:
            result = await db.execute(
                select(Question.options).where(Question.id == self.question_id)
            )
            return result.scalar_one()

    def _edit(self, **extra):
        body = {
            "code": "SJT_001",
            "module": "SJT",
            "category": "self_organization",
            "type": "choice",
            "text_ru": "Несколько задач с одним дедлайном. Что сделаете?",
            "is_reverse": False,
        }
        body.update(extra)
        return self.client.put(f"/api/v1/admin/questions/{self.question_id}", json=body)

    def test_editing_the_wording_keeps_the_options(self) -> None:
        response = self._edit()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.await_(self._stored_options()), SJT_OPTIONS)

    def test_options_can_still_be_replaced_explicitly(self) -> None:
        replacement = [{"text": "Новый вариант", "value": 2}, {"text": "Другой", "value": 0}]

        response = self._edit(options=replacement)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.await_(self._stored_options()), replacement)

    def test_listed_questions_expose_their_options_for_editing(self) -> None:
        response = self.client.get("/api/v1/admin/questions")

        self.assertEqual(response.status_code, 200)
        listed = next(
            q for q in response.json()["questions"] if q["code"] == "SJT_001"
        )
        self.assertEqual(listed["options"], SJT_OPTIONS)
