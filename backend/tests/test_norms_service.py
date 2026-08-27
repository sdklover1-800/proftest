from unittest import TestCase

from app.services.norms_service import (
    NormSource,
    percentile_for,
    percentiles_for_profile,
)


class NormsServiceTest(TestCase):
    """
    A raw percentage says nothing on its own: 66 on Realistic is only
    meaningful next to what everyone else scores. Every reported number is
    therefore positioned against a reference distribution.
    """

    def test_a_score_at_the_reference_median_lands_mid_scale(self) -> None:
        # The provisional median for Realistic is 55.
        result = percentile_for("RIASEC", "Realistic", 55)

        self.assertGreaterEqual(result.percentile, 45)
        self.assertLessEqual(result.percentile, 55)

    def test_a_score_well_above_the_median_lands_high(self) -> None:
        result = percentile_for("RIASEC", "Investigative", 85)

        self.assertGreater(result.percentile, 80)

    def test_a_score_well_below_the_median_lands_low(self) -> None:
        result = percentile_for("RIASEC", "Investigative", 20)

        self.assertLess(result.percentile, 20)

    def test_percentiles_stay_inside_the_scale(self) -> None:
        for raw in (0, 100):
            result = percentile_for("BIG5", "Openness", raw)
            self.assertGreaterEqual(result.percentile, 1)
            self.assertLessEqual(result.percentile, 99)

    def test_reference_norms_declare_that_they_are_provisional(self) -> None:
        # Nothing has been collected yet, so the app must not present these as
        # norms measured on its own population.
        result = percentile_for("RIASEC", "Realistic", 66)

        self.assertEqual(result.source, NormSource.provisional)
        self.assertIsNotNone(result.median)

    def test_an_unknown_scale_reports_no_norm_rather_than_inventing_one(self) -> None:
        result = percentile_for("RIASEC", "Не существует", 66)

        self.assertIsNone(result.percentile)
        self.assertEqual(result.source, NormSource.none)

    def test_a_whole_profile_is_positioned_scale_by_scale(self) -> None:
        scores = {
            "RIASEC": {"Realistic": 66, "Investigative": 78},
            "BIG5": {"Openness": 74},
            "COGNITIVE": {"total_score": 58, "details": {"logic": 80}},
        }

        positioned = percentiles_for_profile(scores)

        self.assertIn("RIASEC", positioned)
        self.assertEqual(
            set(positioned["RIASEC"].keys()), {"Realistic", "Investigative"}
        )
        self.assertIsNotNone(positioned["RIASEC"]["Investigative"]["percentile"])
        self.assertIsNotNone(positioned["RIASEC"]["Investigative"]["median"])

    def test_the_stronger_of_two_scales_gets_the_higher_percentile(self) -> None:
        low = percentile_for("BIG5", "Conscientiousness", 40)
        high = percentile_for("BIG5", "Conscientiousness", 80)

        self.assertLess(low.percentile, high.percentile)

    def test_the_cognitive_total_is_not_listed_beside_its_own_parts(self) -> None:
        # Reporting the aggregate as a peer of the scales it averages reads as
        # a sixth cognitive skill and double-counts the same evidence.
        positioned = percentiles_for_profile(
            {"COGNITIVE": {"total_score": 58, "details": {"logic": 80, "attention": 44}}}
        )

        self.assertNotIn("total_score", positioned["COGNITIVE"])
        self.assertEqual(set(positioned["COGNITIVE"]), {"logic", "attention"})
