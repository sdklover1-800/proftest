from unittest import TestCase

from app.services.career_matching_service import match_careers

HANDS_ON_ANALYST = {
    "RIASEC": {
        "Realistic": 66,
        "Investigative": 78,
        "Artistic": 61,
        "Social": 54,
        "Enterprising": 48,
        "Conventional": 44,
    },
    "BIG5": {"Openness": 74, "Conscientiousness": 68, "Extraversion": 45},
    "COGNITIVE": {"total_score": 68, "details": {"logic": 80, "working_memory": 71}},
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
    "BIG5": {"Openness": 45, "Conscientiousness": 55, "Extraversion": 92},
    "COGNITIVE": {"total_score": 45, "details": {"logic": 44, "working_memory": 50}},
    "SJT": {"self_organization": 50, "teamwork": 84},
}


class CareerMatchingTest(TestCase):
    """
    The person came to find out what work suits them. That answer has to be
    derived from their scores, be different for different people, and be able
    to say why — the same input must always produce the same output.
    """

    def test_two_opposite_profiles_do_not_get_the_same_answer(self) -> None:
        analyst = {m["career_id"] for m in match_careers(HANDS_ON_ANALYST)}
        social = {m["career_id"] for m in match_careers(PEOPLE_PERSON)}

        self.assertTrue(analyst)
        self.assertTrue(social)
        self.assertNotEqual(analyst, social)

    def test_an_investigative_practical_profile_leads_with_technical_work(self) -> None:
        top = match_careers(HANDS_ON_ANALYST)[0]

        # The assertion is about the technical cluster, not one job title:
        # high Investigative plus logic 80 legitimately reaches any of these.
        self.assertIn(
            top["career_id"],
            {"engineer_technologist", "data_analyst", "software_developer", "researcher"},
        )

    def test_a_social_enterprising_profile_leads_with_people_work(self) -> None:
        top = match_careers(PEOPLE_PERSON)[0]

        self.assertIn(top["career_id"], {"teacher", "sales_manager", "hr_specialist"})

    def test_matches_come_back_strongest_first(self) -> None:
        matches = match_careers(HANDS_ON_ANALYST)

        scores = [m["match"] for m in matches]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_a_match_is_a_percentage(self) -> None:
        for match in match_careers(HANDS_ON_ANALYST):
            self.assertGreaterEqual(match["match"], 0)
            self.assertLessEqual(match["match"], 100)

    def test_every_match_names_the_scales_it_rests_on(self) -> None:
        top = match_careers(HANDS_ON_ANALYST)[0]

        self.assertTrue(top["evidence"], "a match with no evidence cannot be explained")
        for item in top["evidence"]:
            self.assertIn("label", item)
            self.assertIn("value", item)

    def test_the_same_profile_always_gives_the_same_answer(self) -> None:
        first = match_careers(HANDS_ON_ANALYST)
        second = match_careers(HANDS_ON_ANALYST)

        self.assertEqual(first, second)

    def test_an_empty_profile_yields_nothing_rather_than_a_guess(self) -> None:
        self.assertEqual(match_careers({}), [])

    def test_the_number_of_matches_can_be_limited(self) -> None:
        self.assertEqual(len(match_careers(HANDS_ON_ANALYST, limit=2)), 2)
