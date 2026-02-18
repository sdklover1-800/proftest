from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import AssessmentSession
from app.models.planning import UserProfileAggregate
from app.services.psychometrics_service import (
    build_signals,
    compute_measurement_confidence,
    compute_stability_score,
    history_weights,
)


def _merge_module_scores_weighted(
    totals: dict[str, dict[str, float]],
    weight_sums: dict[str, dict[str, float]],
    module_key: str,
    values: dict[str, Any] | None,
    weight: float,
) -> None:
    if not isinstance(values, dict):
        return
    totals.setdefault(module_key, {})
    weight_sums.setdefault(module_key, {})

    for key, value in values.items():
        if not isinstance(value, (int, float)):
            continue
        str_key = str(key)
        totals[module_key][str_key] = totals[module_key].get(str_key, 0.0) + float(value) * weight
        weight_sums[module_key][str_key] = weight_sums[module_key].get(str_key, 0.0) + weight


def _finalize_module_scores(
    totals: dict[str, dict[str, float]],
    weight_sums: dict[str, dict[str, float]],
) -> dict[str, dict[str, int]]:
    result: dict[str, dict[str, int]] = {}
    for module_key, values in totals.items():
        module_result: dict[str, int] = {}
        for key, total in values.items():
            divisor = weight_sums.get(module_key, {}).get(key, 0.0)
            if divisor <= 0.0:
                continue
            module_result[key] = int(round(total / divisor))
        if module_result:
            result[module_key] = module_result
    return result


def _session_sort_key(session: AssessmentSession) -> tuple[datetime, int]:
    start_time = session.start_time
    if isinstance(start_time, datetime):
        return start_time, int(session.id or 0)
    return datetime.min.replace(tzinfo=timezone.utc), int(session.id or 0)


class ProfileAggregateService:
    async def rebuild_user_aggregate(
        self,
        db: AsyncSession,
        user_id: int,
        sessions: list[AssessmentSession] | None = None,
    ) -> dict[str, Any]:
        if sessions is None:
            result = await db.execute(
                select(AssessmentSession)
                .where(AssessmentSession.user_id == user_id)
                .order_by(AssessmentSession.start_time.desc(), AssessmentSession.id.desc())
            )
            sessions = list(result.scalars().all())

        completed_sessions = [session for session in sessions if session.raw_scores]
        completed_sessions.sort(key=_session_sort_key, reverse=True)
        tests_count = len(completed_sessions)
        weights = history_weights(tests_count)

        module_totals: dict[str, dict[str, float]] = {}
        module_weight_sums: dict[str, dict[str, float]] = {}
        cognitive_total_sum = 0.0
        cognitive_total_weight = 0.0

        for idx, session in enumerate(completed_sessions):
            weight = weights[idx] if idx < len(weights) else 0.0
            if weight <= 0.0:
                continue
            scores = session.raw_scores or {}
            _merge_module_scores_weighted(
                module_totals,
                module_weight_sums,
                "RIASEC",
                scores.get("RIASEC"),
                weight,
            )
            _merge_module_scores_weighted(
                module_totals,
                module_weight_sums,
                "BIG5",
                scores.get("BIG5"),
                weight,
            )
            _merge_module_scores_weighted(
                module_totals,
                module_weight_sums,
                "SJT",
                scores.get("SJT"),
                weight,
            )

            cognitive = scores.get("COGNITIVE")
            if isinstance(cognitive, dict):
                total_score = cognitive.get("total_score")
                if isinstance(total_score, (int, float)):
                    cognitive_total_sum += float(total_score) * weight
                    cognitive_total_weight += weight
                _merge_module_scores_weighted(
                    module_totals,
                    module_weight_sums,
                    "COGNITIVE_DETAILS",
                    cognitive.get("details"),
                    weight,
                )

        normalized_modules = _finalize_module_scores(module_totals, module_weight_sums)
        aggregated_scores: dict[str, Any] = {}

        if "RIASEC" in normalized_modules:
            aggregated_scores["RIASEC"] = normalized_modules["RIASEC"]
        if "BIG5" in normalized_modules:
            aggregated_scores["BIG5"] = normalized_modules["BIG5"]
        if "SJT" in normalized_modules:
            aggregated_scores["SJT"] = normalized_modules["SJT"]

        cognitive_payload: dict[str, Any] = {}
        if cognitive_total_weight > 0.0:
            cognitive_payload["total_score"] = int(round(cognitive_total_sum / cognitive_total_weight))
        if "COGNITIVE_DETAILS" in normalized_modules:
            cognitive_payload["details"] = normalized_modules["COGNITIVE_DETAILS"]
        if cognitive_payload:
            aggregated_scores["COGNITIVE"] = cognitive_payload

        stability_score = compute_stability_score(
            [session.raw_scores or {} for session in completed_sessions[:5]]
        )
        latest_quality = {}
        if completed_sessions and isinstance(completed_sessions[0].raw_scores, dict):
            latest_quality = (completed_sessions[0].raw_scores or {}).get("QUALITY") or {}

        consistency_score = float(latest_quality.get("consistency_score", 70.0) or 70.0)
        response_time_quality = float(latest_quality.get("response_time_quality", 70.0) or 70.0)
        test_length_factor = float(latest_quality.get("test_length_factor", 70.0) or 70.0)
        measurement_confidence = compute_measurement_confidence(
            consistency_score=consistency_score,
            response_time_quality=response_time_quality,
            repeatability_score=stability_score,
            test_length_factor=test_length_factor,
        )

        quality_payload = {
            "consistency_score": int(round(max(0.0, min(100.0, consistency_score)))),
            "response_time_quality": int(round(max(0.0, min(100.0, response_time_quality)))),
            "repeatability_score": int(round(max(0.0, min(100.0, stability_score)))),
            "stability_score": int(round(max(0.0, min(100.0, stability_score)))),
            "test_length_factor": int(round(max(0.0, min(100.0, test_length_factor)))),
            "measurement_confidence": int(round(max(0.0, min(100.0, measurement_confidence)))),
            "history_weights": [round(weight, 4) for weight in weights],
        }
        aggregated_scores["QUALITY"] = quality_payload
        aggregated_scores["SIGNALS"] = build_signals(aggregated_scores)

        row = await db.get(UserProfileAggregate, user_id)
        if row:
            row.tests_count = tests_count
            row.aggregated_scores_json = aggregated_scores
        else:
            row = UserProfileAggregate(
                user_id=user_id,
                tests_count=tests_count,
                aggregated_scores_json=aggregated_scores,
            )
            db.add(row)

        await db.commit()
        await db.refresh(row)

        return {
            "user_id": user_id,
            "tests_count": tests_count,
            "scores": aggregated_scores,
            "quality": quality_payload,
            "stability_score": quality_payload["stability_score"],
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }


profile_aggregate_service = ProfileAggregateService()
