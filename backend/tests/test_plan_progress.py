from app.models.assessment import AssessmentSession
from app.models.user import User
from app.services.weekly_plan_service import weekly_plan_service
from tests.test_support import AsyncDatabaseTestCase


class PlanProgressTest(AsyncDatabaseTestCase):
    async def test_plan_progress_and_idempotent_done_status(self) -> None:
        async with self.session_factory() as db:
            user = User(email="plan@example.com", hashed_password="x", is_superuser=False)
            db.add(user)
            await db.flush()

            run = AssessmentSession(
                user_id=user.id,
                raw_scores={"RIASEC": {"realistic": 61}, "BIG5": {"openness": 64}},
            )
            db.add(run)
            await db.commit()

            plan = await weekly_plan_service.create_plan(
                db=db,
                user_id=user.id,
                run_id=run.id,
                title="Test weekly plan",
                goal="Validate progress and idempotency",
                selected_rec_ids=["rec_ci_baseline"],
                evidence_refs={"metrics": ["ev_1"]},
            )
            self.assertIn("progress", plan)
            self.assertIn("today_day_index", plan)
            self.assertFalse(plan.get("is_completed"))

            await weekly_plan_service.set_task_status(
                db=db,
                user_id=user.id,
                plan_id=plan["plan_id"],
                task_id="t1_ci_setup",
                status="done",
            )
            first_state = await weekly_plan_service.get_plan(db, plan["plan_id"], user.id)
            self.assertIsNotNone(first_state)
            first_done_at = None
            for day in first_state["days"]:
                for task in day["tasks"]:
                    if task["task_id"] == "t1_ci_setup":
                        first_done_at = task.get("done_at")
                        self.assertEqual(task["status"], "done")
            self.assertIsNotNone(first_done_at)

            await weekly_plan_service.set_task_status(
                db=db,
                user_id=user.id,
                plan_id=plan["plan_id"],
                task_id="t1_ci_setup",
                status="done",
            )
            second_state = await weekly_plan_service.get_plan(db, plan["plan_id"], user.id)
            self.assertIsNotNone(second_state)
            second_done_at = None
            for day in second_state["days"]:
                for task in day["tasks"]:
                    if task["task_id"] == "t1_ci_setup":
                        second_done_at = task.get("done_at")
            self.assertEqual(first_done_at, second_done_at)

            progress_after_done = await weekly_plan_service.get_progress(db, plan["plan_id"], user.id)
            self.assertIsNotNone(progress_after_done)
            self.assertEqual(progress_after_done["done_tasks"], 1)
            self.assertGreater(progress_after_done["total_tasks"], 1)
            self.assertEqual(progress_after_done["completion_percent"], progress_after_done["progress"]["progress_percent"])

            await weekly_plan_service.set_task_status(
                db=db,
                user_id=user.id,
                plan_id=plan["plan_id"],
                task_id="t1_ci_setup",
                status="todo",
            )
            progress_after_reset = await weekly_plan_service.get_progress(db, plan["plan_id"], user.id)
            self.assertIsNotNone(progress_after_reset)
            self.assertEqual(progress_after_reset["done_tasks"], 0)
            self.assertFalse(progress_after_reset["is_completed"])

