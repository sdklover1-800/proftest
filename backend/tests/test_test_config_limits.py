from unittest import TestCase

from fastapi import HTTPException

from app.core.test_config_limits import (
    DEFAULT_LIMIT_BY_FIELD,
    build_recommendation_warnings,
    estimate_total_minutes,
    predict_quality,
    validate_hard_limits_or_422,
)


class TestConfigLimitsTest(TestCase):
    def test_default_profile_is_good_quality(self) -> None:
        self.assertEqual(predict_quality(dict(DEFAULT_LIMIT_BY_FIELD)), "good")

    def test_estimated_time_for_default_profile(self) -> None:
        self.assertEqual(estimate_total_minutes(dict(DEFAULT_LIMIT_BY_FIELD)), 22)

    def test_validate_hard_limits_raises_for_excess(self) -> None:
        with self.assertRaises(HTTPException) as ctx:
            validate_hard_limits_or_422(
                {
                    **DEFAULT_LIMIT_BY_FIELD,
                    "riasec_limit": 61,
                }
            )
        self.assertEqual(ctx.exception.status_code, 422)

    def test_validate_hard_limits_raises_for_below_minimum(self) -> None:
        with self.assertRaises(HTTPException) as ctx:
            validate_hard_limits_or_422(
                {
                    **DEFAULT_LIMIT_BY_FIELD,
                    "riasec_limit": 20,
                }
            )
        self.assertEqual(ctx.exception.status_code, 422)

    def test_recommendation_warnings_for_outside_recommended_range(self) -> None:
        warnings = build_recommendation_warnings(
            {
                **DEFAULT_LIMIT_BY_FIELD,
                "big5_limit": 20,
                "sjt_limit": 14,
            }
        )
        self.assertGreaterEqual(len(warnings), 2)
        self.assertTrue(any("BIG5" in warning for warning in warnings))
        self.assertTrue(any("SJT" in warning for warning in warnings))

    def test_quality_prediction_too_short_and_fatigue(self) -> None:
        too_short = predict_quality(
            {
                **DEFAULT_LIMIT_BY_FIELD,
                "riasec_limit": 15,
            }
        )
        fatigue = predict_quality(
            {
                **DEFAULT_LIMIT_BY_FIELD,
                "sjt_limit": 20,
            }
        )
        self.assertEqual(too_short, "too_short")
        self.assertEqual(fatigue, "fatigue_risk")
