from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.assessment import AssessmentSession, UserResponse as DBUserResponse
from app.models.question import Question
from app.schemas.assessment import AssessmentSessionCreate, AnswerCreate, QuestionDTO, SessionSummary
from app.repositories.assessment_repository import assessment_repository
from app.services.scoring_service import calculate_score
from app.services.recommendation_service import recommendation_service

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

    async def create_session(self, db: AsyncSession, session_in: AssessmentSessionCreate, user_id: int | None = None) -> AssessmentSession:
        data = session_in.model_dump(exclude_unset=True)
        if user_id:
            data["user_id"] = user_id
        return await assessment_repository.create(db, data)

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
    
    async def get_user_history(self, db: AsyncSession, user_id: int) -> List[AssessmentSession]:
        """
        Fetches all assessment sessions for a specific user, ordered by most recent.
        """
        query = select(AssessmentSession).filter(
            AssessmentSession.user_id == user_id
        ).order_by(AssessmentSession.start_time.desc())
        result = await db.execute(query)
        return result.scalars().all()

    async def get_user_history_summaries(self, db: AsyncSession, user_id: int) -> List[SessionSummary]:
        """
        Fetches user history and transforms it into SessionSummary objects.
        This follows the 'Thin Router' pattern by moving transformation logic here.
        """
        sessions = await self.get_user_history(db, user_id)
        
        summaries = []
        for session in sessions:
            summary = SessionSummary(
                id=session.id,
                date=session.start_time,
                status=session.status,
                top_result=self._get_top_result(session.raw_scores)
            )
            summaries.append(summary)
        
        return summaries

    def _get_top_result(self, raw_scores: Optional[dict]) -> Optional[str]:
        """
        Internal helper to extract the top scoring category from raw_scores.
        """
        if not raw_scores:
            return None
        
        # Check RIASEC first (primary interest type), then Big5
        riasec_scores = raw_scores.get("RIASEC", {})
        if riasec_scores:
            top_category = max(riasec_scores.items(), key=lambda x: x[1])
            return f"{top_category[0]} - {top_category[1]}"
        
        big5_scores = raw_scores.get("BIG5", {})
        if big5_scores:
            top_category = max(big5_scores.items(), key=lambda x: x[1])
            return f"{top_category[0]} - {top_category[1]}"
        
        return None

    async def get_session_results_with_recommendations(self, db: AsyncSession, session_id: int) -> dict:
        """
        Retrieves session results and generates recommendations in one go.
        This thins the router by moving orchestration to the service.
        """
        session = await self.get_session(db, session_id)
        if not session:
            return None
            
        if not session.raw_scores:
            return {"scores": None, "recommendations": [], "user_id": session.user_id}
            
        recommendations = recommendation_service.generate_recommendations(session.raw_scores)
        
        return {
            "scores": session.raw_scores,
            "recommendations": recommendations,
            "user_id": session.user_id
        }

assessment_service = AssessmentService()
