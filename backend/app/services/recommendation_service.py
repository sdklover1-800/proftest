
from app.services.rules_data import RECOMMENDATION_RULES


class RecommendationService:
    """
    Service to generate advice based on assessment scores.
    """

    def generate_recommendations(self, scores: dict) -> list[dict]:
        """
        Evaluates the user's scores against defined rules.

        Args:
            scores (dict): The calculated scores (e.g., {"RIASEC": {"R": 20...}}).

        Returns:
            list: A list of recommendations, each with 'text' and 'tags'.
        """
        recommendations = []

        for rule_key, rule_data in RECOMMENDATION_RULES.items():
            condition_func = rule_data.get("condition")

            # Safely evaluate condition
            try:
                if condition_func and condition_func(scores):
                    recommendations.append(
                        {
                            "key": rule_key,
                            "text": rule_data["text"],
                            "tags": rule_data["tags"],
                        }
                    )
            except Exception as e:
                # Log error but don't crash recommendation flow
                print(f"Error evaluating rule {rule_key}: {e}")

        return recommendations


recommendation_service = RecommendationService()
