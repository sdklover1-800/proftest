from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.assessment import UserResponse, AssessmentSession
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

    for response, question in rows:
        # Initialize module dict if not exists
        if question.module.value not in scores:
            scores[question.module.value] = {}
        
        # Initialize category score if not exists
        category = question.category
        if category not in scores[question.module.value]:
            scores[question.module.value][category] = 0
            
        # 2. Apply reverse scoring logic
        # Constraint: Values are 1-5 (Likert scale)
        if question.is_reverse:
            final_value = 6 - response.value
        else:
            final_value = response.value
            
        # 3. Sum scores
        scores[question.module.value][category] += final_value
        
    return scores
