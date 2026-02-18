from collections import Counter
from unittest import TestCase

from app.api.v1.endpoints.assessment import (
    DEFAULT_MODULE_LIMITS,
    _resolve_module_limit,
    _select_balanced_questions,
)


class AssessmentQuestionSelectionTest(TestCase):
    def test_big5_30_produces_six_per_ocean_trait(self) -> None:
        module_groups = {
            "Openness": [("Openness", idx) for idx in range(12)],
            "Conscientiousness": [("Conscientiousness", idx) for idx in range(12)],
            "Extraversion": [("Extraversion", idx) for idx in range(12)],
            "Agreeableness": [("Agreeableness", idx) for idx in range(12)],
            "Neuroticism": [("Neuroticism", idx) for idx in range(12)],
        }

        selected = _select_balanced_questions(module_groups, limit=30)
        counts = Counter(category for category, _ in selected)

        self.assertEqual(len(selected), 30)
        self.assertEqual(len(set(selected)), 30)
        self.assertEqual(counts["Openness"], 6)
        self.assertEqual(counts["Conscientiousness"], 6)
        self.assertEqual(counts["Extraversion"], 6)
        self.assertEqual(counts["Agreeableness"], 6)
        self.assertEqual(counts["Neuroticism"], 6)

    def test_riasec_36_produces_six_per_category(self) -> None:
        module_groups = {
            "R": [("R", idx) for idx in range(12)],
            "I": [("I", idx) for idx in range(12)],
            "A": [("A", idx) for idx in range(12)],
            "S": [("S", idx) for idx in range(12)],
            "E": [("E", idx) for idx in range(12)],
            "C": [("C", idx) for idx in range(12)],
        }

        selected = _select_balanced_questions(module_groups, limit=36)
        counts = Counter(category for category, _ in selected)

        self.assertEqual(len(selected), 36)
        self.assertEqual(len(set(selected)), 36)
        self.assertEqual(counts["R"], 6)
        self.assertEqual(counts["I"], 6)
        self.assertEqual(counts["A"], 6)
        self.assertEqual(counts["S"], 6)
        self.assertEqual(counts["E"], 6)
        self.assertEqual(counts["C"], 6)

    def test_balanced_selection_uses_total_module_limit(self) -> None:
        module_groups = {
            "R": [("R", idx) for idx in range(10)],
            "I": [("I", idx) for idx in range(10)],
            "A": [("A", idx) for idx in range(10)],
            "S": [("S", idx) for idx in range(10)],
        }

        selected = _select_balanced_questions(module_groups, limit=12)

        self.assertEqual(len(selected), 12)
        self.assertEqual(len(set(selected)), len(selected))

        counts = Counter(category for category, _ in selected)
        self.assertLessEqual(max(counts.values()) - min(counts.values()), 1)

    def test_balanced_selection_redistributes_when_category_is_short(self) -> None:
        module_groups = {
            "R": [("R", 0)],
            "I": [("I", idx) for idx in range(6)],
            "A": [("A", idx) for idx in range(6)],
        }

        selected = _select_balanced_questions(module_groups, limit=7)
        counts = Counter(category for category, _ in selected)

        self.assertEqual(len(selected), 7)
        self.assertEqual(counts["R"], 1)
        self.assertLessEqual(abs(counts["I"] - counts["A"]), 1)

    def test_balanced_selection_returns_all_when_limit_exceeds_pool(self) -> None:
        module_groups = {
            "R": [("R", idx) for idx in range(2)],
            "I": [("I", idx) for idx in range(2)],
        }

        selected = _select_balanced_questions(module_groups, limit=10)
        self.assertEqual(len(selected), 4)
        self.assertEqual(len(set(selected)), 4)

    def test_resolve_module_limit_prefers_override_then_config_then_default(self) -> None:
        self.assertEqual(_resolve_module_limit("RIASEC", 20, 15), DEFAULT_MODULE_LIMITS["RIASEC"])
        self.assertEqual(_resolve_module_limit("RIASEC", 20, None), DEFAULT_MODULE_LIMITS["RIASEC"])
        self.assertEqual(_resolve_module_limit("RIASEC", None, None), DEFAULT_MODULE_LIMITS["RIASEC"])
        self.assertEqual(_resolve_module_limit("BIG5", 0, None), DEFAULT_MODULE_LIMITS["BIG5"])
