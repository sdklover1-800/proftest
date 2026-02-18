from app.models.assessment import AssessmentSession
from app.models.planning import EvidenceItem
from app.models.user import User
from app.services.evidence_service import evidence_service
from tests.test_support import AsyncDatabaseTestCase


class EvidenceAuthorizationTest(AsyncDatabaseTestCase):
    async def test_evidence_is_scoped_to_owner(self) -> None:
        async with self.session_factory() as db:
            owner = User(email="owner@example.com", hashed_password="x", is_superuser=False)
            stranger = User(email="stranger@example.com", hashed_password="x", is_superuser=False)
            db.add(owner)
            db.add(stranger)
            await db.flush()

            run = AssessmentSession(user_id=owner.id, raw_scores={"RIASEC": {"realistic": 60}})
            db.add(run)
            await db.flush()

            db.add(
                EvidenceItem(
                    evidence_id="ev_owner_1",
                    user_id=owner.id,
                    run_id=run.id,
                    source_type="quiz",
                    locator_json={"run_id": run.id},
                    snippet="Owner-only evidence",
                    confidence=0.8,
                    tags_json=["testing"],
                )
            )
            await db.commit()

            owner_item = await evidence_service.get_one(db, owner.id, "ev_owner_1")
            stranger_item = await evidence_service.get_one(db, stranger.id, "ev_owner_1")
            owner_batch = await evidence_service.get_many(db, owner.id, ["ev_owner_1"])
            stranger_batch = await evidence_service.get_many(db, stranger.id, ["ev_owner_1"])

            self.assertIsNotNone(owner_item)
            self.assertEqual(owner_item["evidence_id"], "ev_owner_1")
            self.assertIsNone(stranger_item)
            self.assertEqual(len(owner_batch), 1)
            self.assertEqual(stranger_batch, [])

