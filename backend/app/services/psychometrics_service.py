from __future__ import annotations

from statistics import mean, median, pstdev
from typing import Any


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _safe_number(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    return None


def flatten_numeric_scores(scores: dict[str, Any] | None) -> dict[str, float]:
    if not isinstance(scores, dict):
        return {}

    flat: dict[str, float] = {}
    for module_key in ("RIASEC", "BIG5", "SJT"):
        module = scores.get(module_key)
        if not isinstance(module, dict):
            continue
        for key, value in module.items():
            numeric = _safe_number(value)
            if numeric is None:
                continue
            flat[f"{module_key.lower()}.{str(key).lower()}"] = numeric

    cognitive = scores.get("COGNITIVE")
    if isinstance(cognitive, dict):
        total_score = _safe_number(cognitive.get("total_score"))
        if total_score is not None:
            flat["cognitive.total_score"] = total_score
        details = cognitive.get("details")
        if isinstance(details, dict):
            for key, value in details.items():
                numeric = _safe_number(value)
                if numeric is None:
                    continue
                flat[f"cognitive.{str(key).lower()}"] = numeric
    return flat


def build_signals(scores: dict[str, Any] | None) -> dict[str, float]:
    flat = flatten_numeric_scores(scores)
    signals: dict[str, float] = {}
    for key, value in flat.items():
        signals[key] = round(_clamp(value / 100.0, 0.0, 1.0), 4)
    return signals


def history_weights(count: int) -> list[float]:
    if count <= 0:
        return []
    if count == 1:
        return [1.0]
    if count == 2:
        total = 0.6 + 0.3
        return [0.6 / total, 0.3 / total]
    older_count = count - 2
    older_weight = 0.1 / older_count
    return [0.6, 0.3, *([older_weight] * older_count)]


def compute_consistency_score(grouped_answers: dict[str, list[float]]) -> float:
    if not grouped_answers:
        return 70.0

    group_scores: list[float] = []
    for values in grouped_answers.values():
        if len(values) < 2:
            continue
        std = pstdev(values)
        # On a 1..5 scale, std in [0..2] is expected.
        score = 100.0 - ((std / 2.0) * 60.0)
        group_scores.append(_clamp(score, 0.0, 100.0))

    if not group_scores:
        return 70.0
    return round(_clamp(mean(group_scores), 0.0, 100.0), 2)


def compute_straightline_risk(answer_values: list[int | float]) -> float:
    if len(answer_values) < 6:
        return 0.0

    total = len(answer_values)
    dominant_count = max(answer_values.count(value) for value in set(answer_values))
    dominant_ratio = dominant_count / total

    max_run = 1
    current_run = 1
    for idx in range(1, total):
        if answer_values[idx] == answer_values[idx - 1]:
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 1
    run_ratio = max_run / total

    dominant_risk = max(0.0, (dominant_ratio - 0.55) / 0.45)
    run_risk = max(0.0, (run_ratio - 0.40) / 0.60)
    risk = max(dominant_risk, run_risk) * 100.0
    return round(_clamp(risk, 0.0, 100.0), 2)


def compute_response_time_quality(reaction_times_ms: list[int]) -> float:
    if not reaction_times_ms:
        return 70.0

    valid_times = [int(value) for value in reaction_times_ms if isinstance(value, int) and value > 0]
    if not valid_times:
        return 70.0

    med = float(median(valid_times))
    too_fast_ratio = sum(1 for value in valid_times if value < 450) / len(valid_times)
    too_slow_ratio = sum(1 for value in valid_times if value > 20000) / len(valid_times)

    if med < 900:
        median_penalty = ((900.0 - med) / 900.0) * 25.0
    elif med > 9000:
        median_penalty = min(20.0, ((med - 9000.0) / 9000.0) * 20.0)
    else:
        median_penalty = 0.0

    fast_penalty = too_fast_ratio * 45.0
    slow_penalty = too_slow_ratio * 25.0
    quality = 100.0 - median_penalty - fast_penalty - slow_penalty
    return round(_clamp(quality, 0.0, 100.0), 2)


def compute_test_length_factor(answer_count: int, expected_min_questions: int = 30) -> float:
    if answer_count <= 0:
        return 20.0
    ratio = _clamp(answer_count / max(expected_min_questions, 1), 0.0, 1.0)
    return round(ratio * 100.0, 2)


def compute_measurement_confidence(
    consistency_score: float,
    response_time_quality: float,
    repeatability_score: float,
    test_length_factor: float,
) -> float:
    value = (
        consistency_score * 0.4
        + response_time_quality * 0.2
        + repeatability_score * 0.3
        + test_length_factor * 0.1
    )
    return round(_clamp(value, 0.0, 100.0), 2)


def _profile_distance(left: dict[str, Any], right: dict[str, Any]) -> float:
    left_flat = flatten_numeric_scores(left)
    right_flat = flatten_numeric_scores(right)
    keys = sorted(set(left_flat) | set(right_flat))
    if not keys:
        return 0.0
    diffs = [abs(left_flat.get(key, 0.0) - right_flat.get(key, 0.0)) / 100.0 for key in keys]
    return float(mean(diffs))


def compute_stability_score(score_history: list[dict[str, Any]]) -> float:
    """
    score_history is expected newest->oldest.
    """
    if len(score_history) < 2:
        return 65.0

    diff_recent = _profile_distance(score_history[0], score_history[1])
    if len(score_history) >= 3:
        diff_previous = _profile_distance(score_history[1], score_history[2])
        weighted_diff = diff_recent * 0.7 + diff_previous * 0.3
    else:
        weighted_diff = diff_recent

    stability = 1.0 - weighted_diff
    return round(_clamp(stability, 0.0, 1.0) * 100.0, 2)


def compute_adjusted_readiness(readiness_score: int, stability_score: float | None) -> int:
    if stability_score is None:
        return int(_clamp(float(readiness_score), 0.0, 100.0))
    factor = 0.7 + 0.3 * _clamp(stability_score / 100.0, 0.0, 1.0)
    adjusted = float(readiness_score) * factor
    return int(round(_clamp(adjusted, 0.0, 100.0)))

