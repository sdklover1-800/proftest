from __future__ import annotations

from typing import Literal

from fastapi import HTTPException, status

ModuleKey = Literal["RIASEC", "BIG5", "COGNITIVE", "SJT"]
ConfigFieldKey = Literal["riasec_limit", "big5_limit", "cognitive_limit", "sjt_limit"]
QualityPrediction = Literal["good", "acceptable", "too_short", "fatigue_risk"]


TEST_LIMITS: dict[ModuleKey, dict[str, int]] = {
    "RIASEC": {
        "hard_min": 36,
        "recommended_min": 30,
        "recommended_max": 48,
        "optimal_min": 36,
        "optimal_max": 42,
        "default": 36,
        "hard_max": 60,
        "avg_seconds_per_item": 11,
    },
    "BIG5": {
        "hard_min": 30,
        "recommended_min": 25,
        "recommended_max": 40,
        "optimal_min": 30,
        "optimal_max": 35,
        "default": 30,
        "hard_max": 50,
        "avg_seconds_per_item": 9,
    },
    "COGNITIVE": {
        "hard_min": 12,
        "recommended_min": 10,
        "recommended_max": 18,
        "optimal_min": 12,
        "optimal_max": 15,
        "default": 12,
        "hard_max": 25,
        "avg_seconds_per_item": 30,
    },
    "SJT": {
        "hard_min": 8,
        "recommended_min": 6,
        "recommended_max": 12,
        "optimal_min": 8,
        "optimal_max": 10,
        "default": 8,
        "hard_max": 15,
        "avg_seconds_per_item": 35,
    },
}

FIELD_TO_MODULE: dict[ConfigFieldKey, ModuleKey] = {
    "riasec_limit": "RIASEC",
    "big5_limit": "BIG5",
    "cognitive_limit": "COGNITIVE",
    "sjt_limit": "SJT",
}

DEFAULT_LIMIT_BY_MODULE: dict[ModuleKey, int] = {
    module_key: int(spec["default"]) for module_key, spec in TEST_LIMITS.items()
}
MIN_LIMIT_BY_MODULE: dict[ModuleKey, int] = {
    module_key: int(spec["hard_min"]) for module_key, spec in TEST_LIMITS.items()
}

DEFAULT_LIMIT_BY_FIELD: dict[ConfigFieldKey, int] = {
    field_key: DEFAULT_LIMIT_BY_MODULE[module_key]
    for field_key, module_key in FIELD_TO_MODULE.items()
}
MIN_LIMIT_BY_FIELD: dict[ConfigFieldKey, int] = {
    field_key: MIN_LIMIT_BY_MODULE[module_key]
    for field_key, module_key in FIELD_TO_MODULE.items()
}


def normalize_config_values(config_values: dict[str, int]) -> dict[ConfigFieldKey, int]:
    normalized: dict[ConfigFieldKey, int] = {}
    for field_key in FIELD_TO_MODULE:
        raw_value = config_values.get(field_key, DEFAULT_LIMIT_BY_FIELD[field_key])
        normalized[field_key] = max(int(raw_value), 0)
    return normalized


def enforce_hard_minimums(config_values: dict[str, int]) -> dict[ConfigFieldKey, int]:
    normalized = normalize_config_values(config_values)
    for field_key in FIELD_TO_MODULE:
        normalized[field_key] = max(normalized[field_key], MIN_LIMIT_BY_FIELD[field_key])
    return normalized


def validate_hard_limits_or_422(config_values: dict[str, int]) -> None:
    normalized = normalize_config_values(config_values)
    violations: list[str] = []

    for field_key, value in normalized.items():
        module_key = FIELD_TO_MODULE[field_key]
        hard_min = int(TEST_LIMITS[module_key]["hard_min"])
        hard_max = int(TEST_LIMITS[module_key]["hard_max"])
        if value < hard_min:
            violations.append(
                f"{field_key}={value} is below hard_min={hard_min} for {module_key}"
            )
        if value > hard_max:
            violations.append(
                f"{field_key}={value} exceeds hard_max={hard_max} for {module_key}"
            )

    if violations:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "message": "One or more module limits are outside hard boundaries.",
                "violations": violations,
            },
        )


def build_recommendation_warnings(config_values: dict[str, int]) -> list[str]:
    normalized = normalize_config_values(config_values)
    warnings: list[str] = []

    for field_key, value in normalized.items():
        module_key = FIELD_TO_MODULE[field_key]
        limits = TEST_LIMITS[module_key]
        rec_min = int(limits["recommended_min"])
        rec_max = int(limits["recommended_max"])

        if value < rec_min:
            warnings.append(
                f"{module_key}: {value} is below recommended range {rec_min}-{rec_max}. "
                "Accuracy confidence may decrease."
            )
        elif value > rec_max:
            warnings.append(
                f"{module_key}: {value} is above recommended range {rec_min}-{rec_max}. "
                "User fatigue risk may increase."
            )

    return warnings


def estimate_total_minutes(config_values: dict[str, int]) -> int:
    normalized = normalize_config_values(config_values)
    total_seconds = 0

    for field_key, value in normalized.items():
        module_key = FIELD_TO_MODULE[field_key]
        avg_seconds_per_item = int(TEST_LIMITS[module_key]["avg_seconds_per_item"])
        total_seconds += value * avg_seconds_per_item

    return max(round(total_seconds / 60), 1)


def predict_quality(config_values: dict[str, int]) -> QualityPrediction:
    normalized = normalize_config_values(config_values)

    has_too_short = False
    has_fatigue_risk = False
    has_outside_recommended = False

    for field_key, value in normalized.items():
        module_key = FIELD_TO_MODULE[field_key]
        limits = TEST_LIMITS[module_key]
        rec_min = int(limits["recommended_min"])
        rec_max = int(limits["recommended_max"])

        if value < round(rec_min * 0.7):
            has_too_short = True
        if value > round(rec_max * 1.3):
            has_fatigue_risk = True
        if value < rec_min or value > rec_max:
            has_outside_recommended = True

    if has_too_short:
        return "too_short"
    if has_fatigue_risk:
        return "fatigue_risk"
    if has_outside_recommended:
        return "acceptable"
    return "good"


def get_limits_meta() -> dict[ModuleKey, dict[str, int]]:
    return {module_key: dict(spec) for module_key, spec in TEST_LIMITS.items()}
