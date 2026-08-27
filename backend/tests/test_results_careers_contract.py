from sqlalchemy import select

from app.models.assessment import AssessmentSession, AssessmentStatusEnum
from app.models.user import User
from tests.test_api_support import ApiTestCase

FINISHED_SCORES = {
    "RIASEC": {
        "Realistic": 66,
        "Investigative": 78,
        "Artistic": 61,
        "Social": 54,
        "Enterprising": 48,
        "Conventional": 44,
    },
    "BIG5": {"Openness": 74, "Conscientiousness": 68, "Extraversion": 45},
    "COGNITIVE": {"total_score": 68, "details": {"logic": 80, "working_memory": 71}},
    "SJT": {"self_organization": 72, "teamwork": 66},
    "QUALITY": {"measurement_confidence": 74},
}


class ResultsCareersContractTest(ApiTestCase):
    """
    The result screen leads with the work a profile points at, and shows every
    score against the norm — so the API has to carry both.
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

            session = AssessmentSession(
                user_id=owner.id,
                status=AssessmentStatusEnum.completed,
                raw_scores=FINISHED_SCORES,
            )
            db.add(session)
            await db.commit()

            self.owner = owner
            self.session_id = session.id

    def _results(self) -> dict:
        response = self.client.get(f"/api/v1/assessment/{self.session_id}/results")
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_results_lead_with_matching_careers(self) -> None:
        careers = self._results().get("careers")

        self.assertTrue(careers, "the screen has nothing to lead with")
        top = careers[0]
        self.assertIn("title", top)
        self.assertIn("match", top)
        self.assertIn("summary", top)

    def test_each_career_can_say_what_it_rests_on(self) -> None:
        top = self._results()["careers"][0]

        self.assertTrue(top["evidence"])
        for item in top["evidence"]:
            self.assertIn("label", item)
            self.assertIn("value", item)

    def test_every_score_is_reported_against_a_norm(self) -> None:
        norms = self._results().get("norms")

        self.assertIn("RIASEC", norms)
        investigative = norms["RIASEC"]["Investigative"]
        self.assertEqual(investigative["raw"], 78)
        self.assertIsNotNone(investigative["percentile"])
        self.assertIsNotNone(investigative["median"])

    def test_norms_say_they_are_provisional_rather_than_measured(self) -> None:
        # Presenting starting values as this app's own norms would be a lie.
        norms = self._results()["norms"]

        self.assertEqual(norms["RIASEC"]["Realistic"]["source"], "provisional")

    def test_an_unfinished_run_offers_no_careers(self) -> None:
        empty_id = self.await_(self._add_unfinished_session())

        response = self.client.get(f"/api/v1/assessment/{empty_id}/results")

        self.assertEqual(response.status_code, 400)

    async def _add_unfinished_session(self) -> int:
        async with self.session_factory() as db:
            result = await db.execute(select(User).where(User.id == self.owner.id))
            owner = result.scalar_one()
            session = AssessmentSession(
                user_id=owner.id, status=AssessmentStatusEnum.started, raw_scores={}
            )
            db.add(session)
            await db.commit()
            return session.id
