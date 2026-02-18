from collections import defaultdict
from statistics import median

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import UserResponse
from app.models.question import Question
from app.services.psychometrics_service import (
    build_signals,
    compute_consistency_score,
    compute_measurement_confidence,
    compute_response_time_quality,
    compute_straightline_risk,
    compute_test_length_factor,
)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _to_percentage(raw_score: float, max_possible: float) -> int:
    if max_possible <= 0:
        return 0
    return int(round((raw_score / max_possible) * 100))


def _accuracy_percentage(correct: int, total: int) -> int:
    if total <= 0:
        return 0
    return int(round((correct / total) * 100))


async def calculate_score(session_id: int, db: AsyncSession) -> dict:
    result = await db.execute(
        select(UserResponse, Question)
        .join(Question, UserResponse.question_id == Question.id)
        .where(UserResponse.session_id == session_id)
    )
    rows = result.all()

    module_scores: dict[str, dict[str, float]] = {}
    module_max_scores: dict[str, dict[str, float]] = {}
    sjt_scores: dict[str, float] = {}
    sjt_max_scores: dict[str, float] = {}

    grouped_answers: dict[str, list[float]] = defaultdict(list)
    answer_values: list[float] = []
    reaction_times: list[int] = []

    speed_total = 0
    speed_correct = 0
    speed_rts: list[int] = []

    wm_total = 0
    wm_correct = 0

    attention_go_total = 0
    attention_hits = 0
    attention_nogo_total = 0
    attention_false_alarms = 0
    attention_rts: list[int] = []

    logic_total = 0
    logic_correct = 0

    for response, question in rows:
        module = question.module.value
        category = question.category or "general"
        value = int(response.value)
        rt_ms = response.reaction_time_ms
        if isinstance(rt_ms, int) and rt_ms > 0:
            reaction_times.append(rt_ms)

        if module in {"RIASEC", "BIG5"}:
            if module not in module_scores:
                module_scores[module] = {}
                module_max_scores[module] = {}
            if category not in module_scores[module]:
                module_scores[module][category] = 0.0
                module_max_scores[module][category] = 0.0

            final_value = 6 - value if question.is_reverse else value
            module_scores[module][category] += float(final_value)
            module_max_scores[module][category] += 5.0
            grouped_answers[f"{module}.{category}"].append(float(final_value))
            answer_values.append(float(final_value))
            continue

        if module == "SJT":
            if category not in sjt_scores:
                sjt_scores[category] = 0.0
                sjt_max_scores[category] = 0.0

            if question.type and question.type.value == "scale":
                sjt_value = 6 - value if question.is_reverse else value
                sjt_scores[category] += float(sjt_value)
                sjt_max_scores[category] += 5.0
                grouped_answers[f"SJT.{category}"].append(float(sjt_value))
            else:
                # Choice SJT is treated as ordinal 0..2 and normalized independently.
                sjt_choice = int(max(0, min(value, 2)))
                sjt_scores[category] += float(sjt_choice)
                sjt_max_scores[category] += 2.0
                grouped_answers[f"SJT.{category}"].append(1.0 + float(sjt_choice) * 2.0)
            answer_values.append(float(value))
            continue

        if module == "COGNITIVE":
            question_code = question.code or ""

            if question_code.startswith(("COG_A_", "COG_B_", "COG_C_", "COG_D_")):
                speed_total += 1
                if value == 1:
                    speed_correct += 1
                if isinstance(rt_ms, int) and rt_ms > 0:
                    speed_rts.append(rt_ms)
            elif question_code.startswith("COG_MEM_"):
                wm_total += 1
                if value == 1:
                    wm_correct += 1
            elif question_code.startswith("COG_GO_"):
                combined_text = " ".join(
                    filter(None, [question.text_ru, question.text_kz, question.text_en])
                ).lower()
                is_nogo = "🔴" in combined_text or "red" in combined_text or "красн" in combined_text or "қызыл" in combined_text

                if is_nogo:
                    attention_nogo_total += 1
                    if value == 0:
                        attention_false_alarms += 1
                else:
                    attention_go_total += 1
                    if value == 1:
                        attention_hits += 1
                        if isinstance(rt_ms, int) and rt_ms > 0:
                            attention_rts.append(rt_ms)
            else:
                logic_total += 1
                if value == 1:
                    logic_correct += 1

    normalized_scores: dict[str, dict] = {}

    for module, categories in module_scores.items():
        normalized_scores[module] = {}
        for category, raw_score in categories.items():
            max_possible = module_max_scores[module][category]
            normalized_scores[module][category] = _to_percentage(raw_score, max_possible)

    if sjt_scores:
        normalized_scores["SJT"] = {}
        for category, raw_score in sjt_scores.items():
            normalized_scores["SJT"][category] = _to_percentage(
                raw_score,
                sjt_max_scores.get(category, 0.0),
            )

    cognitive_details: dict[str, int] = {}
    cognitive_components: list[int] = []

    if speed_total > 0:
        speed_accuracy_pct = _accuracy_percentage(speed_correct, speed_total)
        speed_median_rt_ms = float(median(speed_rts)) if speed_rts else None
        if speed_median_rt_ms is None:
            speed_factor = 0.5
        else:
            speed_factor = _clamp((3500.0 - speed_median_rt_ms) / (3500.0 - 600.0), 0.0, 1.0)
        speed_score = int(round(speed_accuracy_pct * 0.7 + speed_factor * 100.0 * 0.3))
        cognitive_details["processing_speed"] = int(_clamp(float(speed_score), 0.0, 100.0))
        cognitive_components.append(cognitive_details["processing_speed"])

    if wm_total > 0:
        wm_score = _accuracy_percentage(wm_correct, wm_total)
        cognitive_details["working_memory"] = wm_score
        cognitive_components.append(wm_score)

    if attention_go_total + attention_nogo_total > 0:
        hits_pct = (attention_hits / attention_go_total * 100.0) if attention_go_total > 0 else 0.0
        false_alarm_pct = (
            attention_false_alarms / attention_nogo_total * 100.0
            if attention_nogo_total > 0
            else 0.0
        )
        control_index = _clamp(hits_pct - false_alarm_pct, 0.0, 100.0)
        if attention_rts:
            attention_rt_quality = _clamp((2500.0 - float(median(attention_rts))) / 2000.0, 0.0, 1.0)
            attention_score = int(round(control_index * 0.85 + attention_rt_quality * 100.0 * 0.15))
        else:
            attention_score = int(round(control_index))
        cognitive_details["attention"] = int(_clamp(float(attention_score), 0.0, 100.0))
        cognitive_components.append(cognitive_details["attention"])

    if logic_total > 0:
        logic_score = _accuracy_percentage(logic_correct, logic_total)
        cognitive_details["logic"] = logic_score
        cognitive_components.append(logic_score)

    if cognitive_components:
        total_score = int(round(sum(cognitive_components) / len(cognitive_components)))
        normalized_scores["COGNITIVE"] = {
            "total_score": int(_clamp(float(total_score), 0.0, 100.0)),
            "details": cognitive_details,
        }

    consistency_raw = compute_consistency_score(grouped_answers)
    straightline_risk = compute_straightline_risk(answer_values)
    consistency_score = _clamp(consistency_raw - straightline_risk * 0.45, 0.0, 100.0)
    response_time_quality = _clamp(
        compute_response_time_quality(reaction_times) - straightline_risk * 0.2,
        0.0,
        100.0,
    )
    test_length_factor = compute_test_length_factor(len(rows))
    repeatability_score = 70.0
    measurement_confidence = compute_measurement_confidence(
        consistency_score=consistency_score,
        response_time_quality=response_time_quality,
        repeatability_score=repeatability_score,
        test_length_factor=test_length_factor,
    )

    quality_payload = {
        "consistency_score": int(round(consistency_score)),
        "response_time_quality": int(round(response_time_quality)),
        "repeatability_score": int(round(repeatability_score)),
        "test_length_factor": int(round(test_length_factor)),
        "straightline_risk": int(round(straightline_risk)),
        "measurement_confidence": int(round(measurement_confidence)),
        "answer_count": len(rows),
        "median_reaction_time_ms": int(round(float(median(reaction_times)))) if reaction_times else None,
    }
    normalized_scores["QUALITY"] = quality_payload
    normalized_scores["SIGNALS"] = build_signals(normalized_scores)

    return normalized_scores
