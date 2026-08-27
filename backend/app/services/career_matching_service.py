"""
Turning a profile into the work it points at.

The person came to find out what suits them, so this is the answer the result
screen leads with. Three properties matter more than sophistication:

* it must DIFFER between people — the previous rule engine returned the same
  eleven recommendations to opposite profiles, which is the same as returning
  nothing;
* it must be EXPLAINABLE — every match names the scales it rested on;
* it must be STABLE — the same profile always gives the same answer, which
  rules out asking a language model.

Scores are compared against norms rather than used raw: how a person scores
relative to everyone else is what carries the signal.
"""

from app.services.career_data import CAREERS, Career
from app.services.norms_service import percentile_for

#: Below this a match is not worth showing — the profile simply does not point
#: this way, and a low number invites the reader to take it seriously anyway.
MIN_MATCH = 35

#: How many scales a match may cite as its grounds.
MAX_EVIDENCE = 3


def _scale_value(scores: dict, module: str, scale: str) -> float | None:
    """The person's standing on one scale, as a percentile."""
    values = (scores or {}).get(module)
    if not isinstance(values, dict):
        return None

    raw = values.get(scale)
    if raw is None and isinstance(values.get("details"), dict):
        raw = values["details"].get(scale)
    if not isinstance(raw, (int, float)):
        return None

    placed = percentile_for(module, scale, raw)
    # Without a reference the raw percentage is the best available stand-in.
    return float(placed.percentile if placed.percentile is not None else raw)


def _score_career(scores: dict, career: Career) -> tuple[int, list[dict]] | None:
    """
    How well a profile fits one career, plus what that rests on.

    Each requirement contributes its weight scaled by how far the person sits
    from the middle of the scale. A negative weight inverts that, which is how
    a career expresses what it is not about.
    """
    total_weight = 0.0
    earned = 0.0
    contributions: list[tuple[float, dict]] = []

    for requirement in career["requirements"]:
        value = _scale_value(scores, requirement["module"], requirement["scale"])
        if value is None:
            continue

        weight = requirement["weight"]
        # A percentile of 50 is neutral; 100 is a full match for a positive
        # requirement and a full mismatch for a negative one.
        alignment = value / 100.0 if weight > 0 else 1.0 - (value / 100.0)

        magnitude = abs(weight)
        total_weight += magnitude
        earned += magnitude * alignment

        contributions.append(
            (
                magnitude * alignment,
                {
                    "label": requirement["label"],
                    "value": int(round(value)),
                    "supports": weight > 0,
                },
            )
        )

    if total_weight == 0:
        return None

    match = int(round((earned / total_weight) * 100))

    # Cite the requirements that actually carried the match, strongest first.
    contributions.sort(key=lambda item: item[0], reverse=True)
    evidence = [item[1] for item in contributions[:MAX_EVIDENCE]]

    return match, evidence


def match_careers(scores: dict, limit: int = 3) -> list[dict]:
    """
    Careers this profile points at, strongest first.

    Returns an empty list when the profile carries nothing to match on — an
    unfinished run should show no answer rather than a hedged one.
    """
    if not scores:
        return []

    matches: list[dict] = []
    for career in CAREERS:
        scored = _score_career(scores, career)
        if scored is None:
            continue

        match, evidence = scored
        if match < MIN_MATCH:
            continue

        matches.append(
            {
                "career_id": career["career_id"],
                "title": career["title"],
                "summary": career["summary"],
                "match": match,
                "evidence": evidence,
            }
        )

    # career_id breaks ties so the order never depends on dictionary iteration.
    matches.sort(key=lambda m: (-m["match"], m["career_id"]))
    return matches[:limit]
