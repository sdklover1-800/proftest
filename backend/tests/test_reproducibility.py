from unittest import TestCase

from app.services.profile_blocks_service import profile_blocks_service
from app.services.run_snapshot_service import _stable_json_hash


class ReproducibilityTest(TestCase):
    def test_stable_hash_for_equivalent_payloads(self) -> None:
        left = {"scores": {"a": 1, "b": 2}, "target_level": "Senior"}
        right = {"target_level": "Senior", "scores": {"b": 2, "a": 1}}
        self.assertEqual(_stable_json_hash(left), _stable_json_hash(right))

    def test_dashboard_is_deterministic_for_same_inputs(self) -> None:
        scores = {
            "RIASEC": {"realistic": 70, "investigative": 73},
            "BIG5": {"openness": 78, "conscientiousness": 74},
            "SJT": {"teamwork": 66, "stress": 62},
            "COGNITIVE": {"total_score": 68, "details": {"logic": 72, "attention": 64}},
        }
        recommendations = [
            {"key": "rec_ci_baseline", "text": "Add CI gate", "week": 1, "tags": ["testing"]},
            {"key": "rec_integration_suite", "text": "Add integration suite", "week": 2, "tags": ["testing"]},
        ]
        ai_insights = {
            "summary": "Strong backend baseline.",
            "strengths": ["Problem solving is strong."],
            "growth_areas": ["Testing needs work."],
            "next_steps": ["Add CI and integration coverage."],
            "recommended_paths": [],
        }
        evidence_refs = {
            "summary": ["ev_1"],
            "strengths": ["ev_1"],
            "weaknesses": ["ev_2"],
            "recommendations": ["ev_3"],
            "metrics": ["ev_1"],
            "progress": ["ev_1"],
        }
        progress = [
            {"date": "2026-02-10", "label": "Run #1", "delta": 0},
            {"date": "2026-02-17", "label": "Run #2", "delta": 3},
        ]

        first = profile_blocks_service.build_dashboard(
            session_id=100,
            scores=scores,
            recommendations=recommendations,
            ai_insights=ai_insights,
            target_role="Backend Engineer",
            target_level="Senior",
            progress=progress,
            evidence_refs=evidence_refs,
        )
        second = profile_blocks_service.build_dashboard(
            session_id=100,
            scores=scores,
            recommendations=recommendations,
            ai_insights=ai_insights,
            target_role="Backend Engineer",
            target_level="Senior",
            progress=progress,
            evidence_refs=evidence_refs,
        )
        self.assertEqual(first, second)

    def test_dashboard_respects_language_for_analysis_blocks(self) -> None:
        scores = {
            "RIASEC": {"realistic": 70, "investigative": 73},
            "BIG5": {"openness": 78, "conscientiousness": 74},
            "SJT": {"teamwork": 66, "stress": 62},
            "COGNITIVE": {"total_score": 68, "details": {"logic": 72, "attention": 64}},
        }
        recommendations = [
            {"key": "rec_ci_baseline", "text": "Add CI gate", "week": 1, "tags": ["testing"]},
        ]
        ai_insights_ru = {
            "summary": "Сильная база и понятные шаги роста.",
            "strengths": ["Хорошая аналитика."],
            "growth_areas": ["Нужно усилить тестирование."],
            "next_steps": ["Добавить CI и интеграционные тесты."],
            "weekly_plan": [],
        }
        ai_insights_kz = {
            "summary": "Негіз мықты, өсу қадамдары анық.",
            "strengths": ["Талдау қабілеті жоғары."],
            "growth_areas": ["Тестілеуді күшейту қажет."],
            "next_steps": ["CI және интеграциялық тесттерді қосыңыз."],
            "weekly_plan": [],
        }

        dashboard_ru = profile_blocks_service.build_dashboard(
            session_id=101,
            scores=scores,
            recommendations=recommendations,
            ai_insights=ai_insights_ru,
            target_role="Backend Engineer",
            target_level="Senior",
            lang="ru",
        )
        dashboard_kz = profile_blocks_service.build_dashboard(
            session_id=102,
            scores=scores,
            recommendations=recommendations,
            ai_insights=ai_insights_kz,
            target_role="Backend Engineer",
            target_level="Senior",
            lang="kz",
        )

        self.assertEqual(dashboard_ru["blocks"][0]["title"], "Вердикт ИИ")
        self.assertEqual(dashboard_kz["blocks"][0]["title"], "AI Қорытынды")

        ru_recommendation = next(
            block
            for block in dashboard_ru["blocks"]
            if block["block_id"] == "recommendations"
        )
        kz_recommendation = next(
            block
            for block in dashboard_kz["blocks"]
            if block["block_id"] == "recommendations"
        )
        self.assertEqual(
            ru_recommendation["content"]["buckets"][0]["items"][0]["title"],
            "Добавить CI и интеграционные тесты.",
        )
        self.assertEqual(
            kz_recommendation["content"]["buckets"][0]["items"][0]["title"],
            "CI және интеграциялық тесттерді қосыңыз.",
        )
