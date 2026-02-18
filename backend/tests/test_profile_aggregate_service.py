from datetime import datetime, timezone

from app.models.assessment import AssessmentSession
from app.models.user import User
from app.services.profile_aggregate_service import profile_aggregate_service
from tests.test_support import AsyncDatabaseTestCase


class ProfileAggregateServiceTest(AsyncDatabaseTestCase):
    async def test_rebuild_user_aggregate_uses_weighted_history_and_quality(self) -> None:
        async with self.session_factory() as db:
            user = User(email="aggregate@example.com", hashed_password="x", is_superuser=False)
            db.add(user)
            await db.flush()

            session_a = AssessmentSession(
                user_id=user.id,
                start_time=datetime(2026, 2, 10, 10, 0, tzinfo=timezone.utc),
                raw_scores={
                    "RIASEC": {"realistic": 60, "investigative": 80},
                    "BIG5": {"openness": 70},
                    "SJT": {"teamwork": 50},
                    "COGNITIVE": {"total_score": 40, "details": {"logic": 30}},
                },
            )
            session_b = AssessmentSession(
                user_id=user.id,
                start_time=datetime(2026, 2, 17, 10, 0, tzinfo=timezone.utc),
                raw_scores={
                    "RIASEC": {"realistic": 80, "investigative": 60},
                    "BIG5": {"openness": 90},
                    "SJT": {"teamwork": 70},
                    "COGNITIVE": {"total_score": 60, "details": {"logic": 50}},
                },
            )
            db.add(session_a)
            db.add(session_b)
            await db.commit()

            aggregate = await profile_aggregate_service.rebuild_user_aggregate(db, user.id)

            self.assertEqual(aggregate["tests_count"], 2)
            self.assertEqual(aggregate["scores"]["RIASEC"]["realistic"], 73)
            self.assertEqual(aggregate["scores"]["RIASEC"]["investigative"], 67)
            self.assertEqual(aggregate["scores"]["BIG5"]["openness"], 83)
            self.assertEqual(aggregate["scores"]["SJT"]["teamwork"], 63)
            self.assertEqual(aggregate["scores"]["COGNITIVE"]["total_score"], 53)
            self.assertEqual(aggregate["scores"]["COGNITIVE"]["details"]["logic"], 43)
            self.assertIn("QUALITY", aggregate["scores"])
            self.assertIn("SIGNALS", aggregate["scores"])
            self.assertEqual(aggregate["scores"]["QUALITY"]["stability_score"], 80)
            self.assertEqual(aggregate["scores"]["QUALITY"]["measurement_confidence"], 73)
