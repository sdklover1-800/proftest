from unittest import TestCase

from app.services.psychometrics_service import (
    build_signals,
    compute_adjusted_readiness,
    compute_measurement_confidence,
    compute_stability_score,
    history_weights,
)


class PsychometricsServiceTest(TestCase):
    def test_history_weights_sum_to_one(self) -> None:
        weights = history_weights(5)
        self.assertEqual(len(weights), 5)
        self.assertAlmostEqual(sum(weights), 1.0, places=6)
        self.assertAlmostEqual(weights[0], 0.6, places=6)
        self.assertAlmostEqual(weights[1], 0.3, places=6)

    def test_stability_is_high_for_close_profiles_and_lower_for_drift(self) -> None:
        stable_history = [
            {"RIASEC": {"realistic": 72}, "BIG5": {"openness": 65}},
            {"RIASEC": {"realistic": 70}, "BIG5": {"openness": 66}},
            {"RIASEC": {"realistic": 71}, "BIG5": {"openness": 64}},
        ]
        drifting_history = [
            {"RIASEC": {"realistic": 90}, "BIG5": {"openness": 85}},
            {"RIASEC": {"realistic": 40}, "BIG5": {"openness": 35}},
            {"RIASEC": {"realistic": 20}, "BIG5": {"openness": 15}},
        ]
        stable_score = compute_stability_score(stable_history)
        drifting_score = compute_stability_score(drifting_history)
        self.assertGreater(stable_score, 85)
        self.assertLess(drifting_score, stable_score)

    def test_measurement_confidence_formula(self) -> None:
        confidence = compute_measurement_confidence(
            consistency_score=80,
            response_time_quality=70,
            repeatability_score=90,
            test_length_factor=60,
        )
        self.assertEqual(confidence, 79.0)

    def test_build_signals_normalizes_scores(self) -> None:
        scores = {
            "RIASEC": {"realistic": 80},
            "BIG5": {"openness": 65},
            "SJT": {"teamwork": 70},
            "COGNITIVE": {"total_score": 60, "details": {"logic": 55}},
        }
        signals = build_signals(scores)
        self.assertEqual(signals["riasec.realistic"], 0.8)
        self.assertEqual(signals["big5.openness"], 0.65)
        self.assertEqual(signals["cognitive.total_score"], 0.6)
        self.assertEqual(signals["cognitive.logic"], 0.55)

    def test_adjusted_readiness_uses_stability(self) -> None:
        self.assertEqual(compute_adjusted_readiness(70, 100), 70)
        self.assertEqual(compute_adjusted_readiness(70, 50), 60)
