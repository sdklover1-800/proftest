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
            "RIASEC": {"R": 10, "I": 12, ...},
            "BIG5": {"Openness": 15, "Conscientiousness": 20, ...}
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
    counts = {}  # Track max possible score (question count * 5)

    print(f"--- CALCULATING FOR SESSION {session_id} ---")
    print(f"Found {len(rows)} answers in DB")

    for response, question in rows:
        # Initialize module dict if not exists
        if question.module.value not in scores:
            scores[question.module.value] = {}
            counts[question.module.value] = {}

        # Initialize category score if not exists
        category = question.category
        if category not in scores[question.module.value]:
            scores[question.module.value][category] = 0
            counts[question.module.value][category] = 0

        # 2. Apply reverse scoring logic
        # Constraint: Values are 1-5 (Likert scale)
        if question.is_reverse:
            final_value = 6 - response.value
        else:
            final_value = response.value

        # 3. Sum scores and track counts
        scores[question.module.value][category] += final_value
        counts[question.module.value][category] += 5  # Max score per question is 5

    # 4. Normalize to 0-100 scale
    for module in scores:
        for category in scores[module]:
            raw_score = scores[module][category]
            max_possible = counts[module][category]
            
            if max_possible > 0:
                percentage = (raw_score / max_possible) * 100
                scores[module][category] = int(round(percentage))
                print(f"Category {category}: Raw Score = {raw_score}/{max_possible} ({scores[module][category]}%)")
            else:
                scores[module][category] = 0
                print(f"Category {category}: NO DATA (0%)")

    return scores
