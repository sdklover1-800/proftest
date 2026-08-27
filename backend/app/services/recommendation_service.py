from app.services.norms_service import percentile_for
from app.services.rules_data import RECOMMENDATION_RULES

#: A scale counts as a standout only well clear of the middle. The previous
#: cut-points were raw sums (>= 15, >= 20) carried over to a 0..100 reporting
#: scale, so nearly every rule fired for nearly everyone — two opposite
#: profiles came back with the same eleven recommendations.
HIGH_PERCENTILE = 70
LOW_PERCENTILE = 30


class RecommendationService:
    """
    Service to generate advice based on assessment scores.
    Recommendations are organized into a 4-week development plan.
    """

    def _scale_percentile(self, scores: dict, module: str, scale: str) -> int | None:
        """Where this person sits on one scale, or None if they did not answer it."""
        values = scores.get(module)
        if not isinstance(values, dict):
            return None

        raw = values.get(scale)
        if raw is None and isinstance(values.get("details"), dict):
            raw = values["details"].get(scale)
        if not isinstance(raw, (int, float)):
            return None

        return percentile_for(module, scale, raw).percentile

    def _band_applies(self, scores: dict, rule: dict) -> bool:
        percentile = self._scale_percentile(scores, rule["module"], rule["scale"])
        # A scale the run never measured says nothing, so it advises nothing.
        if percentile is None:
            return False

        if rule["band"] == "high":
            return percentile >= HIGH_PERCENTILE
        return percentile <= LOW_PERCENTILE

    def generate_recommendations(self, scores: dict) -> list[dict]:
        """
        Evaluates the user's scores against defined rules.

        Rules come in two shapes: most name a single scale and the end of it
        they speak to, and are resolved against norms; a few express a
        combination and carry their own condition.

        Args:
            scores (dict): The calculated scores (e.g., {"RIASEC": {"Realistic": 66}}).

        Returns:
            list: A list of recommendations, each with 'text', 'tags', and 'week'.
        """
        # Nothing measured, nothing to advise — otherwise the unconditional
        # rules fire on an empty run.
        if not scores:
            return []

        recommendations = []

        for rule_key, rule_data in RECOMMENDATION_RULES.items():
            try:
                if "band" in rule_data:
                    applies = self._band_applies(scores, rule_data)
                else:
                    condition_func = rule_data.get("condition")
                    applies = bool(condition_func and condition_func(scores))
            except Exception as e:
                # A broken rule must not take the whole result down with it.
                print(f"Error evaluating rule {rule_key}: {e}")
                continue

            if applies:
                recommendations.append(
                    {
                        "key": rule_key,
                        "text": rule_data["text"],
                        "tags": rule_data["tags"],
                        "week": rule_data.get("week", 1),
                    }
                )

        recommendations.sort(key=lambda r: (r["week"], r["key"]))
        return recommendations


recommendation_service = RecommendationService()
