from unittest import TestCase

from app.services.recommendation_service import recommendation_service

HANDS_ON_ANALYST = {
    "RIASEC": {
        "Realistic": 66,
        "Investigative": 78,
        "Artistic": 61,
        "Social": 54,
        "Enterprising": 48,
        "Conventional": 44,
    },
    "BIG5": {"Openness": 74, "Conscientiousness": 68, "Extraversion": 45, "Neuroticism": 38},
    "COGNITIVE": {"total_score": 68, "details": {"logic": 80, "attention": 58}},
    "SJT": {"self_organization": 72, "teamwork": 66},
}

PEOPLE_PERSON = {
    "RIASEC": {
        "Realistic": 22,
        "Investigative": 25,
        "Artistic": 40,
        "Social": 88,
        "Enterprising": 90,
        "Conventional": 60,
    },
    "BIG5": {"Openness": 45, "Conscientiousness": 35, "Extraversion": 92, "Neuroticism": 75},
    "COGNITIVE": {"total_score": 45, "details": {"logic": 44, "attention": 50}},
    "SJT": {"self_organization": 40, "teamwork": 84},
}


class RecommendationDiscriminationTest(TestCase):
    """
    Advice that every profile receives is not advice.

    The rule thresholds were written for raw sums (>= 15, >= 20) while scoring
    reports percentages, so every low-threshold rule fired for everyone: two
    opposite profiles came back with the same eleven recommendations.
    """

    def test_opposite_profiles_do_not_get_the_same_advice(self) -> None:
        analyst = {r["key"] for r in recommendation_service.generate_recommendations(HANDS_ON_ANALYST)}
        social = {r["key"] for r in recommendation_service.generate_recommendations(PEOPLE_PERSON)}

        self.assertTrue(analyst)
        self.assertTrue(social)
        self.assertNotEqual(analyst, social)

    def test_most_advice_is_specific_rather_than_universal(self) -> None:
        analyst = {r["key"] for r in recommendation_service.generate_recommendations(HANDS_ON_ANALYST)}
        social = {r["key"] for r in recommendation_service.generate_recommendations(PEOPLE_PERSON)}

        shared = analyst & social
        smaller = min(len(analyst), len(social))
        self.assertLess(
            len(shared),
            smaller,
            "every rule fires for both profiles, so none of them discriminate",
        )

    def test_a_leading_interest_earns_its_own_advice(self) -> None:
        social = {r["key"] for r in recommendation_service.generate_recommendations(PEOPLE_PERSON)}
        analyst = {r["key"] for r in recommendation_service.generate_recommendations(HANDS_ON_ANALYST)}

        # Social 88 against a median of 61 is a real standout; 54 is not.
        self.assertIn("RIASEC_S_HIGH", social)
        self.assertNotIn("RIASEC_S_HIGH", analyst)

    def test_a_profile_with_no_scores_gets_no_advice(self) -> None:
        self.assertEqual(recommendation_service.generate_recommendations({}), [])
