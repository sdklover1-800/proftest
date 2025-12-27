from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.models.assessment import AssessmentSession, UserResponse as DBUserResponse
from app.models.question import Question
from app.schemas.assessment import AssessmentSessionCreate, AnswerCreate, QuestionDTO
from app.repositories.assessment_repository import assessment_repository
from app.services.scoring_service import calculate_score

# repository removed as it is now imported

class AssessmentService:
    """
    Service layer for Assessment business logic.
    """
    async def finish_assessment(self, db: AsyncSession, session_id: int) -> AssessmentSession:
        """
        Calculates scores and finalizes the assessment session.
        """
        # 1. Calculate scores
        results = await calculate_score(session_id, db)
        
        # 2. Update session with results and status
        session = await assessment_repository.update_results(db, session_id, results)
        return session

    async def create_session(self, db: AsyncSession, session_in: AssessmentSessionCreate) -> AssessmentSession:
        return await assessment_repository.create(db, session_in.model_dump(exclude_unset=True))

    async def get_session(self, db: AsyncSession, session_id: int) -> AssessmentSession:
        return await assessment_repository.get_by_id(db, session_id)

    async def get_all_questions(self, db: AsyncSession) -> List[Question]:
        """
        Fetches all questions sorted by ID.
        """
        query = select(Question).order_by(Question.id)
        result = await db.execute(query)
        return result.scalars().all()

    async def save_answer(self, db: AsyncSession, answer_in: AnswerCreate) -> DBUserResponse:
        """
        Saves a single user answer.
        """
        # We could use a generic repository or direct DB add here.
        # Since it's a simple create, we'll do it directly or add a method.
        # Let's keep it simple and safe.
        db_answer = DBUserResponse(
            session_id=answer_in.session_id,
            question_id=answer_in.question_id,
            value=answer_in.value,
            reaction_time_ms=answer_in.reaction_time_ms
        )
        db.add(db_answer)
        await db.commit()
        await db.refresh(db_answer)
        return db_answer

assessment_service = AssessmentService()
