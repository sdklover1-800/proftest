from datetime import datetime, timezone
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.api import deps
from app.api.v1.endpoints import results as results_endpoint
from app.db.session import get_db
from app.models.user import User
from main import app


class ProfileDashboardContractTest(TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

        async def override_current_user() -> User:
            return User(
                id=1,
                email="user@example.com",
                hashed_password="x",
                is_superuser=False,
            )

        async def override_db():
            yield object()

        app.dependency_overrides[deps.get_current_user] = override_current_user
        app.dependency_overrides[get_db] = override_db

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_profile_dashboard_contract_shape(self) -> None:
        session = SimpleNamespace(
            id=42,
            start_time=datetime(2026, 2, 17, 12, 0, 0, tzinfo=timezone.utc),
            context_data={"sleep": 7, "stress": "medium", "mood": "neutral"},
            raw_scores={
                "RIASEC": {"realistic": 70, "investigative": 75},
                "BIG5": {"openness": 78, "conscientiousness": 74},
                "SJT": {"teamwork": 66, "stress": 62},
                "COGNITIVE": {
                    "total_score": 68,
                    "details": {"logic": 72, "attention": 64},
                },
            },
        )
        aggregate_payload = {
            "user_id": 1,
            "tests_count": 6,
            "scores": session.raw_scores,
            "updated_at": "2026-02-17T12:00:00+00:00",
        }
        recommendations = [
            {"key": "rec_ci_baseline", "text": "Add CI gate", "week": 1, "tags": ["testing"]}
        ]
        ai_insights = {
            "summary": "Strong engineering base with clear growth path.",
            "strengths": ["Analytical reasoning is strong."],
            "growth_areas": ["Testing is below target."],
            "next_steps": ["Add CI and integration tests."],
            "recommended_paths": [],
        }
        evidence_refs = {
            "summary": ["ev_1"],
            "strengths": ["ev_1"],
            "weaknesses": ["ev_2"],
            "recommendations": ["ev_3"],
            "metrics": ["ev_1", "ev_2"],
            "progress": ["ev_1"],
        }
        snapshot = {
            "run_id": session.id,
            "input_hash": "hash_123",
            "versions": {
                "ruleset_version": "ruleset@2026-02-17",
                "scoring_model_version": "scoring@v1.1",
                "llm_text_version": "llm-text@v1.0",
            },
        }

        with (
            patch.object(
                results_endpoint.assessment_service,
                "get_user_history",
                AsyncMock(return_value=[session]),
            ),
            patch.object(
                results_endpoint.profile_aggregate_service,
                "rebuild_user_aggregate",
                AsyncMock(return_value=aggregate_payload),
            ),
            patch.object(
                results_endpoint.recommendation_service,
                "generate_recommendations",
                return_value=recommendations,
            ),
            patch.object(
                results_endpoint.ai_insights_service,
                "generate",
                AsyncMock(return_value=ai_insights),
            ),
            patch.object(
                results_endpoint.evidence_service,
                "register_assessment_evidence",
                AsyncMock(return_value=evidence_refs),
            ),
            patch.object(
                results_endpoint.run_snapshot_service,
                "upsert_snapshot",
                AsyncMock(return_value=snapshot),
            ),
        ):
            response = self.client.get("/api/v1/profile/dashboard")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["session_id"], 42)
        self.assertIn("run_created_at", body)
        self.assertIn("dashboard", body)

        dashboard = body["dashboard"]
        self.assertIn("versions", dashboard)
        self.assertIn("blocks", dashboard)
        self.assertIn("aggregate", dashboard)
        self.assertIsInstance(dashboard["blocks"], list)
        self.assertGreater(len(dashboard["blocks"]), 0)

        required_content = {
            "summary_card": {"headline", "bullets", "cta"},
            "analysis_card": {"strengths", "weaknesses", "recommendations"},
            "insight_list": {"items"},
            "radar": {"axes", "benchmark", "ai_note"},
            "skill_bars": {"items"},
            "metrics": {"items"},
            "recommendation_buckets": {"buckets"},
            "progress_timeline": {"ai_note", "items"},
            "action_card": {"headline", "description", "cta"},
        }
        for block in dashboard["blocks"]:
            self.assertIn("block_id", block)
            self.assertIn("type", block)
            self.assertIn("title", block)
            self.assertIn("content", block)
            block_type = block["type"]
            if block_type in required_content:
                content = block["content"]
                for key in required_content[block_type]:
                    self.assertIn(key, content)
