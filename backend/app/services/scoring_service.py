from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import UserResponse
from app.models.question import Question


async def calculate_score(session_id: int, db: AsyncSession) -> dict:
    """
    Calculates the assessment score for a given session.

    Formula:
    1. Fetch all UserResponse items for the session, joined with Question.
    2. Iterate through responses:
       - If Question.is_reverse is True: score = 6 - response.value
       - Else: score = response.value
    3. Sum scores grouped by Module and Category.

    Returns:
        dict: A dictionary containing scores for each module and category.
        Example:
        {
            "RIASEC": {"R": 80, "I": 60},
            "BIG5": {"Openness": 70, "Conscientiousness": 55},
            "SJT": {"teamwork": 75, "stress": 50},
            "COGNITIVE": {"total_score": 85, "details": {"logic": 100, "math": 50}}
        }
    """
    # 1. Fetch responses with questions
    result = await db.execute(
        select(UserResponse, Question)
        .join(Question, UserResponse.question_id == Question.id)
        .where(UserResponse.session_id == session_id)
    )
    rows = result.all()

    scores = {}
    counts = {}  # Track max possible score (question count * 5) for RIASEC/BIG5
    sjt_scores = {}
    sjt_counts = {}  # Track max possible score (question count * 2) for SJT
    speed_total = 0
    speed_correct = 0
    speed_rts = []

    wm_total = 0
    wm_correct = 0

    attention_go_total = 0
    attention_hits = 0
    attention_nogo_total = 0
    attention_false_alarms = 0
    attention_rts = []

    logic_total = 0
    logic_correct = 0

    print(f"--- CALCULATING FOR SESSION {session_id} ---")
    print(f"Found {len(rows)} answers in DB")

    for response, question in rows:
        module = question.module.value
        category = question.category or "general"

        # RIASEC / BIG5: Likert 1-5 with reverse scoring
        if module in {"RIASEC", "BIG5"}:
            if module not in scores:
                scores[module] = {}
                counts[module] = {}

            if category not in scores[module]:
                scores[module][category] = 0
                counts[module][category] = 0

            if question.is_reverse:
                final_value = 6 - response.value
            else:
                final_value = response.value

            scores[module][category] += final_value
            counts[module][category] += 5

        # SJT: choice (max 2) or scale (max 5)
        elif module == "SJT":
            if category not in sjt_scores:
                sjt_scores[category] = 0
                sjt_counts[category] = 0

            if question.type and question.type.value == "scale":
                sjt_value = 6 - response.value if question.is_reverse else response.value
                sjt_scores[category] += sjt_value
                sjt_counts[category] += 5
            else:
                sjt_value = min(max(response.value, 0), 2)
                sjt_scores[category] += sjt_value
                sjt_counts[category] += 2

        # COGNITIVE: Accuracy scoring (correct == 1)
        elif module == "COGNITIVE":
            question_code = question.code or ""
            rt_ms = response.reaction_time_ms

            if question_code.startswith(("COG_A_", "COG_B_", "COG_C_", "COG_D_")):
                speed_total += 1
                if response.value == 1:
                    speed_correct += 1
                if rt_ms:
                    speed_rts.append(rt_ms)
            elif question_code.startswith("COG_MEM_"):
                wm_total += 1
                if response.value == 1:
                    wm_correct += 1
            elif question_code.startswith("COG_GO_"):
                combined_text = " ".join(
                    filter(None, [question.text_ru, question.text_kz, question.text_en])
                )
                is_nogo = "🔴" in combined_text or "red" in combined_text.lower() or "красн" in combined_text.lower() or "қызыл" in combined_text.lower()

                if is_nogo:
                    attention_nogo_total += 1
                    if response.value == 0:
                        attention_false_alarms += 1
                else:
                    attention_go_total += 1
                    if response.value == 1:
                        attention_hits += 1
                        if rt_ms:
                            attention_rts.append(rt_ms)
            elif question_code.startswith("COG_LOG_"):
                logic_total += 1
                if response.value == 1:
                    logic_correct += 1
            else:
                logic_total += 1
                if response.value == 1:
                    logic_correct += 1

    def to_percentage(raw_score: int, max_possible: int) -> int:
        if max_possible <= 0:
            return 0
        return int(round((raw_score / max_possible) * 100))

    def accuracy_percentage(correct: int, total: int) -> int:
        if total <= 0:
            return 0
        return int(round((correct / total) * 100))

    def median(values: list[int]) -> float | None:
        if not values:
            return None
        sorted_vals = sorted(values)
        mid = len(sorted_vals) // 2
        if len(sorted_vals) % 2 == 0:
            return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2
        return float(sorted_vals[mid])

    # 4. Normalize to 0-100 scale and shape output
    normalized_scores = {}

    for module in scores:
        normalized_scores[module] = {}
        for category in scores[module]:
            raw_score = scores[module][category]
            max_possible = counts[module][category]

            normalized_scores[module][category] = to_percentage(raw_score, max_possible)
            print(
                f"Category {category}: Raw Score = {raw_score}/{max_possible} "
                f"({normalized_scores[module][category]}%)"
            )

    if sjt_scores:
        normalized_scores["SJT"] = {}
        for category, raw_score in sjt_scores.items():
            max_possible = sjt_counts.get(category, 0)
            normalized_scores["SJT"][category] = to_percentage(raw_score, max_possible)
            print(
                f"SJT {category}: Raw Score = {raw_score}/{max_possible} "
                f"({normalized_scores['SJT'][category]}%)"
            )

    cognitive_details = {}
    sub_scores = []

    if speed_total > 0:
        speed_accuracy = speed_correct / speed_total
        speed_median_rt_ms = median(speed_rts)
        if speed_median_rt_ms:
            speed_score = min(
                100,
                int(round(speed_accuracy * (1 / max(speed_median_rt_ms / 1000, 0.001)) * 100)),
            )
        else:
            speed_score = accuracy_percentage(speed_correct, speed_total)
        cognitive_details["processing_speed"] = speed_score
        sub_scores.append(speed_score)
        print(
            f"COGNITIVE speed: Correct = {speed_correct}/{speed_total} "
            f"Median RT = {speed_median_rt_ms}ms ({speed_score}%)"
        )

    if wm_total > 0:
        wm_score = accuracy_percentage(wm_correct, wm_total)
        cognitive_details["working_memory"] = wm_score
        sub_scores.append(wm_score)
        print(f"COGNITIVE working_memory: Correct = {wm_correct}/{wm_total} ({wm_score}%)")

    if attention_go_total + attention_nogo_total > 0:
        hits_pct = (attention_hits / attention_go_total * 100) if attention_go_total > 0 else 0
        false_alarm_pct = (
            attention_false_alarms / attention_nogo_total * 100
            if attention_nogo_total > 0
            else 0
        )
        control_index = hits_pct - false_alarm_pct
        attention_score = int(round(max(0, min(100, control_index))))
        cognitive_details["attention"] = attention_score
        sub_scores.append(attention_score)
        print(
            f"COGNITIVE attention: Hits = {attention_hits}/{attention_go_total}, "
            f"False Alarms = {attention_false_alarms}/{attention_nogo_total} "
            f"(Index {attention_score}%)"
        )

    if logic_total > 0:
        logic_score = accuracy_percentage(logic_correct, logic_total)
        cognitive_details["logic"] = logic_score
        sub_scores.append(logic_score)
        print(f"COGNITIVE logic: Correct = {logic_correct}/{logic_total} ({logic_score}%)")

    if sub_scores:
        total_score = int(round(sum(sub_scores) / len(sub_scores)))
        normalized_scores["COGNITIVE"] = {
            "total_score": total_score,
            "details": cognitive_details,
        }
        print(f"COGNITIVE Total: {total_score}%")

    return normalized_scores
